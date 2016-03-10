/**
 * Script um Besitzer (chown) von Domainordnern (von Plesk angelegt) recursiv zu setzen
 * wie sie von den entsprechenden Wurzelverzeichnissen vorgegeben sind.
 * Nützlich wenn Domains von einer alten Pleskversion migriert wurden.  
 */

var fs = require('fs');
var path = require('path');
var exec = require( "child_process" ).exec;
var userid = require('userid');

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


var chown = function(srcpath, stat) {
    var exec_string = "chown -R "+stat.user+":"+stat.group+" "+path.join(srcpath, stat.dirname);
    console.log(exec_string);
    exec( exec_string, function(error, stdout, stderr) {
        if(error) {
            throw new Error(error);
        }
        if(stderr) {
            throw new Error(stderr);
        }
        if(stdout) {
            console.log(stdout);
        }
        
    });
}

var chowns = function (srcpath, stats) {
    stats.forEach(function(stat) {
        chown(srcpath, stat);
    }, this);
}

var dirs = getDirectories(DOMAIN_DIRECTORIE_PATH);
var stats = getStats(DOMAIN_DIRECTORIE_PATH, dirs);

console.log("Setze Besitzer von Domainordnern");
chowns(DOMAIN_DIRECTORIE_PATH, stats);