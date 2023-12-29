const AWS = require("aws-sdk");

const ecs = new AWS.ECS({
  accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
  region: process.env.REGION, // Replace with your AWS region
});

console.log("Access Key", process.env.MY_AWS_ACCESS_KEY_ID);

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
            securityGroups: [""], // Enter security groups here
            assignPublicIp: "ENABLED",
          },
        },

        // launchType: "FARGATE",
        overrides: {
          containerOverrides: [
            {
              name: "",
              environment: [
                {
                  name: "VIDEO_NAME",
                  value: job.fileName,
                },
                {
                  name: "USER_ID",
                  value: job.userID,
                },
                {
                  name: "ACCESS_KEY",
                  value: process.env.MY_AWS_ACCESS_KEY_ID,
                },
                {
                  name: "SECRET_ACCESS_KEY",
                  value: process.env.MY_AWS_SECRET_ACCESS_KEY,
                },
                {
                  name: "REGION",
                  value: process.env.REGION,
                },
                {
                  name: "S3_BUCKET",
                  value: "video-transcodingg",
                },
                {
                  name: "WEBHOOK_URL",
                  value: process.env.WEBHOOK_URL,
                },
                {
                  name: "TEMP_S3_BUCKET",
                  value: process.env.TEMP_S3_BUCKET,
                },
              ],
            },
          ],
        },
      },
      (err, data) => {
        if (err) {
          console.log("Error while running ecs", err);
          return err;
        } else {
          console.log("From Ecs start", data);
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

module.exports = {
  triggerTranscodingJob,
};
