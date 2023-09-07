# Video Transcoding Service

A video transcoding service built with AWS Lambda, ECS, and FFmpeg for editing audio and video files programmatically.

## Functions

### Auth Function (/auth)

This function checks if a user is authorized. If authenticated, it returns a presigned PUT URL.

### ECS Task (/ecs-task)

This Docker container has FFmpeg installed and is used to transcode videos efficiently. and then uplod those diff videos to s3

### Trigger Service (/trigger-service)

This function is triggered by S3 when someone uploads any video using a presigned PUT URL.

### Web UI (/webui)

A basic frontend for the video transcoding service, allowing users to upload video and initiate video transcoding.

## Video Transcoding

FFmpeg is used to transcode videos into multiple resolutions:

- 144p
- 360p
- 1080p

## Getting Started

Follow these steps to set up and run the video transcoding service:

1. Clone the repository: `git clone https://github.com/yourusername/videotranscoder.git`

2. Set up the AWS resources and services as described in the project documentation.

3. Build and deploy the Lambda functions, Docker container, and web UI.

4. Start transcoding videos with ease!

## Usage

Provide usage examples and instructions on how to use your service and its components. You can include code snippets, API endpoints, or screenshots.

### Example:

To authorize a user and get a presigned PUT URL:

```bash
curl -X POST https://your-api-endpoint.com/auth
