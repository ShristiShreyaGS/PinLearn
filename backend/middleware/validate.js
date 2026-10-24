const AppError = require("../utils/AppError");

// Parses body/query/params with Zod; results are exposed on req.valid (req.query is read-only in Express 5).
function validate(schemas) {
  return (req, res, next) => {
    req.valid = {};

    for (const part of ["params", "query", "body"]) {
      if (!schemas[part]) continue;

      const result = schemas[part].safeParse(req[part] ?? {});
      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          field: [part, ...issue.path].join("."),
          message: issue.message
        }));
        return next(new AppError(400, details[0].message, "VALIDATION_ERROR", details));
      }
      req.valid[part] = result.data;
    }

    return next();
  };
}

module.exports = validate;
