const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION, // Replace with your AWS region
});

module.exports.handler = async (event) => {
  let data;
  if (event) {
    if (typeof event === "string") {
      data = JSON.parse(event);
    } else {
      data = event;
    }
  }

  if (!data || !data.post || !data.type || !data.key) {
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: "Please provide all the required fields",
        },
        null,
        2
      ),
    };
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
      const S3_BUCKET = process.env.S3_BUCKET;
      const REGION = process.env.REGION;
      const URL_EXPIRATION_TIME = 6000; // in seconds

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
      fileType: data.type,
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
        message: "END: Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };
};
