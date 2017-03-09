#! /bin/sh

: ${WTAIL_HOST="0.0.0.0"}
: ${WTAIL_PORT="1337"}
: ${WTAIL_WORKDIR="/workdir"}
: ${WTAIL_PREFIX=""}

find * -type f -exec sh -c "tail -F -n100 {} | /app/wtail/cli/rtail-client.js --id $WTAIL_PREFIX{} --host $WTAIL_HOST --port $WTAIL_PORT & " \;

inotifywait -m . -r -e create -e moved_to |
  while read path action file; do
    echo "Forwarding file '$file' '$path' via '$action'"
    sh -c "tail -F -n100 $file | /app/wtail/cli/rtail-client.js --id $WTAIL_PREFIX$file --host $WTAIL_HOST --port $WTAIL_PORT & "
  done
