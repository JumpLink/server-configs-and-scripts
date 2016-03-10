#!/bin/bash
# replace special plesk nginx site configs with custom configs
echo "Replace /etc/nginx/plesk.conf.d/vhosts/cronjob.mediamor.de.conf with /root/server-configs-and-scripts/minicron/nginx.conf"
rm /etc/nginx/plesk.conf.d/vhosts/cronjob.mediamor.de.conf
ln -s /root/server-configs-and-scripts/minicron/nginx.conf /etc/nginx/plesk.conf.d/vhosts/cronjob.mediamor.de.conf

echo "Replace /etc/nginx/plesk.conf.d/vhosts/git.mediamor.de.conf with /root/server-configs-and-scripts/gogs/plesk-nginx.conf"
rm /etc/nginx/plesk.conf.d/vhosts/git.mediamor.de.conf
ln -s /root/server-configs-and-scripts/gogs/plesk-nginx.conf /etc/nginx/plesk.conf.d/vhosts/git.mediamor.de.conf

echo "Replace /etc/nginx/plesk.conf.d/vhosts/hosting.mediamor.de.conf with /root/server-configs-and-scripts/plesk/ngnix.conf"
rm /etc/nginx/plesk.conf.d/vhosts/hosting.mediamor.de.conf
ln -s /root/server-configs-and-scripts/plesk/ngnix.conf /etc/nginx/plesk.conf.d/vhosts/hosting.mediamor.de.conf

echo "Reload webserver nginx"
service nginx reload