# Stage 1: Build the Ionic app
FROM node:18 AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install project dependencies
RUN npm install --legacy-peer-deps

# Install Ionic CLI globally
RUN npm install -g @ionic/cli

# Copy the rest of the project files
COPY . .

# Build the Ionic app
RUN ionic build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY scoreplay_nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built app from the previous stage
COPY --from=builder /app/www /usr/share/nginx/html

# Copy manifest file for PWA
COPY manifest.json /usr/share/nginx/html

# Expose the port on which Nginx will run
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]