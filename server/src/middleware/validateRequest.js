export const validateRequest = (schema, source = "body") => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    convert: true,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Request validation failed.",
      statusCode: 400,
      data: null,
      errors: error.details.map(({ message, path }) => ({
        field: path.join("."),
        message: message.replace(/\"/g, ""),
      })),
    });
  }

  req.validated = { ...req.validated, [source]: value };
  if (source !== "query") req[source] = value;
  return next();
};
