import { test, expect } from '@playwright/test';
import { utils } from '@jym272ticketing/common';
import { Ticket } from '@db/models';
const {
  httpStatusCodes,
  insertIntoTableWithReturnJson,
  createUniqueUser,
  logFinished,
  generateTicketAttributes,
  logRunning,
  truncateTables,
  generateRandomString,
  parseMessage
} = utils;
const { OK, NOT_FOUND, INTERNAL_SERVER_ERROR } = httpStatusCodes;

// eslint-disable-next-line no-empty-pattern -- because we need to pass only the testInfo
test.beforeEach(({}, testInfo) => logRunning(testInfo));
// eslint-disable-next-line no-empty-pattern -- because we need to pass only the testInfo
test.afterEach(({}, testInfo) => logFinished(testInfo));

const user1 = createUniqueUser();

test.describe('routes: /api/tickets/:id GET ticket', () => {
  let ticket: Ticket;
  test.beforeAll(async () => {
    await truncateTables('ticket');
    ticket = await insertIntoTableWithReturnJson('ticket', { ...generateTicketAttributes(), userId: user1.userId });
  });
  test('Ticket Not found', async ({ request }) => {
    const response = await request.get(`/api/tickets/${ticket.id + 1}`);
    const message = await parseMessage(response);
    expect(response.ok()).toBe(false);
    expect(message).toBe('Ticket not found.');
    expect(response.status()).toBe(NOT_FOUND);
  });
  test('invalid id in parameter request', async ({ request }) => {
    const invalidId = generateRandomString(5);
    const response = await request.get(`/api/tickets/${invalidId}`);
    const message = await parseMessage(response);
    expect(response.ok()).toBe(false);
    expect(message).toBe('Finding ticket failed.');
    expect(response.status()).toBe(INTERNAL_SERVER_ERROR);
  });
  test('get a ticket success', async ({ request }) => {
    const response = await request.get(`/api/tickets/${ticket.id}`);
    const body = await response.body();
    expect(response.ok()).toBe(true);
    const bodyParsed = JSON.parse(body.toString()) as Ticket;
    expect(bodyParsed).toBeDefined();
    const { title, price, userId, id } = bodyParsed;
    expect(title).toBe(ticket.title);
    expect(price).toBe(ticket.price);
    expect(userId).toBe(ticket.userId);
    expect(id).toBe(ticket.id);
    expect(response.status()).toBe(OK);
  });
});
