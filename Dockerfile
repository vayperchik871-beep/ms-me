FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund --ignore-scripts

COPY server/package.json server/package-lock.json server/
RUN cd server && npm install --no-audit --no-fund

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3001

WORKDIR /app/server
CMD ["node", "index.js"]
