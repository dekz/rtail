FROM node:alpine

RUN apk add --no-cache inotify-tools

RUN mkdir -p /app/wtail
RUN mkdir -p /logs
RUN chown -R node:node /logs

ADD .  /app/wtail
WORKDIR /app/wtail
RUN npm i
RUN chown -R node:node /app/wtail
USER node
CMD /app/wtail/cli/rtail-server.js

EXPOSE 8888
EXPOSE 1337
