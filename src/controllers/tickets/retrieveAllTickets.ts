import { Request, Response } from 'express';
import { Ticket } from '@db/models';

export const retrieveAllTicketsController = () => {
  return async (req: Request, res: Response) => {
    const tickets = await Ticket.findAll();
    res.json(tickets);
  };
};
