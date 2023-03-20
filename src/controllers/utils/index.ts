import { NextFunction, Request, Response } from 'express';
import { ErrorWithStatus } from '@custom-types/index';

const crashServerController = () => {
  return (req: Request, res: Response) => {
    res.send('Crashing server!');
    process.exit(1);
  };
};

const healthController = () => {
  return (req: Request, res: Response) => {
    res.send('OK');
  };
};

const envController = () => {
  return (req: Request, res: Response) => {
    res.send(process.env);
  };
};

const errorController = () => {
  // eslint-disable-next-line no-unused-vars -- next is required for express error handling
  return (err: ErrorWithStatus, req: Request, res: Response, next: NextFunction) => {
    const { message, statusCode } = err;
    res.status(statusCode).json({ message });
  };
};

export const utilsController = {
  crashServer: crashServerController(),
  health: healthController(),
  env: envController(),
  errorHandler: errorController()
};
