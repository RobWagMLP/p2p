#!/bin/bash
ACTION="$1"
if [ -z "$ACTION" ]; then ACTION="migrate"; fi
flyway "$ACTION" \
 -locations="filesystem:git/P2PStream/database/sql/data,filesystem:ngit/P2PStream/database/sql/ddl,filesystem:git/P2PStream/database/sql/sp" \
 -user=postgres \
 -url="jdbc:postgresql:pssrv" \
 -password=pwpostgres \
 -schemas=public,sepa \
 -group=true \
 -table=schema_version \
 -placeholders.client=ndpay \
 -placeholders.stage="local" \
 -outputFile=flyway.log
