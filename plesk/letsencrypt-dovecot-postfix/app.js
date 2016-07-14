/**
 * Script um Besitzer (chown) von Domainordnern (von Plesk angelegt) recursiv zu setzen
 * wie sie von den entsprechenden Wurzelverzeichnissen vorgegeben sind.
 * Nützlich wenn Domains von einer alten Pleskversion migriert wurden.  
 */

var fs = require('fs');
var path = require('path');
var exec = require( "child_process" ).exec;
var punycode = require('punycode'); // https://github.com/bestiejs/punycode.js/


var timestamp = function () {
  return Date.now();
}

var stopNginx = function (cb) {
    var command = "service nginx stop";
    exec( command, function(error, stdout, stderr) {
        if(error) {
            return cb(new Error(error));
        }
        if(stderr) {
            return cb(new Error(stderr));
        }
        if(stdout) {
            console.log(stdout);
        }
        return cb(null);
    });
}

var startNginx = function (cb) {
    var command = "service nginx start";
    exec( command, function(error, stdout, stderr) {
        if(error) {
            return cb(new Error(error));
        }
        if(stderr) {
            return cb(new Error(stderr));
        }
        if(stdout) {
            console.log(stdout);
        }
        return cb(null);
    });
}


var encrypt = function(domains, email, cb) {
    var args = "";
    
    domains.forEach(function(domain) {
        args+= " -d "+domain+" -d mail."+domain+" -d smtp."+domain+" -d imap."+domain+" -d pop."+domain;
    }, this);
    
    var command="letsencrypt certonly --standalone --email "+email+" "+args;
    
    
    console.log(command);
    exec( command, function(error, stdout, stderr) {
        if(error) {
            return cb(new Error(error));
        }
        if(stderr) {
            return cb(new Error(stderr));
        }
        if(stdout) {
            console.log(stdout);
        }
        return cb(null);
    });
    cb(null);
}

var domains = ['mediamor.de'];

console.log("Domains\n", domains);

var moveCerts = function (domains, cb) {

    var commands = "cat /etc/letsencrypt/live/"+domains[0]+"/privkey.pem /etc/letsencrypt/live/"+domains[0]+"/fullchain.pem > /etc/letsencrypt/live/"+domains[0]+"/fullchain1-and-privkey1.pem;";
    
    commands += "mv /etc/postfix/postfix_default.pem /etc/postfix/postfix_default.pem.backup;";
    commands += "ln -s newCertPath /etc/postfix/postfix_default.pem;";

    commands += "mv /etc/dovecot/private/ssl-cert-and-key.pem /etc/dovecot/private/ssl-cert-and-key.pem.backup;";
    commands += "ln -s /etc/letsencrypt/live/"+domains[0]+"/fullchain1-and-privkey1.pem /etc/dovecot/private/ssl-cert-and-key.pem;";

    commands += "service dovecot restart";


    console.log(commands);
    exec( commands, function(error, stdout, stderr) {
        if(error) {
            return cb(new Error(error));
        }
        if(stderr) {
            return cb(new Error(stderr));
        }
        if(stdout) {
            console.log(stdout);
        }
        return cb(null);
    });

}

stopNginx(function(err) {
    if(err) {
        throw err;
    }
    
    encrypt(domains, 'glenz@mediamor.de', function() {
        if(err) {
            throw err;
        }
        
	    moveCerts(domains, function(err) {
            if(err) {
                throw err;
            }

            startNginx(function(err) {
                if(err) {
                    throw err;
                }
            });

        });


    });
});


