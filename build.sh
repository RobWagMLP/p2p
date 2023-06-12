echo "Building selected environment \"$environment\""
envFile=".env"
cp "env/$environment.env" "$envFile"
source "$envFile"
echo "Building $environment"

sudo -u postgres psql -c 'create database pssrv where NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pssrv')\gexec'

sh dbdeploy.sh

npx ts-node-esm src/server.ts
