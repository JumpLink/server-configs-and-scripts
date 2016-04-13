var mysql      = require('mysql');
var mysqlDump = require('mysqldump'); // https://github.com/webcaetano/mysqldump
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var async = require('async');
var moment = require('moment');
var JSFtp = require("jsftp"); // https://github.com/sergi/jsftp
var archiver = require('archiver'); // https://github.com/archiverjs/node-archiver

var backupFtpOptions = require('./backupFtpOptions.json');
var mysqlOptions = {
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

        async.mapSeries(databases, function(database, callback) {
            mysqlOptions.database = database;
            mysqlOptions.dest = path.join(mysqlOptions.destDir, database+"_"+timestamp+".sql");
            console.log("mysql dump: "+database+" -> "+mysqlOptions.dest);
            mysqlDump(mysqlOptions, function(err) {
                if (err) return cb(err);
                // create zip
                var zipArchive = archiver('zip');
                mysqlOptions.zipFilename = database+"_"+timestamp+".zip");
                mysqlOptions.zipDest = path.join(mysqlOptions.destDir,  mysqlOptions.zipFilename);
                var zipOutput = fs.createWriteStream(mysqlOptions.zipDest);
                zipOutput.on('close', function() {
                    console.log("zip: "+mysqlOptions.dest+" -> "+mysqlOptions.zipDest+" ("+zipArchive.pointer()+" total bytes)");
                    callback(null, mysqlOptions);
                });
                zipArchive.on('error', callback);
                zipArchive.pipe(zipOutput);
                zipArchive.file(mysqlOptions.dest, {name: database+"_"+timestamp+".sql"}).finalize();
            });
            
        }, cb);
    });
}

mkdirpFtp = function(FTP, dir, cb) {
    Ftp.raw.mkd(dir, function(err, data) {
        if (err) console.error(err);

        console.log(data.text); // Show the FTP response text to the user
        console.log(data.code); // Show the FTP response code to the user
        cb(err, data);
    });
}

uploadZips = function (mysqlOptionsArray, cb) {
    var Ftp = new JSFtp(backupFtpOptions);
    mkdirpFtp(Ftp, '/mysql_dumps', function(err, data) {
        if(err) return cb(err);
        async.each(mysqlOptionsArray, function(mysqlOptions, callback) {
            ftp.put(mysqlOptions.zipDest, path.join('/mysql_dumps', mysqlOptions.zipFilename), callback);
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
        mysqlDumps(databases, mysqlOptions, function(err, mysqlOptionsArray) {
            if (err) throw err;
            console.log("done", mysqlOptionsArray);
            process.exit(0);
        });
        
    }); 
});

