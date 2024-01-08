# Video Transcoding Service

A video transcoding service built with AWS Lambda, ECS, and FFmpeg for editing audio and video files programmatically.

## Functions

### Auth Function (/video-transcoder)

This is main serverless express api which will trigger jobs and handle auth and db updates

### ECS Task (/ecs-task)

This Docker container has FFmpeg installed and is used to transcode videos efficiently. and then upload those diff videos to s3

### Trigger Service (/triggerAPI)
This function will get triggers from S3 , then it will just call main serverless api and send s3 event data.

## Video Transcoding

FFmpeg is used to transcode videos into multiple resolutions:

- 144p
- 360p
- 1080p



3. Build and deploy the Lambda functions, Docker container, and web UI.

4. Start transcoding videos with ease!


