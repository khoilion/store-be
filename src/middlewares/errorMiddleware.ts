const errorMiddleware = ({code, error, set}: any) => {
  console.log(error)
  if (code === "UNKNOWN") {
    set.status = 400;
    return {
      message: error.message,
      status: 400
    }
  }
  if (code === "INTERNAL_SERVER_ERROR" || code === "PARSE") {
    set.status = 500;
    return {
      message: error.message,
      status: 500
    }
  }
  if (code === "VALIDATION") {
    set.status = 400;
    return {
      message: error.message,
      status: 400
    }
  }
  if (code === "NOT_FOUND") {
    set.status = 404;
    return {
      message: error.message,
      status: 404
    }
  }
  set.status = 500;
  return {
    message: error.message,
    status: 500
  }
}
export default errorMiddleware;