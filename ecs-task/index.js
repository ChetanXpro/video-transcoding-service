const { exec } = require("child_process");
const { promisify } = require("util");
const axios = require("axios");
const fs = require("fs");
const execPromise = promisify(exec);
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION, // Replace with your AWS region
});

async function uploadFileToS3(fileName, bucketName) {
  const fileData = fs.readFileSync(fileName);
  return new Promise((resolve, reject) => {
    s3.upload(
      {
        Bucket: bucketName,
        Key: fileName,
        Body: fileData,
      },
      (err, data) => {
        if (err) {
          console.log("Error", err);
          reject(err);
        } else {
          console.log(`File uploaded successfully. ${data.Location}`);
          resolve(data);
        }
      }
    );
  });
}

async function runParallelFFmpegCommands(commands) {
  const promises = commands.map((ffmpegCommand) => {
    try {
      return execPromise(`ffmpeg ${ffmpegCommand}`);
    } catch (error) {
      throw new Error(`FFmpeg process failed: ${error}`);
    }
  });

  try {
    const results = await Promise.all(promises);
    console.log("All FFmpeg processes completed successfully:");
    results.forEach(({ stdout, stderr }, index) => {
      console.log(`Result for command ${index + 1}:`);
      console.log(`STDOUT: ${stdout}`);
      console.error(`STDERR: ${stderr}`);
    });
  } catch (error) {
    console.error("Error running FFmpeg processes:", error);
  }
}

const downloadVideo = async (url, destination) => {
  try {
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    const writer = fs.createWriteStream(destination);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (error) {
    throw new Error("Error downloading video: " + error.message);
  }
};

// Dummy filenames for testing purpose only
const videoName = "video.mp4";
const cleanName = "yt";

const checkIfFileExists = (fileList) => {
  fileList.forEach((file) => {
    if (!fs.existsSync(file)) {
      throw new Error(`${file} does not exist`);
    }
  });
};

let ffmpegCommands = [];
let allFiles = [];

let videoFormats = [
  { name: "144p", scale: "256:144" },
  { name: "360p", scale: "640:360" },
  { name: "1080p", scale: "1920:1080" },
];

(async function () {
  console.log("========= Start ==========");

  //   await downloadVideo("", videoName);

  videoFormats.forEach((format) => {
    ffmpegCommands.push(
      `-i ${videoName} -vf scale=${format.scale} -c:v libx264 -c:a copy ${
        cleanName + format.name
      }.mp4`
    );
    allFiles.push(`${cleanName + format.name}.mp4`);
  });

  await runParallelFFmpegCommands(ffmpegCommands);

  checkIfFileExists(allFiles);

  let uploadPromises = [];

  allFiles.map((file) => {
    uploadPromises.push(uploadFileToS3(file, process.env.S3_BUCKET));
  });

  await Promise.allSettled(uploadPromises);
})();
