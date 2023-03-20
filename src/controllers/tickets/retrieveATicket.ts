import { Request, Response } from 'express';
import { Ticket } from '@db/models';
import { throwError } from '@utils/messages';
import { httpStatusCodes } from '@utils/statusCodes';

export const retrieveATicketController = () => {
  return async (req: Request, res: Response) => {
    const { id } = req.params;
    const ticket = await Ticket.findByPk(id);
    if (!ticket) {
      return throwError('Ticket not found.', httpStatusCodes.NOT_FOUND);
    }
    res.json(ticket);
  };
};
