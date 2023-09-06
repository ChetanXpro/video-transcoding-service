const Redis = require("ioredis");
const AWS = require("aws-sdk");
const ecs = new AWS.ECS({
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

  if (!data || !data.post || !data.type || !data.c) {
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

  const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  });

  async function enqueueJobInQueue(job) {
    await redis.lpush("VIDEO_TRANSCODING_QUEUE", JSON.stringify(job));
  }
  async function dequeueJobFromQueue() {
    const job = await redis.rpop("VIDEO_TRANSCODING_QUEUE");
    return job ? JSON.parse(job) : null;
  }

  async function triggerTranscodingJob(job) {
    try {
      const taskDefinition = "your_task_definition_name";
      const cluster = "your_cluster_name";
      const count = 1; // Number of instances to run (optional)

      const startTaskResult = await ecs
        .startTask({
          taskDefinition,
          cluster,
          overrides: {
            containerOverrides: [
              {
                environment: [
                  {
                    name: "VIDEO_KEY",
                    value: job.key,
                  },
                ],
              },
            ],
          },
          count,
        })
        .promise();

      console.log("ECS task started:", startTaskResult.tasks);

      return "ECS task started";
    } catch (error) {
      console.error("Error triggering ECS task:", error);
      throw error;
    }
  }

  if (data.Records) {
    // Triggered from S3
    await TriggerFromS3(data);
  }

  const TriggerFromEcs = async (payload) => {
    await redis.decr("CURRENT_VIDEO_TRANSCODING_JOB");

    const currentJobCount = await redis.get("CURRENT_VIDEO_TRANSCODING_JOB");

    const queueLength = await redis.llen("VIDEO_TRANSCODING_QUEUE");
    if (queueLength === 0) {
      // No jobs in the queue, nothing to trigger
      await redis.quit();
      return {
        statusCode: 200,
        body: JSON.stringify(
          {
            message: "Successfully decremented the job count",
          },
          null,
          2
        ),
      };
    }

    // Check how much room is available for new jobs
    const availableSlots = 5 - parseInt(currentJobCount);
    if (availableSlots > 0) {
      // Calculate how many jobs can be triggered
      const jobsToTrigger = Math.min(availableSlots, 5);

      // Trigger transcoding jobs
      for (let i = 0; i < jobsToTrigger; i++) {
        const job = await dequeueJobFromQueue();
        if (job) {
          await triggerTranscodingJob(job);
        }
      }
    }
  };

  const TriggerFromS3 = async (payload) => {
    const currentJobCount = await redis.get("CURRENT_VIDEO_TRANSCODING_JOB");

    if (parseInt(currentJobCount) < 5) {
      // Increment the job count and trigger the transcoding job
      await redis.incr("CURRENT_VIDEO_TRANSCODING_JOB");
      await triggerTranscodingJob();
    } else {
      // Enqueue the job in the Redis queue
      const job = {
        post: payload.post,
        type: payload.type,
        key: payload.key,
      };
      await enqueueJobInQueue(job);
    }
  };

  await redis.quit();

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v3.0! Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };
};
