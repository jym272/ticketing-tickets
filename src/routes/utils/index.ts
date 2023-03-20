import { Router } from 'express';
import { utilsController } from '@controllers/index';
import { throwError } from '@utils/messages';
import { httpStatusCodes } from '@utils/statusCodes';

export const utils = Router();

utils.get('/crash-server', utilsController.crashServer);
utils.get('/health', utilsController.health);
utils.get('/env', utilsController.env);
utils.all('*', () => {
  throwError('Not Found.', httpStatusCodes.NOT_FOUND);
});
