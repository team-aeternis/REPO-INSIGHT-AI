export const globalErrorHandler = (err, req, res, next) => {
  const parsedStatusCode = Number(err?.statusCode);
  err.statusCode =
    Number.isInteger(parsedStatusCode) && parsedStatusCode >= 100
      ? parsedStatusCode
      : 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};
