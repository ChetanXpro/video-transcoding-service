const { default: axios } = require("axios");
const { generatePreSignedGetUrl, uploadFileToS3 } = require("./utils/s3Helper");
const {
  downloadVideo,
  runParallelFFmpegCommands,
  checkIfFileExists,
  removeFileExtension,
} = require("./utils/videoProcessing");
const { VIDEO_PROCESS_STATES } = require("./utils/const");

let ffmpegCommands = [];
let allFiles = [];

let videoFormats = [
  { name: "144p", scale: "256:144" },
  // { name: "360p", scale: "640:360" },
  // { name: "1080p", scale: "1920:1080" },
];

const marktaskCompleted = async (userId, videoId, allFilesObject) => {
  try {
    const webhook = process.env.WEBHOOK_URL;
    console.log("Webhook URL:", webhook);
    const res = await axios.post(webhook, {
      userID: userId,
      videoId,
      progress: VIDEO_PROCESS_STATES.COMPLETED,
      hostedFiles: allFilesObject,
    });

    if (res.status === 200) {
      console.log("Webhook called successfully");
    }
  } catch (error) {
    console.log("Error Axios call:", error);
    process.exit();
  }
};

const marktaskFailed = async (userId, videoId) => {
  try {
    const webhook = process.env.WEBHOOK_URL;
    console.log("Webhook URL:", webhook);
    const res = await axios.post(webhook, {
      userID: userId,
      videoId,
      progress: VIDEO_PROCESS_STATES.FAILED,
      hostedFiles: {},
    });

    if (res.status === 200) {
      console.log("Webhook called successfully");
    }
  } catch (error) {
    console.log("Error Axios call:", error);
    throw error;
  }
};

(async function () {
  try {
    console.log("========= Start ==========");

    const videoToProcess = process.env.VIDEO_NAME;

    if (!videoToProcess) {
      console.log("Video Name env not found");
      process.exit();
    }

    const userId = process.env.USER_ID;

    if (!userId) {
      console.log("User ID env not found");
      process.exit();
    }

    const url = await generatePreSignedGetUrl({
      s3ObjectKey: videoToProcess,
      s3Bucket: process.env.TEMP_S3_BUCKET,
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
        } -c:v libx264 -c:a copy -f mp4 ${
          outputvideoName + "-" + format.name
        }.mp4`
      );
      allFiles.push(`${outputvideoName + "-" + format.name}.mp4`);
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

      let allFilesObject = {};

      allFiles.map((file) => {
        if (file.includes("144p")) {
          allFilesObject["144p"] = file;
        } else if (file.includes("360p")) {
          allFilesObject["360p"] = file;
        } else if (file.includes("720p")) {
          allFilesObject["720p"] = file;
        } else if (file.includes("1080p")) {
          allFilesObject["1080p"] = file;
        }
      });

      marktaskCompleted(userId, videoToProcess, allFilesObject);
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

      marktaskFailed(userId, videoToProcess);
      process.exit();
    }
  } catch (error) {
    console.log("Error:", error);
    process.exit();
  }
})();
