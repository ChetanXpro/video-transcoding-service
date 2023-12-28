const {
  triggerFromECS,
  triggerFromS3,
  getUploadUrl,
} = require("../controller/transcoderController");

const { Router } = require("express");

const router = Router();

router.post("/uploadurl", getUploadUrl);
router.post("/s3trigger", triggerFromS3);
router.post("/ecstrigger", triggerFromECS);

module.exports = router;
