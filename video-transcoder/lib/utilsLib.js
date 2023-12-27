const responseBody = (
  statusCode = 400,
  message = null,
  data = null,
  success = true,
  error_code = null
) => {
  if (statusCode == 400 && (!message || error_code !== 1))
    message = constants.BAD_REQUEST;
  error_code = null;
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({
      success,
      error_code,
      message,
      data,
    }),
  };
};

module.exports = {
  responseBody,
};
