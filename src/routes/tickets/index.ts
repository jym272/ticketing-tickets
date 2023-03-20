import { Router } from 'express';
import { ticketsController } from '@controllers/tickets';
import { commonController } from '@jym272ticketing/common';
import { getEnvOrFail } from '@utils/env';
const { verifyCurrentUser, requireAuth } = commonController;
const { retrieveAllTickets, retrieveATicket, createATicket, checkAttributes } = ticketsController;

export const tickets = Router();
const secret = getEnvOrFail('JWT_SECRET');
tickets.get('/api/tickets', retrieveAllTickets);
tickets.get('/api/tickets/:id', retrieveATicket);
tickets.post('/api/tickets', verifyCurrentUser(secret), requireAuth, checkAttributes, createATicket);
// tickets.put('/api/tickets', verifyCurrentUser(secret), requireAuth, checkAttributes, updateATicket);
