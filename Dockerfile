FROM node:alpine

RUN mkdir -p /app/wtail && mkdir -p /logs && chown -R node:node /logs && chown -R node:node /app/wtail
WORKDIR /app/wtail

ADD . /app/wtail
RUN apk add --no-cache inotify-tools
RUN apk add --no-cache --virtual build-deps git \
    && su node -c "npm i --production" \
    && apk del build-deps \
    && rm -rf /var/cache/apk/*

USER node
EXPOSE 8888
EXPOSE 1337
ENTRYPOINT ["/app/wtail/cli/rtail-server.js"]
LABEL io.whalebrew.config.ports '["8888:8888", "1337:1337"]'
