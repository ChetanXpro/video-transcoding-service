# Use a minimal Linux image as the base
FROM alpine:latest

# Update the package lists and install Node.js for dependency installation
RUN apk update && apk add nodejs npm

# Set the working directory
WORKDIR /app

# Copy your Node.js script (e.g., index.js) and package files into the container
COPY index.js package.json video.mp4 package-lock.json ./

# Install Node.js dependencies
RUN npm install

# Install FFmpeg
RUN apk add ffmpeg

# Define the command to run your Node.js script
CMD ["node", "index.js"]
