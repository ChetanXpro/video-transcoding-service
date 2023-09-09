const AWS = require("aws-sdk");
const fs = require("fs");
const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
});

const generatePreSignedGetUrl = async (payload) => {
  try {
    console.log(
      JSON.stringify(`[GET S3 DOWNLOAD URL SERVICE] ${JSON.stringify(payload)}`)
    );

    const { s3ObjectKey, s3Bucket } = payload;

    const URL_EXPIRATION_TIME = 60000;

    const myBucket = new AWS.S3({
      params: { Bucket: s3Bucket },
      accessKeyId: process.env.ACCESS_KEY,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
      region: process.env.REGION,
    });
    return new Promise((resolve, reject) => {
      myBucket.getSignedUrl(
        "getObject",
        {
          Key: s3ObjectKey,
          // ContentType: fileType,
          Expires: URL_EXPIRATION_TIME,
        },
        (err, url) => {
          if (err) {
            console.log(err);
            return reject(err);
          }
          resolve(url); // API Response Here
        }
      );
    });
  } catch (error) {
    console.log(
      JSON.stringify(
        `[GET S3 DOWNLOAD URL SERVICE ERROR] ${JSON.stringify(error)}`
      )
    );
  }
};

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

module.exports = {
  generatePreSignedGetUrl,
  uploadFileToS3,
};
