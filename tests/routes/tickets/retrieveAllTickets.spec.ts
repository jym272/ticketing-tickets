import { test, expect } from '@playwright/test';
import { utils } from '@jym272ticketing/common';
import { Ticket } from '@db/models';
const {
  httpStatusCodes,
  logFinished,
  logRunning,
  createUniqueUser,
  truncateTables,
  generateTicketAttributes,
  insertIntoTableWithReturnJson
} = utils;
const { OK } = httpStatusCodes;

// eslint-disable-next-line no-empty-pattern -- because we need to pass only the testInfo
test.beforeEach(({}, testInfo) => logRunning(testInfo));
// eslint-disable-next-line no-empty-pattern -- because we need to pass only the testInfo
test.afterEach(({}, testInfo) => logFinished(testInfo));

const user1 = createUniqueUser();
let ticket: Ticket;

test.describe('routes: /api/tickets GET tickets', () => {
  test.beforeAll(async () => {
    await truncateTables('ticket');
    ticket = await insertIntoTableWithReturnJson<Ticket>('ticket', {
      ...generateTicketAttributes(),
      userId: user1.userId
    });
  });
  test('retrieve all tickets success', async ({ request }) => {
    const response = await request.get('/api/tickets');
    expect(response.ok()).toBe(true);
    const tickets = (await response.json()) as Ticket[];
    expect(tickets.length).toBe(1);
    const retrieveTicket = tickets[0];
    expect(retrieveTicket.title).toBe(ticket.title);
    expect(retrieveTicket.price).toBe(ticket.price);
    expect(retrieveTicket.userId).toBe(ticket.userId);
    expect(response.status()).toBe(OK);
    expect(retrieveTicket.id).toBe(ticket.id);
  });
});

test.describe('routes: /api/tickets GET empty list', () => {
  test.beforeAll(async () => {
    await truncateTables('ticket');
  });
  test('retrieve empty tickets success', async ({ request }) => {
    const response = await request.get('/api/tickets');
    const tickets = (await response.json()) as Ticket[];
    expect(response.ok()).toBe(true);
    expect(tickets.length).toBe(10);
    expect(response.status()).toBe(OK);
  });
});
