# -- Builder stage --
FROM node:24-alpine AS builder

# Declare build-time argument
ARG VITE_API_BASE_URL

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build


# -- Production stage -- 
FROM nginx:alpine3.22 AS runner

# Copy output from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
