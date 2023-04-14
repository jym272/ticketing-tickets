import { expect, test } from '@playwright/test';
import { Ticket } from '@db/models';
import { events, utils } from '@jym272ticketing/common';
const {
  generateA32BitUnsignedInteger,
  generateTicketAttributes,
  logFinished,
  logRunning,
  publishToSubject,
  truncateTables,
  runPsqlCommand,
  OrderStatus,
  log,
  createUniqueUser,
  insertIntoTableWithReturnJson
} = utils;
const { subjects } = events;

// eslint-disable-next-line no-empty-pattern -- because we need to pass only the testInfo
test.beforeEach(({}, testInfo) => logRunning(testInfo));
// eslint-disable-next-line no-empty-pattern -- because we need to pass only the testInfo
test.afterEach(({}, testInfo) => logFinished(testInfo));

/*
  Only can prove happy paths, these test are async, but it is difficult to know when the listener
  has finished to process the events. If the test fails increase the graceTime
 */
const graceTime = 50;

const user1 = createUniqueUser();
test.describe('listener: orderCreatedListener and cancelledOrderListener receive events', () => {
  let orderId: number;
  let ticket: Ticket;

  test.beforeAll(async () => {
    await truncateTables('ticket');
    orderId = generateA32BitUnsignedInteger();
    ticket = await insertIntoTableWithReturnJson('ticket', { ...generateTicketAttributes(), userId: user1.userId });
    // the tk just created is also  in orders-api
  });

  test('orders.created is published by orders-api, tickets-api lock the tk', async () => {
    // event published by orders api
    await publishToSubject(subjects.OrderCreated, {
      [subjects.OrderCreated]: { id: orderId, ticket }
    });

    log(`waiting ${graceTime} ms for the listener to process the events`);
    await new Promise(resolve => setTimeout(resolve, graceTime));

    const res = await runPsqlCommand(
      `select jsonb_build_object('id', id, 'orderId', "orderId", 'version', version) from "ticket" where id=${ticket.id}`
    );

    const lockedTicket = JSON.parse(res) as Ticket;
    expect(lockedTicket.id).toBe(ticket.id);
    expect(lockedTicket.version).toBe(1); //because at being locked the orderId is set/update
    expect(lockedTicket.orderId).toBe(orderId);

    // tickets-api update the tk when locking it, so the version is 1 and tickets-api published this update,
    // orders-api listens this event.
    ticket = lockedTicket;
  });

  test('orders.updated is published by orders-api, tickets-api unlock the tk if status is cancelled', async () => {
    // event published by orders api
    await publishToSubject(subjects.OrderUpdated, {
      [subjects.OrderUpdated]: { id: orderId, ticket, status: OrderStatus.Cancelled }
    });

    log(`waiting ${graceTime} ms for the listener to process the events`);
    await new Promise(resolve => setTimeout(resolve, graceTime));

    const res = await runPsqlCommand(
      `select jsonb_build_object('id', id, 'orderId', "orderId", 'version', version) from "ticket" where id=${ticket.id}`
    );

    const unlockedTicket = JSON.parse(res) as Ticket;
    expect(unlockedTicket.id).toBe(ticket.id);
    expect(unlockedTicket.version).toBe(2); //because at being unlocked the orderId is again set null
    expect(unlockedTicket.orderId).not.toBe(orderId);
    expect(unlockedTicket.orderId).toBeNull();
  });
});
