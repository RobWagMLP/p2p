environment=$1

echo "Building selected environment \"$environment\""
envFile=".env"
cp "env/$environment.env" "$envFile"

echo "Building database"

sudo -u postgres psql -c "select 'create database pssrv' where NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pssrv');"

sh dbdeploy.sh
