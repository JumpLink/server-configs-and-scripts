# Installation on Debian 7

Source: http://en.enisozgen.com/policydcluebringer-installation/

```
  apt-get install postfix-cluebringer
```

## Installing some requirements for Policyd

```
  apt-get install mysql-server mysql-client
  /usr/bin/perl -MCPAN -e 'install Net::Server'
  /usr/bin/perl -MCPAN -e 'install Net::CIDR'
  apt-get install libconfig-inifiles-perl
  apt-get install libcache-fastmmap-perl
  /usr/bin/perl -MCPAN -e 'install Mail::SPF '
```

## Set-up the Cluebringer database

Source: http://uname.pingveno.net/blog/index.php/post/2015/03/11/Configure-sender-rate-limits-to-prevent-spam,-using-cluebringer-(policyd)-with-Postfix and http://en.enisozgen.com/policydcluebringer-installation/

```
  mkdir policyd-cluebringer
  cd policyd-cluebringer
  wget http://download.policyd.org/v2.0.14/cluebringer-v2.0.14.tar.xz
  unxz -c clue* | tar xv
  cd clue*
  cd database
  for i in core.tsql accesscontrol.tsql quotas.tsql amavis.tsql checkhelo.tsql checkspf.tsql greylisting.tsql
  do
  ./convert-tsql mysql55 $i
  done > policyd.mysql
```

```
  mysql -u root -p
```

```
  mysql> CREATE DATABASE cluebringer;
  mysql> CREATE USER 'cluebringer'@'localhost' IDENTIFIED BY 'mypassword';
  mysql> GRANT ALL PRIVILEGES ON cluebringer.* TO 'cluebringer'@'localhost';
  mysql> USE cluebringer;
  mysql> \. policyd.mysql
  mysql> quit
  mysql> Bye
```

TODO Error Message
```
  ERROR 1064 (42000): You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'ERROR: Cannot open file 'accesscontrol.tsql'
  ...
  ERROR 1146 (42S02): Table 'cluebringer.quotas' doesn't exist
  ERROR 1146 (42S02): Table 'cluebringer.quotas' doesn't exist

```

## Cluebringer-webui Configuration

```
  [nano|vim] /etc/cluebringer/cluebringer-webui.conf
```

```
  $DB_DSN="mysql:host=localhost;dbname=cluebringer";
  $DB_USER="cluebringer";
  $DB_PASS="mypassword";
```

```
  cp /usr/share/doc/postfix-cluebringer-webui/examples/httpd/cluebringer-httpd.conf /etc/apache2/conf.d/
  vim /etc/apache2/conf.d/cluebringer-httpd.conf
```

```
  <VirtualHost 46.4.99.115:80 >
    ServerName "cluebringer.flynx.de:80"
    ServerAdmin admin@flynx.de
    DocumentRoot /usr/share/postfix-cluebringer-webui/webui
    <Directory /usr/share/postfix-cluebringer-webui/webui/>
        DirectoryIndex index.php
    </Directory>
    ErrorLog /var/log/apache2/error.log
    LogLevel warn
    CustomLog /var/log/apache2/access.log combined
    ServerSignature On
  </VirtualHost>
```

# Configure
http://uname.pingveno.net/blog/index.php/post/2015/03/11/Configure-sender-rate-limits-to-prevent-spam,-using-cluebringer-(policyd)-with-Postfix

https://i-mscp.net/index.php/Thread/9790-Limit-the-number-of-daily-emails-sent-per-user-or-domain/