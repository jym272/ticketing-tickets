import { ErrorWithStatus } from '@custom-types/index';
import { HttpStatusCodes } from '@utils/statusCodes';

// eslint-disable-next-line no-console
export const log = console.log;

export const successConnectionMsg = (msg: string) => log('\x1b[32m%s\x1b[0m', msg);
//TODO: pensar bien cuando activar logging, si NODE_ENV no es test, los tests fallan por https
export const activateLogging = () => !(process.env.NODE_ENV === 'test');

export const throwError = (message: string, statusCode: HttpStatusCodes = 500, err: Error | undefined = undefined) => {
  if (activateLogging()) log(err ?? `Error: ${message}`);
  const newError = new Error(message) as ErrorWithStatus;
  newError.statusCode = statusCode;
  throw newError;
};
