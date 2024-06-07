#Create development image of react app using yarn dev
FROM node:20-alpine as build

WORKDIR /app

COPY yarn.lock .

RUN yarn install

COPY . .

ENTRYPOINT [ "yarn dev" ]