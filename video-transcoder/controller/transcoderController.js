const asyncHandler = require("express-async-handler");
const {
  generatePreSignedPutUrl,
  generatePreSignedGetUrl,
} = require("../lib/s3Helper");
// const { nanoid } = require("nanoid");
const aws = require("aws-sdk");

const s3 = new aws.S3({
  apiVersion: "2006-03-01",
  secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
});

const { responseBody } = require("../lib/utilsLib");

const triggerFromS3 = asyncHandler(async (req, res, next) => {
  try {
    console.log("================triggerFromS3============");
    // let event = {
    //   s3EventData: {
    //     s3SchemaVersion: "1.0",
    //     configurationId: "63ae40dd-0ea7-4717-a339-09419c6479ba",
    //     bucket: {
    //       name: "video-transcodingg",
    //       ownerIdentity: [Object],
    //       arn: "arn:aws:s3:::video-transcodingg",
    //     },
    //     object: {
    //       key: "package.json",
    //       size: 995,
    //       eTag: "0dab9db1134018e09dafe9a233041147",
    //       sequencer: "00658D6F55A2740289",
    //     },
    //   },
    // };

    const { s3EventData } = req.body;
    const bucket = s3EventData.bucket.name;
    const key = decodeURIComponent(s3EventData.object.key.replace(/\+/g, " "));
    const params = {
      Bucket: bucket,
      Key: key,
    };
    const { ContentType } = await s3.headObject(params).promise();
    const presignedUrl = await generatePreSignedGetUrl({
      s3ObjectKey: key,
      s3Bucket: bucket,
    });

    return res.status(200).json({
      message: "OK",
      data: {
        presignedUrl,
        contentType: ContentType,
      },
    });
  } catch (err) {
    console.log(err);
    const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
    console.log(message);
    throw new Error(message);
  }
});

const triggerFromECS = asyncHandler(async (req, res, next) => {
  console.log("================triggerFromS3============");
  console.log("REQ", req);
  console.log("REQ BODY", req.body);
});

const getUploadUrl = asyncHandler(async (req, res, next) => {
  const { fileType, key } = req.body;

  if (!fileType || !key) {
    return res.status(400).json({
      message: "Bad Request",
    });
  }
  const s3ObjectKey = `${key}-${Date.now()}`;
  const postUrl = await generatePreSignedPutUrl({ fileType, s3ObjectKey });
  console.log("POST URL", postUrl);
  //   return responseBody(

  //     200,
  //     "",
  //     {
  //       postUrl,
  //       key: uniqueKey,
  //     },
  //     true
  //   );

  return res.status(200).json({
    postUrl,
    key: s3ObjectKey,
  });
});

module.exports = {
  triggerFromS3,
  triggerFromECS,
  getUploadUrl,
};
