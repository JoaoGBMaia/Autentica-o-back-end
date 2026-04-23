function createError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function badRequest(message) {
  return createError(400, message);
}

function unauthorized(message) {
  return createError(401, message);
}

function notFound(message) {
  return createError(404, message);
}

function conflict(message) {
  return createError(409, message);
}

module.exports = {
  badRequest,
  conflict,
  createError,
  notFound,
  unauthorized
};
