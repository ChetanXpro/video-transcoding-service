# video-transcoding-service


- /auth - Function to check if user is a teacher , if authenticated then it will return presign put url
- /ecs-task - Docker container with ffmpeg installed to transcode videos. (FFmpeg is a legendary multimedia processing tool used to edit audio and video files programmatically)
- /trigger-service - S3 will trigger this function when someone upload any video in s3
