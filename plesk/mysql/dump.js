var mysql      = require('mysql');
var mysqlDump = require(__dirname + '/mysqldump/dist/cjs.js'); // https://github.com/assignar/mysqldump
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var async = require('async');
var moment = require('moment');
var FtpClient = require('ftp'); // https://github.com/mscdex/node-ftp
var archiver = require('archiver'); // https://github.com/archiverjs/node-archiver

var backupFtpOptions = require('./backupFtpOptions.json');
var mysqlOptions = {
    connection: {
	user: 'admin',
        socketPath: '/var/run/mysqld/mysqld.sock',
	host: 'localhost'
    },
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

mkdirpFtp = function(Ftp, dir, cb) {
    console.log("ftp: mkdir "+dir);
    Ftp.mkdir(dir, true, cb);
}

uploadZip = function (Ftp, mysqlOptions, cb) {
    var dest = path.join('/mysql_dumps', mysqlOptions.zipFilename);
    console.log("ftp: "+mysqlOptions.zipFilename+" -> ftp://"+backupFtpOptions.host+dest);
    Ftp.put(mysqlOptions.zipDest, dest, cb);
}

var mysqlDumps = function(Ftp, databases, mysqlOptions, cb) {
    var timestamp = getTimestamp();
    mkdirp(mysqlOptions.destDir, function (err) {
        if (err) return cb(err)
        mkdirpFtp(Ftp, '/mysql_dumps', function() {
            async.eachSeries(databases, function(database, callback) {
                mysqlOptions.connection.database = database;
                mysqlOptions.dumpToFile = path.join(mysqlOptions.destDir, database+"_"+timestamp+".sql");
                console.log("mysql dump: "+database+" -> "+mysqlOptions.dumpToFile);
                // console.log('with options', mysqlOptions);
                mysqlDump(mysqlOptions)
                .then((_) => {
                    // create zip
                    var zipArchive = archiver('zip');
                    mysqlOptions.zipFilename = database+"_"+timestamp+".zip";
                    mysqlOptions.zipDest = path.join(mysqlOptions.destDir,  mysqlOptions.zipFilename);
                    var zipOutput = fs.createWriteStream(mysqlOptions.zipDest);
                    zipOutput.on('close', function() {
                        console.log("zip: "+mysqlOptions.destDir+" -> "+mysqlOptions.zipDest+" ("+zipArchive.pointer()+" total bytes)");
                        uploadZip(Ftp, mysqlOptions, callback);
                    });
                    zipArchive.on('error', callback);
                    zipArchive.pipe(zipOutput);
                    zipArchive.file(mysqlOptions.dumpToFile, {name: database+"_"+timestamp+".sql"}).finalize();
                })
                .catch((error) => {
                    console.error(error);
                    return callback();
                });
            }, cb);
        });
    });
}

getPleskMySQLPassword(function(err, pw) {
    if (err) throw err;
    mysqlOptions.connection.password = pw;
    var connection = mysql.createConnection(mysqlOptions.connection);
    getDatabases(connection, function(err, databases) {
        connection.end();
        if (err) throw err;
        var Ftp = new FtpClient();
        Ftp.on('ready', function() {
            mysqlDumps(Ftp, databases, mysqlOptions, function(err, results) {
                if (err) throw err;
                console.log("done");
                Ftp.end();
            });
        });
        Ftp.on('ready', function() {
            Ftp.on('close', function(err) {
                if(err) throw err;
                // process.exit(0);
            });
        });
        Ftp.connect(backupFtpOptions);
    }); 
});

