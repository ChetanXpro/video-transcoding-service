const errorHandler = (err, req, res, next) => {
  console.error("ErrorHandler: ", err.stack);

  const status = res.statusCode ? res.statusCode : 500;

  res.status(status);

  res.json({ message: err.message });
};

module.exports = errorHandler;
