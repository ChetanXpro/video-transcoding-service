const fs = require("fs");
const axios = require("axios");
const { exec } = require("child_process");
const { promisify } = require("util");
const execPromise = promisify(exec);

async function runParallelFFmpegCommands(commands) {
  console.log("Commands to run:", commands);
  const promises = commands.map((ffmpegCommand) => {
    try {
      return execPromise(`ffmpeg ${ffmpegCommand}`);
    } catch (error) {
      console.log(`FFmpeg process failed: ${error}`);
      process.exit();
    }
  });

  try {
    const results = await Promise.all(promises);
    console.log("All FFmpeg processes completed successfully:");
    results.forEach(({ stdout, stderr }, index) => {
      console.log(`Result for command ${index + 1}:`);
      //   console.log(`STDOUT: ${stdout}`);
      //   console.error(`STDERR: ${stderr}`);
    });
  } catch (error) {
    console.error("Error running FFmpeg processes:", error);
    process.exit();
  }
}

const checkIfFileExists = (fileList) => {
  fileList.forEach((file) => {
    if (!fs.existsSync(file)) {
      throw new Error(`${file} does not exist`);
    }
  });
};

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
    console.log("Error downloading video: " + error.message);
    process.exit();
  }
};

function removeFileExtension(videoName) {
  const lastDotIndex = videoName.lastIndexOf(".");

  if (lastDotIndex !== -1 && lastDotIndex > 0) {
    return videoName.substring(0, lastDotIndex);
  }

  return videoName;
}

module.exports = {
  runParallelFFmpegCommands,
  downloadVideo,
  checkIfFileExists,
  removeFileExtension,
};
