function notFound(req, res, next) {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (req.xhr || req.headers.accept.includes('application/json')) {
    return res.status(statusCode).json({
      success: false,
      message: err.message,
      stack: isDevelopment ? err.stack : undefined
    });
  }

  return res.status(statusCode).render('error', {
    pageTitle: `Error ${statusCode}`,
    error: err.message,
    stack: isDevelopment ? err.stack : undefined
  });
}

module.exports = {
  notFound,
  errorHandler
};