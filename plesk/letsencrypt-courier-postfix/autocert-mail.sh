#!/bin/bash

DOMAINS=("mediamor.de" "cux-veranstaltungen.de")
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

# Stopt Apache2
service apache2 stop

# Erneuert das Zertifikat 
/root/.local/share/letsencrypt/bin/letsencrypt certonly --renew --standalone --email glenz@mediamor.de $ARGS

# Startet Apache2 wieder
service apache2 start

# Altes letsencrypt Zertifikat verschieben falls vorhanden
if [ -f /etc/letsencrypt/live/${DOMAINS[0]}/fullchainprivkey.pem ]
then
  mv /etc/letsencrypt/live/${DOMAINS[0]}/fullchainprivkey.pem /etc/letsencrypt/live/${DOMAINS[0]}/fullchainprivkey.pem.$(timestamp)
fi

# Private Key und Zertifikat zusammen fügen
cat /etc/letsencrypt/live/${DOMAINS[0]}/privkey.pem /etc/letsencrypt/live/${DOMAINS[0]}/fullchain.pem > /etc/letsencrypt/live/${DOMAINS[0]}/fullchainprivkey.pem

# Postfix Certs
if [ -f /etc/postfix/postfix_default.pem ]
then
  mv /etc/postfix/postfix_default.pem /etc/postfix/postfix_default.pem.$(timestamp)
fi

# Symbolischen Link anlegen
ln -s -f /etc/letsencrypt/live/${DOMAINS[0]}/fullchainprivkey.pem /etc/postfix/postfix_default.pem

# postfix neu starten
service postfix reload

# Courier Certs
if [ -f /usr/share/imapd.pem ]
then
  mv /usr/share/imapd.pem /usr/share/imapd.pem.$(timestamp)
fi

# Courier pop3 SSL Konfiguration neu laden
service courier-pop3s reload

# Symbolischen Link anlegen
ln -s -f /etc/letsencrypt/live/${DOMAINS[0]}/fullchainprivkey.pem /usr/share/imapd.pem

if [ -f /usr/share/pop3d.pem ]
then
  mv /usr/share/pop3d.pem /usr/share/pop3d.pem.$(timestamp)
fi

# Symbolischen Link anlegen
ln -s -f /etc/letsencrypt/live/${DOMAINS[0]}/fullchainprivkey.pem /usr/share/pop3d.pem

# Courier IMAP SSL Konfiguration neu laden
service courier-imaps reload