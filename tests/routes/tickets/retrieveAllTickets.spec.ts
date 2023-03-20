import { test, expect } from '@playwright/test';
import {
  logFinished,
  logRunning,
  createAPrice,
  truncateTicketTable,
  generateRandomString,
  insertIntoTicketTable,
  Ticket
} from '@tests/test-utils';
import { utils } from '@jym272ticketing/common';
const { httpStatusCodes } = utils;
import { TICKET_ATTRIBUTES } from '@utils/index';
const { OK } = httpStatusCodes;
const { MAX_VALID_TITLE_LENGTH } = TICKET_ATTRIBUTES;

// eslint-disable-next-line no-empty-pattern -- because we need to pass only the testInfo
test.beforeEach(({}, testInfo) => logRunning(testInfo));
// eslint-disable-next-line no-empty-pattern -- because we need to pass only the testInfo
test.afterEach(({}, testInfo) => logFinished(testInfo));

test.describe('routes: /api/tickets GET tickets', () => {
  let entry: Ticket;
  test.beforeAll(async () => {
    entry = {
      title: generateRandomString(MAX_VALID_TITLE_LENGTH),
      price: createAPrice(),
      userId: '1'
    };
    await truncateTicketTable();
    await insertIntoTicketTable(entry);
  });
  test('retrieve all tickets success', async ({ request }) => {
    const response = await request.get('/api/tickets');
    const body = await response.body();
    expect(response.ok()).toBe(true);
    const bodyParsed = JSON.parse(body.toString()) as Ticket[];
    expect(bodyParsed.length).toBe(1);
    const newEntry = bodyParsed[0];
    expect(newEntry.title).toBe(entry.title);
    expect(newEntry.price).toBe(entry.price);
    expect(newEntry.userId).toBe(entry.userId);
    expect(response.status()).toBe(OK);
    expect(newEntry.id).toBeDefined();
    expect(typeof newEntry.id).toBe('number');
  });
});

test.describe('routes: /api/tickets GET empty list', () => {
  test.beforeAll(async () => {
    await truncateTicketTable();
  });
  test('retrieve empty tickets success', async ({ request }) => {
    const response = await request.get('/api/tickets');
    const body = await response.body();
    expect(response.ok()).toBe(true);
    const bodyParsed = JSON.parse(body.toString()) as Ticket[];
    expect(bodyParsed.length).toBe(0);
    expect(response.status()).toBe(OK);
  });
});
