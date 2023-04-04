import { Request, Response } from 'express';
import { Ticket, getSequelizeClient } from '@db/index';
import { TicketAttributes } from '@custom-types/index';
import { utils, events } from '@jym272ticketing/common';

const { httpStatusCodes, throwError, parseSequelizeError } = utils;
const { publish, subjects } = events;
const { CREATED, INTERNAL_SERVER_ERROR } = httpStatusCodes;
const sequelize = getSequelizeClient();

export const createATicketController = () => {
  return async (req: Request, res: Response) => {
    const { title, price } = res.locals as TicketAttributes;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- because of requireAuth middleware
    const currentUser = req.currentUser!;
    const userId = currentUser.jti;

    try {
      const ticket = await sequelize.transaction(async () => {
        const newTicket = await Ticket.create({
          title,
          price: Number(price),
          userId: Number(userId)
        });
        await publish(newTicket, subjects.TicketCreated);
      });
      return res.status(CREATED).json({ message: 'Ticket created.', ticket });
    } catch (err) {
      const error = parseSequelizeError(err, `Creating ticket failed. currentUser ${JSON.stringify(currentUser)}`);
      return throwError('Creating ticket failed.', INTERNAL_SERVER_ERROR, error);
    }
  };
};
