FROM node:lts

# service name of docker-compose since it is networked by bridge network
ENV POSTGRES_HOST   = 0.0.0.0
ENV POSTGRES_USER   = postgres
ENV POSTGRES_PW     = pwpostgres
ENV POSTGRES_PORT   = 5432
ENV POSTGRES_DB     = pssrv

ENV APP_PORT=4430
ENV APP_HOST=127.0.0.1

ENV HTTP_API_KEY=someApiKey
ENV CERT_CERT=someCert
ENV CERT_KEY=someKey

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

# Create user and configure permissions
RUN groupadd -r -g 1000 user && useradd -r -g user -u 1000 user
RUN chown -R user:user /app
USER user

EXPOSE $EXPOSED_PORT_ARG

CMD ["npm", "run"]