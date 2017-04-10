#! /bin/sh

cat <<'EOF'
          _        _ _
__      _| |_ __ _(_) |
\ \ /\ / / __/ _` | | |
 \ V  V /| || (_| | | |
  \_/\_/  \__\__,_|_|_|

EOF

: ${WTAIL_HOST="0.0.0.0"}
: ${WTAIL_PORT="1337"}
: ${WTAIL_WORKDIR="/workdir"}
: ${WTAIL_PREFIX=""}

cd $WTAIL_WORKDIR
find * -type f -exec sh -c "tail -F -n100 {} | /app/wtail/cli/rtail-client.js --id $WTAIL_PREFIX{} --host $WTAIL_HOST --port $WTAIL_PORT & " \;

inotifywait -m . -r -e create -e moved_to |
  while read path action file; do
    echo "Forwarding file '$file' '$path' via '$action'"
    sh -c "tail -F -n100 $path/$file | /app/wtail/cli/rtail-client.js --id $WTAIL_PREFIX"${path#./}"$file --host $WTAIL_HOST --port $WTAIL_PORT & "
  done
