# Use lightweight Node.js image
FROM node:24-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first (better caching - only reinstalls if these change)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the source code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Expose the port the app runs on
EXPOSE 8000

# Start the production server
CMD ["npm", "start"]