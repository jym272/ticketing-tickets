import { test, expect } from '@playwright/test';
import {
  logFinished,
  logRunning,
  createAPrice,
  truncateTicketTable,
  generateRandomString,
  insertIntoTicketTable,
  Ticket,
  selectIdFromTicketTable,
  parseMessage
} from '@tests/test-utils';
import { utils } from '@jym272ticketing/common';
const { httpStatusCodes } = utils;
import { TICKET_ATTRIBUTES } from '@utils/index';
const { OK, NOT_FOUND, INTERNAL_SERVER_ERROR } = httpStatusCodes;
const { MAX_VALID_TITLE_LENGTH } = TICKET_ATTRIBUTES;

// eslint-disable-next-line no-empty-pattern -- because we need to pass only the testInfo
test.beforeEach(({}, testInfo) => logRunning(testInfo));
// eslint-disable-next-line no-empty-pattern -- because we need to pass only the testInfo
test.afterEach(({}, testInfo) => logFinished(testInfo));

test.describe('routes: /api/tickets/:id GET ticket', () => {
  let entry: Ticket;
  let newTicketId: number;
  test.beforeAll(async () => {
    entry = {
      title: generateRandomString(MAX_VALID_TITLE_LENGTH),
      price: createAPrice(),
      userId: '1'
    };
    await truncateTicketTable();
    await insertIntoTicketTable(entry);
    const ids = await selectIdFromTicketTable();
    newTicketId = ids[0].id;
    Object.assign(entry, { id: newTicketId });
  });
  test('Ticket Not found', async ({ request }) => {
    const response = await request.get(`/api/tickets/${newTicketId + 1}`);
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
    const response = await request.get(`/api/tickets/${newTicketId}`);
    const body = await response.body();
    expect(response.ok()).toBe(true);
    const bodyParsed = JSON.parse(body.toString()) as Ticket;
    expect(bodyParsed).toBeDefined();
    const { title, price, userId, id } = bodyParsed;
    expect(title).toBe(entry.title);
    expect(price).toBe(entry.price);
    expect(userId).toBe(entry.userId);
    expect(id).toBe(entry.id);
    expect(response.status()).toBe(OK);
  });
});
