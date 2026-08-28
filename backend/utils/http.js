/** One place to attach an HTTP status to an Error, so routes stay thin. */
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { httpError };
