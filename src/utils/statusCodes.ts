// eslint-disable-next-line no-unused-vars
enum HttpStatusCodes200 {
  // eslint-disable-next-line no-unused-vars
  OK = 200,
  // eslint-disable-next-line no-unused-vars
  CREATED = 201
}
// eslint-disable-next-line no-unused-vars
enum HttpStatusCodes400 {
  // eslint-disable-next-line no-unused-vars
  BAD_REQUEST = 400,
  // eslint-disable-next-line no-unused-vars
  UNAUTHORIZED = 401,
  // eslint-disable-next-line no-unused-vars
  NOT_FOUND = 404,
  // eslint-disable-next-line no-unused-vars
  CONFLICT = 409
}
// eslint-disable-next-line no-unused-vars
enum HttpStatusCodes500 {
  // eslint-disable-next-line no-unused-vars
  INTERNAL_SERVER_ERROR = 500
}

export const httpStatusCodes = {
  ...HttpStatusCodes200,
  ...HttpStatusCodes400,
  ...HttpStatusCodes500
};

export type HttpStatusCodes = HttpStatusCodes200 | HttpStatusCodes400 | HttpStatusCodes500;
