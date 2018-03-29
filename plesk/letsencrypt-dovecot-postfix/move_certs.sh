#!/bin/bash


DOMAINS=("mediamor.de")
ARGS=""

for index in ${!DOMAINS[*]}
do
  ARGS="$ARGS -d ${DOMAINS[$index]} -d mail.${DOMAINS[$index]} -d smtp.${DOMAINS[$index]} -d imap.${DOMAINS[$index]} -d pop.${DOMAINS[$index]}"
done


# Define a timestamp function
timestamp() {
  date +"%m-%d-%y_%T"
}

echo "$(timestamp): Start Script for Domain $ARGS"

# Altes zusammengeführtes letsencrypt Zertifikat verschieben falls vorhanden
if [ -f /etc/letsencrypt/live/${DOMAINS[0]}/fullchainprivkey.pem ]
then
  mv /etc/letsencrypt/live/${DOMAINS[0]}/fullchainprivkey.pem /etc/letsencrypt/live/${DOMAINS[0]}/fullchainprivkey.pem.$(timestamp)
fi

# Private Key und Zertifikat zusammen fügen
cat /etc/letsencrypt/live/${DOMAINS[0]}/privkey.pem /etc/letsencrypt/live/${DOMAINS[0]}/fullchain.pem > /etc/letsencrypt/live/${DOMAINS[0]}/fullchainprivkey.pem;

# Postfix Certs
mv /etc/postfix/postfix.pem /etc/postfix/postfix.pem.backup.$(timestamp);
# Symbolischen Link anlegen
ln -s /etc/letsencrypt/live/${DOMAINS[0]}/fullchainprivkey.pem /etc/postfix/postfix.pem;

# Dovecot Certs
mv /etc/dovecot/private/ssl-cert-and-key.pem /etc/dovecot/private/ssl-cert-and-key.pem.backup.$(timestamp);
ln -s /etc/letsencrypt/live/${DOMAINS[0]}/fullchainprivkey.pem /etc/dovecot/private/ssl-cert-and-key.pem;

# new cert filename?
mv /etc/dovecot/private/dovecot.pem /etc/dovecot/private/dovecot.pem.backup.$(timestamp);
ln -s /etc/letsencrypt/live/${DOMAINS[0]}/fullchainprivkey.pem /etc/dovecot/private/dovecot.pem;


service dovecot restart
service postfix restart
