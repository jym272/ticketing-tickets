import { Request, Response } from 'express';
import { Ticket } from '@db/models';
import { utils, events } from '@jym272ticketing/common';
import { TicketAttributes } from '@custom-types/index';
import { getSequelizeClient } from '@db/sequelize';
import { HttpStatusCodes } from '@jym272ticketing/common/dist/utils';

const { throwError, httpStatusCodes, parseSequelizeError } = utils;
const { publish, subjects } = events;
const { NOT_FOUND, BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED, OK, FORBIDDEN } = httpStatusCodes;
const sequelize = getSequelizeClient();

export const updateATicketController = () => {
  return async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, price } = res.locals as TicketAttributes;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- because of requireAuth middleware
    const currentUser = req.currentUser!;
    const userId = currentUser.jti;

    if (!Number(id)) {
      return throwError('Invalid id.', BAD_REQUEST);
    }

    try {
      const { ticket, seq } = await sequelize.transaction(async t1 => {
        const ticket = await Ticket.findByPk(id, { transaction: t1, lock: true });
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
        await ticket.save({ transaction: t1 });
        const pa = await publish(ticket, subjects.TicketUpdated);
        return {
          ticket,
          seq: pa.seq
        };
      });
      return res.status(OK).json({ ticket, seq, message: 'Ticket updated.' });
    } catch (err) {
      const errWithStatus = err as Error & { statusCode?: HttpStatusCodes };
      if (errWithStatus.statusCode) {
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
