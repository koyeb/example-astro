FROM node:lts-alpine

WORKDIR /app
COPY . .

RUN npm ci
RUN npm run build

ARG PORT
EXPOSE ${PORT:-4321}

CMD npm run start
