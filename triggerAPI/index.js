require("dotenv").config();

const axios = require("axios");

module.exports.handler = async (event) => {
  try {
    const s3EventData = event.Records[0].s3;

    console.log("S3 event", s3EventData);
    const resp = await axios.post(process.env.API_ENDPOINT, { s3EventData });
    console.log("RESPONSE", resp);

    return {
      statusCode: 200,
      body: "S3 event processed successfully.",
    };
  } catch (error) {
    console.error("Error processing S3 event:", error);
    return {
      statusCode: 500,
      body: "Internal Server Error",
    };
  }
};
