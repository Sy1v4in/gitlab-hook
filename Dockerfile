FROM node:10

WORKDIR /usr/src/app

COPY package.json .
COPY package-lock.json .
RUN npm ci
COPY . .
RUN [ "npm", "run", "build" ]

EXPOSE 8182
CMD [ "npm", "start" ]
