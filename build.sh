echo "Building selected environment \"$environment\""
envFile=".env"
cp "env/$environment.env" "$envFile"
source "$envFile"
echo "Building $environment"

npm run
