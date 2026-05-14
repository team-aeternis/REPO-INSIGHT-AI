FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache git ca-certificates && update-ca-certificates

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/server.js"]
