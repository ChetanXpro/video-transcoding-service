const asyncHandler = require("express-async-handler");

const login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin") {
    return res.status(200).json({
      message: "Login Success!",
    });
  } else {
    return res.status(401).json({
      message: "Login Failed!",
    });
  }
});

module.exports = {
  login,
};
