const AWS = require("aws-sdk");

const { v4: uuidv4 } = require("uuid");
AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
});

module.exports.handler = async (event) => {
  try {
    console.log("Event", JSON.stringify(event));
    let data;
    if (!event.body) {
      if (typeof event === "string") {
        data = JSON.parse(event);
      } else {
        data = event;
      }
    } else {
      if (typeof event.body === "string") {
        data = JSON.parse(event.body);
      } else {
        data = event.body;
      }
    }

    if (!data || !data?.post || !data?.type || !data?.userID) {
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

    // Check if env setup properly

    const checkIfAuthenticated = (data) => {
      // !TODO - Add authentication logic here

      if (data.post == "teacher") {
        return true;
      } else {
        return false;
      }
    };

    const generatePreSignedPutUrl = async (payload) => {
      try {
        console.log(
          JSON.stringify(
            `[GET S3 UPLOAD URL SERVICE] ${JSON.stringify(payload)}`
          )
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
    const getFileExtension = (mimeType) => {
      const parts = mimeType.split("/");
      if (parts.length === 2) {
        return "." + parts[1];
      }
      return "";
    };

    if (checkIfAuthenticated(data)) {
      const fileName =
        data.userID + "-" + uuidv4() + getFileExtension(data.type);
      const payload = {
        fileType: data.type,
        s3ObjectKey: fileName,
      };

      console.log("Presignedurl Payload", JSON.stringify(payload));

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
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify(
          {
            message: "Not authenticated",
            input: event,
          },
          null,
          2
        ),
      };
    }
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          message: "Function error",
          error,
        },
        null,
        2
      ),
    };
  }
};
