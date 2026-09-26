#!/bin/sh
set -e

mkdir -p "$PGDATA"
chown -R postgres:postgres "$PGDATA"
chmod 700 "$PGDATA"

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "cloning primary via pg_basebackup..."
  gosu postgres pg_basebackup -h postgres -U replicator -D "$PGDATA" -Fp -Xs -R -P
fi

exec gosu postgres postgres -c hot_standby=on
