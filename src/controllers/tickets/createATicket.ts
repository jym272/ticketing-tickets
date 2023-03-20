import { Request, Response } from 'express';
import { Ticket, getSequelizeClient } from '@db/index';
import { TicketAttributes } from '@custom-types/index';
import { httpStatusCodes, throwError } from '@utils/index';
const { UNAUTHORIZED, CREATED, INTERNAL_SERVER_ERROR } = httpStatusCodes;
const sequelize = getSequelizeClient();

export const createATicketController = () => {
  return async (req: Request, res: Response) => {
    const { title, price } = res.locals as TicketAttributes;
    const currentUser = req.currentUser;
    const userId = currentUser?.jti;
    if (!userId) {
      return throwError(
        'Not authorized.',
        UNAUTHORIZED,
        new Error(`User Id not found in cookie. The current user is ${JSON.stringify(currentUser)}`)
      );
    }
    try {
      const newTicket = await sequelize.transaction(async () => {
        return await Ticket.create({
          title,
          price: Number(price),
          userId
        });
      });
      return res.status(CREATED).json({ message: 'Ticket created.', ticket: newTicket });
    } catch (err) {
      let error = new Error(
        `Creating Ticket failed. title ${title}. price ${price}. currentUser ${JSON.stringify(currentUser)}`
      );
      if (err instanceof Error) {
        error = err;
      }
      throwError('Creating Ticket failed.', INTERNAL_SERVER_ERROR, error);
    }
  };
};
