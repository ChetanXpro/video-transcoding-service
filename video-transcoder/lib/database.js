const mongoose = require("mongoose");

let mongoConnect;

exports.connectmongo = async () => {
  try {
    if (
      mongoose.connections[0].readyState === 0 ||
      mongoose.connections[0].readyState === 3
    ) {
      mongoConnect = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`mongo con making: ${mongoose.connections[0].readyState}`);
      return 1;
    } else {
      console.log(`mongo con exists: ${mongoose.connections[0].readyState}`);
      return 1;
    }
  } catch (e) {
    console.log("mongoose monc error");
    console.log(e);
    throw Error("con error");
  }
};

mongoose.connection.on("error", (err) => {
  console.log(`mongoose connection error occurred: ${err}`);
});
mongoose.connection.on("open", (err) => {
  console.log(`mongoose connection done.`);
});
