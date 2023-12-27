const mongoose = require("mongoose");
const VideoSchema = new mongoose.Schema({
  fileName: String,
  hostedFiles: {
    "144p": String,
    "360p": String,
    "720p": String,
  },
  thumbnailUrl: String,
  type: String,
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  progress: {
    type: Enum,
    values: ["pending", "processing", "completed", "failed"],
  },
});
module.exports =
  mongoose.models.VideoSchema || mongoose.model("VideoSchema", VideoSchema);
