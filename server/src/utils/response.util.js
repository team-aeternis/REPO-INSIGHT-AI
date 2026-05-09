export const successResponse = (
  res,
  data,
  message = "Success",
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    statusCode,
  });
};

export const errorResponse = (
  res,
  error,
  message = "Error",
  statusCode = 500,
) => {
  return res.status(statusCode).json({
    success: false,
    error,
    message,
    statusCode,
  });
};
