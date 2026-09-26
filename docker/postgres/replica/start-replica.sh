#!/bin/sh
set -e

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "cloning primary via pg_basebackup..."
  pg_basebackup -h postgres -U replicator -D "$PGDATA" -Fp -Xs -R -P
fi

exec postgres -c hot_standby=on
