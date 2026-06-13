FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/client/package*.json ./apps/client/
RUN npm install --workspace=client

COPY apps/client ./apps/client
ARG VITE_API_URL
ARG VITE_NOTIFICATIONS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_NOTIFICATIONS_URL=$VITE_NOTIFICATIONS_URL
RUN npm run build --workspace=client

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
COPY apps/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
