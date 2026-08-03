FROM node:22-alpine AS web
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM node:22-alpine AS server
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=web /app/dist ./dist
ENV NODE_ENV=production PORT=3001 HOST=0.0.0.0
RUN mkdir -p /data
EXPOSE 3001
CMD ["node", "index.js"]
