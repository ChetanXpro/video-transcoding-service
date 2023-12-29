const asyncHandler = require("express-async-handler");
const Video = require("../models/VideoSchema");
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
const {
  getKey,
  increment,
  enqueueJobInQueue,
  decrement,
  getQueueLength,
  dequeueJobFromQueue,
  setKey,
} = require("../lib/cache");
const { REDIS_KEYS, VIDEO_PROCESS_STATES } = require("../constants/const");
const { connectmongo } = require("../lib/database");
const { triggerTranscodingJob } = require("../lib/ecsHelper");

const triggerFromS3 = asyncHandler(async (req, res, next) => {
  try {
    console.log("================triggerFromS3============");
    // let event = {
    //   s3EventData: {
    //     s3SchemaVersion: "1.0",
    //     configurationId: "63ae40dd-0ea7-4717-a339-09419c6479ba",
    //     bucket: {
    //       name: "video-transcodingg",
    //       ownerIdentity: { principalId: "A33YQ1YASJE0ID" },
    //       arn: "arn:aws:s3:::video-transcodingg",
    //     },
    //     object: {
    //       key: "63bc118bef422d4840a64f20-demo-2323232.mp4",
    //       size: 465870,
    //       eTag: "6f7c8e79bee4a3835a554bc3d0ccdccf",
    //       sequencer: "00658E89740CFB8949",
    //     },
    //   },
    // };

    const { s3EventData } = req.body;
    if (!s3EventData) {
      return res.status(400).json({
        message: "Bad Request",
      });
    }

    console.log("S3 Event Data", s3EventData);

    const bucket = s3EventData.bucket.name;
    const key = decodeURIComponent(s3EventData.object.key.replace(/\+/g, " "));
    // const params = {
    //   Bucket: bucket,
    //   Key: key,
    // };
    // const { ContentType } = await s3.headObject(params).promise();
    // const presignedUrl = await generatePreSignedGetUrl({
    //   s3ObjectKey: key,
    //   s3Bucket: bucket,
    // });

    const currentJobCount = await getKey(
      REDIS_KEYS.CURRENT_VIDEO_TRANSCODING_JOB_COUNT
    );

    console.log("CURRENT JOB COUNT", currentJobCount);
    // temp/63bc118bef422d4840a64f20demo2323232.mp4
    const userId = key.split("-")[0].split("/")[1];

    const fileName = key.split("-")[1];

    await connectmongo();

    if (parseInt(currentJobCount) < 5) {
      // Increment the job count and trigger the transcoding job

      await increment(REDIS_KEYS.CURRENT_VIDEO_TRANSCODING_JOB_COUNT);
      const job = {
        fileName: key,
        progress: VIDEO_PROCESS_STATES.PROCESSING,
        userID: userId,
        orignalVideoId: key,
      };
      await triggerTranscodingJob(job).then(async (data) => {
        console.log("Triggered transcoding job", data);
        await Video.create({
          fileName: fileName,
          orignalVideoId: key,
          userID: userId,
          progress: VIDEO_PROCESS_STATES.PROCESSING,
        });
      });

      return res.status(200).json({
        message: "Job triggered successfully",
      });
    } else {
      // Enqueue the job in the Redis queue
      const job = {
        fileName: key,
        userID: userId,
        orignalVideoId: key,
        progress: VIDEO_PROCESS_STATES.PENDING,
      };
      await enqueueJobInQueue(job);

      await Video.create({
        fileName: fileName,
        orignalVideoId: key,
        userID: userId,
        progress: VIDEO_PROCESS_STATES.IN_QUEUE,
      });

      return res.status(200).json({
        message: "Job enqueued successfully",
      });
    }
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: err.message,
    });
  }
});

const triggerFromECS = asyncHandler(async (req, res, next) => {
  console.log("================triggerFromS3============");
  // const event = {
  //   userID: "63bc118bef422d4840a64f20",
  //   videoId: "63bc118bef422d4840a64f20-demo-2323232.mp4",
  //   progress: "completed",
  //   hostedFiles: {
  //     "144p": "63bc118bef422d4840a64f20-demo-2323232-144p.mp4",
  //   },
  // };

  const { userID, videoId, progress, hostedFiles } = req.body;

  await connectmongo();
  const video = await Video.findOne({ userID, orignalVideoId: videoId });

  if (!video) {
    return res.status(404).json({
      message: "Video not found",
    });
  }

  if (progress === VIDEO_PROCESS_STATES.COMPLETED) {
    video.progress = VIDEO_PROCESS_STATES.COMPLETED;
    video.hostedFiles = hostedFiles;
    await video.save();
  } else if (progress === VIDEO_PROCESS_STATES.FAILED) {
    video.progress = VIDEO_PROCESS_STATES.FAILED;
    await video.save();
  }

  await decrement(REDIS_KEYS.CURRENT_VIDEO_TRANSCODING_JOB_COUNT);

  const currentJobCount = await getKey(
    REDIS_KEYS.CURRENT_VIDEO_TRANSCODING_JOB_COUNT
  );

  const queueLength = await getQueueLength();

  if (queueLength === 0) {
    if (parseInt(currentJobCount) > 0) {
      await setKey(REDIS_KEYS.CURRENT_VIDEO_TRANSCODING_JOB_COUNT, 0);
    }

    console.log("Trigger from ECS: Queue is empty");

    return res.status(200).json({
      message: "Trigger from ECS: Queue is empty",
    });
  }

  const availableSlots = 5 - parseInt(currentJobCount);

  if (availableSlots > 0) {
    // Calculate how many jobs can be triggered
    const jobsToTrigger = Math.min(availableSlots, 5);

    // Trigger transcoding jobs
    for (let i = 0; i < jobsToTrigger; i++) {
      const job = await dequeueJobFromQueue();
      if (job) {
        await triggerTranscodingJob(job);

        await Video.updateOne(
          { userID: job.userID, orignalVideoId: job.orignalVideoId },
          { progress: VIDEO_PROCESS_STATES.PROCESSING }
        );

        console.log("Trigger from ECS: Job triggered successfully", job);
      }
    }
    return res.status(200).json({
      message: "Trigger from ECS: Job triggered successfully",
    });
  } else {
    console.log("Trigger from ECS: No available slots");
    return res.status(200).json({
      message: "Trigger from ECS: No available slots",
    });
  }
});

const getUploadUrl = asyncHandler(async (req, res, next) => {
  const { fileType, key, userId } = req.body;

  if (!fileType || !key || !userId) {
    return res.status(400).json({
      message: "Bad Request",
    });
  }
  const s3ObjectKey = `${userId}-${key}-${Date.now()}`;
  const postUrl = await generatePreSignedPutUrl({ fileType, s3ObjectKey });
  console.log("POST URL", postUrl);

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
