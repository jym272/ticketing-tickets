import { Router } from 'express';
import { commonController } from '@jym272ticketing/common';
const { getHome } = commonController;

export const home = Router();

home.get('/', getHome);
