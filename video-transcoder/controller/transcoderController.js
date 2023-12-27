const asyncHandler = require("express-async-handler");
const { generatePreSignedPutUrl } = require("../lib/s3Helper");
const { nanoid } = require("nanoid");
const { responseBody } = require("../lib/utilsLib");

const triggerFromS3 = asyncHandler(async (req, res, next) => {
  console.log("================triggerFromS3============");
  console.log("REQ", req);
  console.log("REQ BODY", req.body);
});

const triggerFromECS = asyncHandler(async (req, res, next) => {
  console.log("================triggerFromS3============");
  console.log("REQ", req);
  console.log("REQ BODY", req.body);
});

const getUploadUrl = asyncHandler(async (req, res, next) => {
  const { fileType, s3ObjectKey } = req.body;

  if (!fileType || !s3ObjectKey) {
    return res.status(400).json({
      message: "Bad Request",
    });
  }
  const uniqueKey = `${s3ObjectKey}-${nanoid()}`;
  const postUrl = await generatePreSignedPutUrl(fileType, uniqueKey);

  return responseBody(
    200,
    "",
    {
      postUrl,
      key: uniqueKey,
    },
    true
  );
});

module.exports = {
  triggerFromS3,
  triggerFromECS,
  getUploadUrl,
};
