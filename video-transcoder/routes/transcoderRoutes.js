const {
  triggerFromECS,
  triggerFromS3,
} = require("../controller/userController");

const { Router } = require("express");

const router = Router();

router.post("/s3trigger", triggerFromS3);
router.post("/ecstrigger", triggerFromECS);

module.exports = router;
