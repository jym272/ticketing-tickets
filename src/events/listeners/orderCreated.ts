import { JsMsg } from 'nats';
import { Ticket } from '@db/models';
import { Order } from '@custom-types/index';
import { getSequelizeClient } from '@db/sequelize';
import { utils, events } from '@jym272ticketing/common';
import { OrderSubjects } from '@jym272ticketing/common/dist/events';
const { log } = utils;
const { nakTheMsg, publish, sc, subjects } = events;
const sequelize = getSequelizeClient();

const lockdownTicket = async (m: JsMsg, order: Order) => {
  m.working();
  let ticket: Ticket | null;

  try {
    ticket = await Ticket.findByPk(order.ticket.id);
    if (!ticket) {
      log('Ticket not found', order.ticket.id);
      m.term();
      return;
    }
  } catch (err) {
    log('Error processing order', err);
    return nakTheMsg(m);
  }
  try {
    await sequelize.transaction(async () => {
      ticket?.set({ orderId: order.id });
      await ticket?.save();
      await publish(ticket, subjects.TicketUpdated);
      m.ack();
    });
  } catch (e) {
    log('Error locking the ticket', e);
    return nakTheMsg(m);
  }
};

export const orderCreatedListener = async (m: JsMsg) => {
  if (m.subject !== subjects.OrderCreated) {
    log('Wrong subject', m.subject);
    m.term();
    return;
  }
  let order: Order | undefined;
  try {
    const data = JSON.parse(sc.decode(m.data)) as Record<OrderSubjects, Order | undefined>;
    order = data[subjects.OrderCreated];
    if (!order) throw new Error(`Order not found in message data with subject ${subjects.OrderCreated}`);
  } catch (e) {
    log('Error parsing message data', e);
    m.term();
    return;
  }
  await lockdownTicket(m, order);
};
