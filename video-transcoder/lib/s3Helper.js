const AWS = require("aws-sdk");

const generatePreSignedPutUrl = async (payload) => {
  try {
    console.log(
      JSON.stringify(`[GET S3 UPLOAD URL SERVICE] ${JSON.stringify(payload)}`)
    );
    const S3_BUCKET = process.env.S3_BUCKET;
    const REGION = process.env.REGION;
    const URL_EXPIRATION_TIME = 60000; // in seconds

    const { fileType, s3ObjectKey } = payload;
    console.log("DETAILS", fileType, s3ObjectKey);
    if (!fileType || !s3ObjectKey) {
      throw new Error("Bad Request");
    }

    const myBucket = new AWS.S3({
      accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
      params: { Bucket: S3_BUCKET },
      region: REGION,
    });

    return new Promise((resolve, reject) => {
      myBucket.getSignedUrl(
        "putObject",
        {
          Key: s3ObjectKey,
          ContentType: fileType,
          Expires: URL_EXPIRATION_TIME,
        },
        (err, url) => {
          if (err) {
            console.log("AWS ERROR", err);

            return reject(err);
          } else {
            console.log("upload url", url);
            resolve(url); // API Response Here
          }
        }
      );
    });
  } catch (error) {
    console.log(
      JSON.stringify(
        `[GET S3 UPLOAD URL SERVICE ERROR] ${JSON.stringify(error)}`
      )
    );
    throw error;
  }
};

const generatePreSignedGetUrl = async (payload) => {
  try {
    console.log(
      JSON.stringify(`[GET S3 DOWNLOAD URL SERVICE] ${JSON.stringify(payload)}`)
    );

    const { s3ObjectKey, s3Bucket } = payload;

    const URL_EXPIRATION_TIME = 60000;

    const myBucket = new AWS.S3({
      params: { Bucket: s3Bucket },
      accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
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

module.exports = {
  generatePreSignedPutUrl,
  generatePreSignedGetUrl,
};
