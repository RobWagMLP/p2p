echo "Building selected environment \"$environment\""
envFile=".env"
cp "env/$environment.env" "$envFile"
source "$envFile"
echo "Building $environment"

npx ts-node-esm src/server.ts
