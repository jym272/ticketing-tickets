import { Router } from 'express';
import { ticketsController } from '@controllers/tickets';
import { commonController } from '@jym272ticketing/common';
import { getEnvOrFail } from '@utils/env';
const { verifyCurrentUser, requireAuth } = commonController;
const { retrieveAllTickets, retrieveATicket, createATicket, checkAttributes, updateATicket } = ticketsController;

const secret = getEnvOrFail('JWT_SECRET');
const authMiddleware = Router();
authMiddleware.use(verifyCurrentUser(secret), requireAuth, checkAttributes);

export const tickets = Router();
tickets.get('/api/tickets', retrieveAllTickets);
tickets.get('/api/tickets/:id', retrieveATicket);
tickets.post('/api/tickets', authMiddleware, createATicket);
tickets.put('/api/tickets/:id', authMiddleware, updateATicket);
