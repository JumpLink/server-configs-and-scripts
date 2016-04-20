/**
 * Script um Besitzer (chown) von Domainordnern (von Plesk angelegt) recursiv zu setzen
 * wie sie von den entsprechenden Wurzelverzeichnissen vorgegeben sind.
 * Nützlich wenn Domains von einer alten Pleskversion migriert wurden.  
 */

var fs = require('fs');
var path = require('path');
var exec = require( "child_process" ).exec;
var userid = require('userid');
var async = require('async');

var DOMAIN_DIRECTORIE_PATH = '/var/www/vhosts/';

var getDirectories = function (srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}

var getStats = function (srcpath, dirs) {
    var stats = [];
    dirs.forEach(function(dir) {
        var stat = fs.statSync(path.join(srcpath, dir));
        stat.dirname = dir;
        stat.user = userid.username(stat.uid);
        stat.group = userid.groupname(stat.gid);
        stats.push(stat)
    }, this);
    return stats;
}


var chown = function(stat, cb) {
    var currentPath = path.join(this.srcpath, stat.dirname);
    var regexCurrentPath = path.join(this.srcpath, "*"+stat.dirname);
    if(stat.dirname === 'system') {
        return cb(null, "ignore "+currentPath);
    }
    try {
        fs.accessSync(currentPath, fs.F_OK);
        var exec_string = "chown -R "+stat.user+":"+stat.group+" "+regexCurrentPath;
        console.log(exec_string);
        exec( exec_string, function(error, stdout, stderr) {
            if(error) {
		console.warn(error);
 		return cb(null, error);
            }
            if(stderr) {
		console.warn(stderr);
		return cb(null, stderr);
            }
            if(stdout) {
                console.log(stdout);
		return cb(null, stdout);
            }
	    return cb();
        });
    } catch (e) {
        console.warn("ignore "+currentPath);
        return cb(null, "ignore "+currentPath)
    }
}

var chowns = function (srcpath, stats, cb) {
    async.map(stats, chown.bind({ srcpath: srcpath }), cb);
}

var dirs = getDirectories(DOMAIN_DIRECTORIE_PATH);
var stats = getStats(DOMAIN_DIRECTORIE_PATH, dirs);

console.log("Setze Besitzer von Domainordnern");
chowns(DOMAIN_DIRECTORIE_PATH, stats, function(err, results) {
	if(err) throw err;
	console.log("DONE: "+DOMAIN_DIRECTORIE_PATH);
	chowns(path.join(DOMAIN_DIRECTORIE_PATH, 'system'), stats, function(err, results) {
		if(err) throw err;
		console.log("DONE: "+path.join(DOMAIN_DIRECTORIE_PATH, 'system'));
	});
});
