const mongoose = require("mongoose");
const VideoSchema = new mongoose.Schema({
  fileName: String,
  hostedFiles: {
    "144p": String,
    "360p": String,
    "720p": String,
  },
  orignalVideoId: String,
  thumbnailUrl: String,
  type: String,
  userID: {
    // type: mongoose.Schema.Types.ObjectId,
    // ref: "User",
    type: String,
  },
  progress: {
    type: String,
    values: ["pending", "processing", "completed", "failed", "in-queue"],
  },
});
module.exports =
  mongoose.models.VideoSchema || mongoose.model("VideoSchema", VideoSchema);
