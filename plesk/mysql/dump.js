var mysql      = require('mysql');
var mysqlDump = require('mysqldump'); // https://github.com/webcaetano/mysqldump
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var async = require('async');
var moment = require('moment');

var mysqlOptions = {
    host: null,
    port: null,
    user: 'admin',
    socketPath: '/var/run/mysqld/mysqld.sock',
    destDir: path.join(__dirname, 'mysql_dumps'),
};

var getTimestamp = function () {
    return moment().format('YY-MM-DD');
}

var getPleskMySQLPassword = function (cb) {
    fs.readFile('/etc/psa/.psa.shadow', 'utf8', function (err, data) {
        if (err) {
            return cb(err);
        }
        cb(null, data);
    });
}

var getDatabases = function (connection, cb) {
    connection.query('SHOW DATABASES', function(err, rows, fields) {
        if (err) {
            return cb(err);
        }
        var result = [];
        rows.forEach(function(row){
            result.push(row.Database);
        });

        cb(null, result);
    }); 
}

var mysqlDumps = function(databases, mysqlOptions, cb) {
    var timestamp = getTimestamp();
    mkdirp(mysqlOptions.destDir, function (err) {
        if (err) return cb(err)

        async.eachSeries(databases, function(database, callback) {
            mysqlOptions.database = database;
            mysqlOptions.dest = path.join(mysqlOptions.destDir, database+"_"+timestamp+".sql");
            console.log("mysql dump: "+database+" -> "+mysqlOptions.dest);
            mysqlDump(mysqlOptions, callback);
            
        }, cb);
    });

}

getPleskMySQLPassword(function(err, pw) {
    if (err) throw err;
    mysqlOptions.password = pw;
    var connection = mysql.createConnection(mysqlOptions);
    getDatabases(connection, function(err, databases) {
        connection.end();
        if (err) throw err;
        mysqlDumps(databases, mysqlOptions, function(err) {
            if (err) throw err;
            console.log("done");
            process.exit(0);
        });
        
    }); 
});