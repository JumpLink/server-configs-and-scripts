Anleitung und Skript um den mit Plesk betriebenen Mailserver mit "Let’s Encrypt" SSL Zertifikaten auszustatten und automatisch zu erneuern.

# Manuell

## Hinweise

* Das Zertifikat muss für die Subdomain "mail", "smtp", "imap", "pop", etc gültig sein, ansonsten bekommt man im E-Mail Client die Fehlermeldung "Zielprinzipalname stimmt nicht überein"

* Postfix version ermitteln: `postconf -d | grep mail_version` 

## Zertifikat herunterladen

* In Plesk zur Domain gespeicherte Zertifikate anzeigen:
  "Domains -> Hosting verwalten -> Websites und Domains -> Websites sichern"

* Gewünschtes Zertifikat für den MailServer herunterladen (Grüner Pfeil)

* Mit einem SFTP-Programm der Wahl auf den Server zugreifen (Vorsicht hier kann viel kaputt gemacht werden!):
  sftp://root@46.4.99.115

## Alternative: Neues Zertifikat mit letsencrypt erzeugen

```
  service apache2 stop
  ~/letsencrypt/letsencrypt-auto certonly --renew --standalone --email admin@mydomain.de -d mydomain.de -d mail.mydomain.de -d smtp.mydomain.de -d imap.mydomain.de -d pop.mydomain.de
  service apache2 start
```

### Ausgabe

```
Updating letsencrypt and virtual environment dependencies......
Requesting root privileges to run with virtualenv: /root/.local/share/letsencrypt/bin/letsencrypt certonly --renew --standalone --email admin@mydomain.de -d mydomain.de -d mail.mydomain.de -d smtp.mydomain.de -d imap.mydomain.de -d pop.mydomain.de

IMPORTANT NOTES:
 - Congratulations! Your certificate and chain have been saved at
   /etc/letsencrypt/live/mydomain.de/fullchain.pem. Your cert will expire
   on 2016-04-28. To obtain a new version of the certificate in the
   future, simply run Let's Encrypt again.
 - If you like Let's Encrypt, please consider supporting our work by:

   Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
   Donating to EFF:                    https://eff.org/donate-le

```

* Das neue Zertifikat wurde nun also im Verzeichnis /etc/letsencrypt/live/mydomain.de/fullchain.pem gespeichert und läuft 2016-04-28 ab.

* Überprüfen lässt sich das mit `ll /etc/letsencrypt/live/mydomain.de/`

* Zertifikat und Private Key zu einer Datei zusammen fassen:

```
  cat /etc/letsencrypt/live/mydomain.de/privkey.pem /etc/letsencrypt/live/mydomain.de/fullchain.pem > /etc/letsencrypt/live/mydomain.de/fullchainprivkey.pem
```

## Postfix

* Sicherheitskopie vom standard Postfix Zertifikat anlegen:
  `mv /etc/postfix/postfix_default.pem /etc/postfix/postfix_default.pem.backup`

* Zertifikat hochladen bzw. verschieben / verlinken und alten pfad ersetzen:
```
  ln -s /etc/letsencrypt/live/mydomain.de/fullchainprivkey.pem /etc/postfix/postfix_default.pem
```

* Postfix über Terminal neu laden: `service postfix reload`

## Courier

* Sicherheitskopien von Courier Zertifikaten anlegen:
  `mv /usr/share/imapd.pem /usr/share/imapd.pem.backup`
  `mv /usr/share/pop3d.pem /usr/share/pop3d.pem.backup`

* Zertifikat hochladen bzw. verschieben / verlinken und alten pfad ersetzen:
```
  ln -s /etc/letsencrypt/live/mydomain.de/fullchainprivkey.pem /usr/share/imapd.pem
  ln -s /etc/letsencrypt/live/mydomain.de/fullchainprivkey.pem /usr/share/pop3d.pem
```

* Courier SSL Konfiguration über Terminal neu laden:

```
  service courier-pop3s reload
  service courier-imaps reload
```

## Skript

* Das Skript automatisiert die manuellen Schritte

```
  ~/autocert-mail.sh
```

* Um die Scriptausgabe per Mail zu erhalten kann es wie folgt ausgeführt werden:

```
  ~/autocert-mail.sh > output ; mail -s "E-Mail Zertifikat erneuert" "admin@mydomain.de" -c "admin2@mydomain.de" < output
```

* Um das Script automatisch alle 2 Monate am 1. um 03:30 Uhr ausführen zu lassen und somit das Zertifikat zu erneuern muss dafür ein Cron-Job angelegt werden

```
  crontab -e 
```

* Folgendes eintragen

```
30 03 01 */3 * ~/autocert-mail.sh > output ; mail -s "E-Mail Zertifikat erneuert" "admin@mydomain.de" -c "admin2@mydomain.de" < output
```