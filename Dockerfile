FROM node:20-alpine as build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all project files
COPY . .

# Create a sample .env file for API key (will be overridden during deployment)
RUN echo "GEMINI_API_KEY=dummy-key" > .env.local

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy font directory explicitly to ensure it's available for PDF generation
COPY --from=build /app/Roboto /usr/share/nginx/html/Roboto

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
