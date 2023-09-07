# video-transcoding-service


- /auth - Function to check if user is authorized , if authenticated then it will return presign put url
- /ecs-task - Docker container with ffmpeg installed to transcode videos.
- /trigger-service - S3 will trigger this function when someone upload any video in s3 using presign put url
- /webui - basic frontend for video transcoding service
- FFmpeg is a legendary multimedia processing tool used to edit audio and video files programmatically
- For now transcoding into [144p, 360p, 1080p]

