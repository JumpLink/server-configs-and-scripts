#!/bin/bash

cat /etc/letsencrypt/live/mediamor.de/privkey.pem /etc/letsencrypt/live/mediamor.de/fullchain.pem > /etc/letsencrypt/live/mediamor.de/fullchain1-and-privkey1.pem;

mv /etc/postfix/postfix_default.pem /etc/postfix/postfix_default.pem.backup;
ln -s newCertPath /etc/postfix/postfix_default.pem;

mv /etc/dovecot/private/ssl-cert-and-key.pem /etc/dovecot/private/ssl-cert-and-key.pem.backup;
ln -s /etc/letsencrypt/live/mediamor.de/fullchain1-and-privkey1.pem /etc/dovecot/private/ssl-cert-and-key.pem;

service dovecot restart