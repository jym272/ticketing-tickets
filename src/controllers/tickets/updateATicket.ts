import { Request, Response } from 'express';
import { Ticket } from '@db/models';
import { utils, events } from '@jym272ticketing/common';
import { TicketAttributes } from '@custom-types/index';
import { getSequelizeClient } from '@db/sequelize';

const { throwError, httpStatusCodes, parseSequelizeError } = utils;
const { publish, subjects } = events;
const { NOT_FOUND, INTERNAL_SERVER_ERROR, UNAUTHORIZED, OK, FORBIDDEN } = httpStatusCodes;
const sequelize = getSequelizeClient();

export const updateATicketController = () => {
  return async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, price } = res.locals as TicketAttributes;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- because of requireAuth middleware
    const currentUser = req.currentUser!;
    const userId = currentUser.jti;

    try {
      const { ticket, seq } = await sequelize.transaction(async () => {
        const ticket = await Ticket.findByPk(id);
        if (!ticket) {
          return throwError('Ticket not found.', NOT_FOUND);
        }
        if (ticket.userId !== Number(userId)) {
          return throwError(
            'Not authorized.',
            UNAUTHORIZED,
            new Error(
              `userId in cookie payload: ${userId} is not the same as the userId found in the ticket: ${ticket.userId}`
            )
          );
        }
        if (ticket.orderId) {
          return throwError('Ticket is reserved.', FORBIDDEN);
        }
        ticket.set({ title, price: Number(price) });
        await ticket.save();
        const pa = await publish(ticket, subjects.TicketUpdated);
        return {
          ticket,
          seq: pa.seq
        };
      });
      return res.status(OK).json({ ticket, seq, message: 'Ticket updated.' });
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      const error = parseSequelizeError(
        err,
        `Updating ticket failed. id ${id}. currentUser ${JSON.stringify(currentUser)}`
      );
      return throwError('Updating ticket failed.', INTERNAL_SERVER_ERROR, error);
    }
  };
};
