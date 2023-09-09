const Redis = require("ioredis");
const AWS = require("aws-sdk");
const mongoose = require("mongoose");
const ecs = new AWS.ECS({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION, // Replace with your AWS region
});

let conn = null;
let redis = null;

module.exports.handler = async (event, context) => {
  try {
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

    if (!data || !data.post || !data.type || !data.userID || !data.name) {
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
    const uri = process.env.MONGO_URI;

    if (!uri) {
      return {
        statusCode: 400,
        body: JSON.stringify(
          {
            message: "Please setup the environment variables",
            URI: uri,
          },
          null,
          2
        ),
      };
    }

    context.callbackWaitsForEmptyEventLoop = false;

    if (conn == null) {
      conn = mongoose.createConnection(uri, {
        serverSelectionTimeoutMS: 5000,
      });

      await conn.asPromise();
    }

    const videos = conn.model(
      "VIDEOS",
      new mongoose.Schema({
        fileName: String,
        hostedFiles: [{ type: String }],
        type: String,
        userID: String,
        progress: Number,
      })
    );

    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
    });

    async function enqueueJobInQueue(job) {
      return await redis.lpush("VIDEO_TRANSCODING_QUEUE", JSON.stringify(job));
    }
    async function dequeueJobFromQueue() {
      const job = await redis.rpop("VIDEO_TRANSCODING_QUEUE");
      return job ? JSON.parse(job) : null;
    }

    async function triggerTranscodingJob(job) {
      try {
        const taskDefinition = ""; // Enter task definition here
        const cluster = ""; // Enter cluster name here
        const count = 1;

        const startTaskResult = ecs.runTask(
          {
            taskDefinition,
            capacityProviderStrategy: [{ capacityProvider: "FARGATE" }],
            cluster,
            count,
            networkConfiguration: {
              awsvpcConfiguration: {
                subnets: [], // Enter subnets here
                securityGroups: [], // Enter security groups here
                assignPublicIp: "ENABLED",
              },
            },

            // launchType: "FARGATE",
            overrides: {
              containerOverrides: [
                {
                  name: "transcoding",
                  environment: [
                    {
                      name: "VIDEO_NAME",
                      value: job.fileName,
                    },
                  ],
                },
              ],
            },
          },
          (err, data) => {
            if (err) {
              console.log(err);
              return err;
            } else {
              console.log(data);
              return data;
            }
          }
        );

        return startTaskResult;
      } catch (error) {
        console.error("Error triggering ECS task:", error);
        throw error;
      }
    }
    const TriggerFromS3 = async (payload) => {
      const currentJobCount = await redis.get("CURRENT_VIDEO_TRANSCODING_JOB");

      const video = await videos.create({
        fileName: data.name,
        type: data.type,
        userID: data.userID,
        hostedFile: [],
        progress: 1,
      });

      if (parseInt(currentJobCount) < 5) {
        // Increment the job count and trigger the transcoding job

        await redis.incr("CURRENT_VIDEO_TRANSCODING_JOB");
        return await triggerTranscodingJob();
      } else {
        // Enqueue the job in the Redis queue
        const job = {
          fileName: data.name,
          post: payload.post,
          type: payload.type,
          userID: payload.userID,
        };
        return await enqueueJobInQueue(job);
      }
    };

    // !TODO - Trigger from ECS
    const TriggerFromEcs = async (payload) => {
      const { userID, videoId, progress, hostedFiles } = payload;

      if (userID && videoId && progress && hostedFiles) {
        const video = await videos.findOne({ userId: userID });

        video.progress = progress;
        video.hostedFiles = hostedFiles;

        await video.save();
      }

      await redis.decr("CURRENT_VIDEO_TRANSCODING_JOB");

      const currentJobCount = await redis.get("CURRENT_VIDEO_TRANSCODING_JOB");

      const queueLength = await redis.llen("VIDEO_TRANSCODING_QUEUE");

      if (queueLength === 0) {
        // No jobs in the queue, nothing to trigger
        if (conn) {
          await conn.close();
        }

        if (redis) {
          await redis.quit();
        }
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

    if (data.Records) {
      // Triggered from S3
      const result = await TriggerFromS3(data);
      if (conn) {
        await conn.close();
      }

      if (redis) {
        await redis.quit();
      }
      return {
        statusCode: 200,
        body: JSON.stringify(
          {
            message: "success",
            result: result,
          },
          null,
          2
        ),
      };
    } else {
      // Triggered from ECS
      await TriggerFromEcs(data);
    }

    if (conn) {
      await conn.close();
    }

    if (redis) {
      await redis.quit();
    }

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: "Triggered successfully",
          input: event,
        },
        null,
        2
      ),
    };
  } catch (error) {
    if (conn) {
      await conn.close();
    }
    if (redis) {
      await redis.quit();
    }

    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          status: "Error",
          error,
        },
        null,
        2
      ),
    };
  }
};
