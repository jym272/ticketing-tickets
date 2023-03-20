import { JwtPayload } from 'jsonwebtoken';

export const parseDecodedPayload = (decoded: JwtPayload) => {
  const response = JSON.parse(JSON.stringify(decoded)) as JwtPayload;
  Object.keys(response).forEach(key => {
    if (typeof response[key] !== 'object') {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete response[key];
    }
  });
  return response;
};
