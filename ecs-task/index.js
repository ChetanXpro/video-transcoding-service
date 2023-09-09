const { default: axios } = require("axios");
const { generatePreSignedGetUrl, uploadFileToS3 } = require("./utils/s3Helper");
const {
  downloadVideo,
  runParallelFFmpegCommands,
  checkIfFileExists,
  removeFileExtension,
} = require("./utils/videoProcessing");

// Dummy filenames for testing purpose only

let ffmpegCommands = [];
let allFiles = [];

let videoFormats = [
  { name: "144p", scale: "256:144" },
  { name: "360p", scale: "640:360" },
  { name: "1080p", scale: "1920:1080" },
];

const marktaskCompleted = async (userId, videoId, allFiles) => {
  const res = await axios.post(
    "https://webhook.site/8ec4f54b-02a0-4218-8a6f-0bf3fb93a1f6",
    {
      userID: userId,
      videoId,
      progress: 3,
      hostedFiles: allFiles,
    }
  );

  if (res.status === 200) {
    console.log("Webhook called successfully");
  }

  process.exit();
};

(async function () {
  try {
    console.log("========= Start ==========");

    const videoToProcess = process.env.VIDEO_NAME;

    if (!videoToProcess) {
      console.log("Video Name env not found");
      process.exit();
    }

    const userId = videoToProcess.split("-")[0];

    const url = await generatePreSignedGetUrl({
      s3ObjectKey: videoToProcess,
      s3Bucket: "video-transcodingg/temp",
    });

    if (!url) {
      console.log("Video URL not found");
      process.exit();
    }

    console.log("Video URL:", url);

    await downloadVideo(url, videoToProcess);

    // Construct command
    // FOR EXAMPLE:  ffmpeg -i ${inputvideo} -y -vf scale=1920:1080 -c:v libx264 -c:a copy -f mp4 ${outputvideo}

    const outputvideoName = removeFileExtension(videoToProcess);

    videoFormats.forEach((format) => {
      ffmpegCommands.push(
        `-i ${videoToProcess} -y -vf scale=${
          format.scale
        } -c:v libx264 -c:a copy -f mp4 ${outputvideoName + format.name}.mp4`
      );
      allFiles.push(`${outputvideoName + format.name}.mp4`);
    });

    await runParallelFFmpegCommands(ffmpegCommands);

    checkIfFileExists(allFiles);

    let uploadPromises = [];

    allFiles.map((file) => {
      uploadPromises.push(uploadFileToS3(file, process.env.S3_BUCKET));
    });

    console.log("Uploading files to S3", uploadPromises);

    const results = await Promise.allSettled(uploadPromises);

    const allSuccessful = results.every(
      (result) => result.status === "fulfilled"
    );

    if (allSuccessful) {
      console.log("All uploads completed successfully");
      marktaskCompleted(userId, videoToProcess, allFiles);
    } else {
      console.log("Some uploads failed. Details:");

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          console.log(`Upload ${index + 1}: Fulfilled`);
        } else {
          console.error(
            `Upload ${index + 1}: Rejected with error:`,
            result.reason
          );
        }
      });
      process.exit();
    }
  } catch (error) {
    console.log("Error:", error);
    process.exit();
  }
})();
