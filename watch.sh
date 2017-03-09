#! /bin/sh
mkdir -p /logs
cd /logs

sleep 10

find . -type f -exec sh -c "tail -F -n100 {} | /app/wtail/cli/rtail-client.js --id {} --host wtail & " \;

inotifywait -m . -r -e create -e moved_to |
  while read path action file; do
    echo "Forwarding file '$file' '$path' via '$action'"
    sh -c "tail -F -n100 {} | /app/wtail/cli/rtail-client.js --id {} --host wtail & "
  done
