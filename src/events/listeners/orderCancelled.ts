import { JsMsg } from 'nats';
import { Ticket } from '@db/models';
import { log, OrderStatus } from '@jym272ticketing/common/dist/utils';
import { getSequelizeClient } from '@db/sequelize';
import { OrderSubjects, publish, sc, subjects, nakTheMsg } from '@jym272ticketing/common/dist/events';
import { Order } from '@custom-types/index';

const sequelize = getSequelizeClient();
const unlockedTicket = async (m: JsMsg, order: Order) => {
  m.working();
  let ticket: Ticket | null;

  // If the ticket is Order Completed keep the locking,
  if (order.status !== OrderStatus.Cancelled) {
    log('Wrong order status: ', order.status);
    return m.term();
  }

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
      ticket?.set({ orderId: null });
      await ticket?.save();
      await publish(ticket, subjects.TicketUpdated); //because of the versioning
      m.ack();
    });
  } catch (e) {
    log('Error unlocking the ticket', e);
    return nakTheMsg(m);
  }
};

export const orderCancelledListener = async (m: JsMsg) => {
  if (m.subject !== subjects.OrderUpdated) {
    log('Wrong subject', m.subject);
    m.term();
    return;
  }
  let order: Order | undefined;
  try {
    const data = JSON.parse(sc.decode(m.data)) as Record<OrderSubjects, Order | undefined>;
    order = data[subjects.OrderUpdated];
    if (!order) throw new Error(`Order not found in message data with subject ${m.subject}`);
  } catch (e) {
    log('Error parsing message data', e);
    m.term();
    return;
  }
  await unlockedTicket(m, order);
};
