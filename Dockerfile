# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Build-time args
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
ARG NGINX_PROXY_PASS=http://127.0.0.1:8181
ENV NGINX_PROXY_PASS=$NGINX_PROXY_PASS
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN sed -i "s|__PROXY_PASS__|${NGINX_PROXY_PASS}|g" /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
