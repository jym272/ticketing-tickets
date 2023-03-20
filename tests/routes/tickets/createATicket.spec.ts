import { test, expect } from '@playwright/test';
import {
  logFinished,
  logRunning,
  parseMessage,
  priceValidity,
  createAPrice,
  truncateTicketsTable,
  generateRandomString,
  createACookieSession
} from '@tests/test-utils';
import { httpStatusCodes, TICKET_ATTRIBUTES } from '@utils/index';
const { BAD_REQUEST, CREATED, INTERNAL_SERVER_ERROR, UNAUTHORIZED } = httpStatusCodes;
const { Valid, Invalid } = priceValidity;
const { MAX_VALID_TITLE_LENGTH } = TICKET_ATTRIBUTES;

// eslint-disable-next-line no-empty-pattern -- because we need to pass only the testInfo
test.beforeEach(({}, testInfo) => logRunning(testInfo));
// eslint-disable-next-line no-empty-pattern -- because we need to pass only the testInfo
test.afterEach(({}, testInfo) => logFinished(testInfo));

test.describe('routes: /api/tickets POST requireAuth controller', () => {
  test("current user doesn't exists, not authorized by requireAuth common controller", async ({ request }) => {
    const ticketAttr = {
      title: 'a valid Title',
      price: createAPrice()
    };
    const response = await request.post('/api/tickets', { data: ticketAttr });
    const message = await parseMessage(response);
    expect(response.ok()).toBe(false);
    expect(message).toBe('Not authorized.');
    expect(response.status()).toBe(UNAUTHORIZED);
  });
});

test.describe('routes: /api/tickets POST checking attributes', () => {
  let cookie: string;
  test.beforeAll(() => {
    cookie = createACookieSession({
      userEmail: 'a@a.com',
      userId: '1'
    });
  });
  test('invalid price of a ticket', async ({ request }) => {
    const ticketAttr = {
      title: 'a valid Title',
      price: createAPrice(Invalid)
    };
    const response = await request.post('/api/tickets', {
      data: ticketAttr,
      headers: { cookie }
    });
    const message = await parseMessage(response);
    expect(response.ok()).toBe(false);
    expect(message).toBe('Invalid price.');
    expect(response.status()).toBe(BAD_REQUEST);
  });
  test('invalid title of a ticket', async ({ request }) => {
    const ticketAttr = {
      title: generateRandomString(MAX_VALID_TITLE_LENGTH + 1),
      price: createAPrice(Valid)
    };
    const response = await request.post('/api/tickets', {
      data: ticketAttr,
      headers: { cookie }
    });
    const message = await parseMessage(response);
    expect(response.ok()).toBe(false);
    expect(message).toBe('Invalid title.');
    expect(response.status()).toBe(BAD_REQUEST);
  });
});

test.describe('routes: /api/tickets POST createATicketController failed', () => {
  test.beforeAll(async () => {
    await truncateTicketsTable();
  });
  test('user Id not found in cookie', async ({ request }) => {
    const ticketAttr = {
      title: 'a valid Title',
      price: createAPrice(Valid)
    };
    const cookieWithoutUserId = createACookieSession({
      userEmail: 'a@a.com',
      userId: ''
    });
    const response = await request.post('/api/tickets', {
      data: ticketAttr,
      headers: { cookie: cookieWithoutUserId }
    });
    const message = await parseMessage(response);
    expect(response.ok()).toBe(false);
    expect(message).toBe('Not authorized.');
    expect(response.status()).toBe(UNAUTHORIZED);
  });
  test('invalid userId in cookie', async ({ request }) => {
    const ticketAttr = {
      title: 'a valid Title',
      price: createAPrice(Valid)
    };
    const cookieWithInvalidUserId = createACookieSession({
      userEmail: 'a@a.com',
      userId: 'A1'
    });
    const response = await request.post('/api/tickets', {
      data: ticketAttr,
      headers: { cookie: cookieWithInvalidUserId }
    });
    const message = await parseMessage(response);
    expect(response.ok()).toBe(false);
    expect(message).toBe('Creating Ticket failed.');
    expect(response.status()).toBe(INTERNAL_SERVER_ERROR);
  });
});

test.describe('routes: /api/tickets POST createATicketController success', () => {
  let cookie: string;
  test.beforeAll(async () => {
    cookie = createACookieSession({
      userEmail: 'a@a.com',
      userId: '1'
    });
    await truncateTicketsTable();
  });
  test('ticket creation is successful', async ({ request }) => {
    const ticketAttr = {
      title: 'a valid Title',
      price: createAPrice(Valid)
    };
    const response = await request.post('/api/tickets', {
      data: ticketAttr,
      headers: { cookie }
    });
    const message = await parseMessage(response);
    expect(response.ok()).toBe(true);
    expect(message).toBe('Ticket created.');
    expect(response.status()).toBe(CREATED);
  });
});
