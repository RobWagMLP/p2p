#!/bin/bash
ACTION="$1"
if [ -z "$ACTION" ]; then ACTION="migrate"; fi
flyway "$ACTION" \
 -locations="filesystem:database/sql/data,filesystem:database/sql/ddl,filesystem:database/sql/sp" \
 -user=postgres \
 -url="jdbc:postgresql:pssrv" \
 -password=pwpostgres \
 -schemas=public,sepa \
 -group=true \
 -table=schema_version \
 -placeholders.client=ndpay \
 -placeholders.stage="local" \
 -outputFile=flyway.log
