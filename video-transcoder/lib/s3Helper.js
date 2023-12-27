const generatePreSignedPutUrl = async (payload) => {
  try {
    console.log(
      JSON.stringify(`[GET S3 UPLOAD URL SERVICE] ${JSON.stringify(payload)}`)
    );
    const S3_BUCKET = process.env.S3_BUCKET;
    const REGION = process.env.REGION;
    const URL_EXPIRATION_TIME = 60000; // in seconds

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
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          message: "END: Fail to generate pre-signed url",
          input: event,
        },
        null,
        2
      ),
    };
  }
};

module.exports = {
  generatePreSignedPutUrl,
};
