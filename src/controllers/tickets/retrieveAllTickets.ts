import { Request, Response } from 'express';
import { Ticket } from '@db/models';
import { httpStatusCodes } from '@jym272ticketing/common/dist/utils';
const { OK } = httpStatusCodes;

export const retrieveAllTicketsController = () => {
  return async (req: Request, res: Response) => {
    const tickets = await Ticket.findAll();
    res.status(OK).json(tickets);
  };
};
