const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: "YOUR_ACCESS_KEY_ID",
  secretAccessKey: "YOUR_SECRET_ACCESS_KEY",
  region: "YOUR_REGION", // Replace with your AWS region
});
module.exports.handler = async (event) => {
  let data;
  if (event.body) {
    if (typeof event.body === "string") {
      data = JSON.parse(event.body).data;
    } else {
      data = event.body.data;
    }
  }

  const s3 = new AWS.S3();
  const checkIfAuthenticated = (data) => {
    // !TODO - Add authentication logic here

    if (data.post === "teacher") {
      return true;
    } else {
      return false;
    }
  };

  const generatePreSignedPutUrl = async (payload) => {
    try {
      console.log(
        JSON.stringify(`[GET S3 UPLOAD URL SERVICE] ${JSON.stringify(payload)}`)
      );
      const S3_BUCKET = AWS_S3_BUCKET;
      const REGION = AWS_REGION;
      const URL_EXPIRATION_TIME = 600; // in seconds

      const { fileType, s3ObjectKey } = payload;

      const myBucket = new AWS.S3({
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
              console.error(err);

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
      throw new error();
    }
  };

  if (checkIfAuthenticated(data)) {
    const payload = {
      fileType: "video/mp4",
      s3ObjectKey: data.key,
    };
    const url = await generatePreSignedPutUrl(payload);
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: "Success",
          input: event,
          url,
        },
        null,
        2
      ),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };
};
