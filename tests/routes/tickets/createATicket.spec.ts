import { test, expect } from '@playwright/test';
import { utils, events } from '@jym272ticketing/common';
const {
  httpStatusCodes,
  parseMessage,
  generateTicketAttributes,
  logFinished,
  logRunning,
  generateRandomString,
  createACookieSession,
  createAValidPrice,
  createAnInvalidPrice,
  createUniqueUser,
  truncateTables,
  getSequenceDataFromNats,
  TICKET_ATTRIBUTES
} = utils;
const { Streams, TicketSubjects } = events;
import { TicketAttributes } from '@custom-types/index';
import { Ticket } from '@db/models';
const { BAD_REQUEST, CREATED, INTERNAL_SERVER_ERROR, UNAUTHORIZED } = httpStatusCodes;
const { MAX_VALID_TITLE_LENGTH } = TICKET_ATTRIBUTES;

// eslint-disable-next-line no-empty-pattern -- because we need to pass only the testInfo
test.beforeEach(({}, testInfo) => logRunning(testInfo));
// eslint-disable-next-line no-empty-pattern -- because we need to pass only the testInfo
test.afterEach(({}, testInfo) => logFinished(testInfo));

const user1 = createUniqueUser();
const cookie = user1.cookie;
let validTicketAttribute: TicketAttributes;
test.beforeAll(() => {
  validTicketAttribute = generateTicketAttributes();
});

test.describe('routes: /api/tickets POST requireAuth controller', () => {
  test("current user doesn't exists, not authorized by requireAuth common controller", async ({ request }) => {
    const response = await request.post('/api/tickets', { data: validTicketAttribute });
    const message = await parseMessage(response);
    expect(response.ok()).toBe(false);
    expect(message).toBe('Not authorized.');
    expect(response.status()).toBe(UNAUTHORIZED);
  });
});

test.describe('routes: /api/tickets POST checking attributes', () => {
  test('invalid price of a ticket', async ({ request }) => {
    const response = await request.post('/api/tickets', {
      data: {
        title: generateRandomString(MAX_VALID_TITLE_LENGTH),
        price: Number(createAnInvalidPrice())
      },
      headers: { cookie }
    });
    const message = await parseMessage(response);
    expect(response.ok()).toBe(false);
    expect(message).toBe('Invalid price.');
    expect(response.status()).toBe(BAD_REQUEST);
  });
  test('invalid title of a ticket', async ({ request }) => {
    const response = await request.post('/api/tickets', {
      data: {
        title: generateRandomString(MAX_VALID_TITLE_LENGTH + 1, true),
        price: Number(createAValidPrice())
      },
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
    await truncateTables('ticket');
  });
  test('invalid userId in cookie', async ({ request }) => {
    const cookieWithInvalidUserId = createACookieSession({
      userEmail: 'a@a.com',
      userId: Math.pow(2, 31)
    });
    const response = await request.post('/api/tickets', {
      data: validTicketAttribute,
      headers: { cookie: cookieWithInvalidUserId }
    });
    const message = await parseMessage(response);
    expect(response.ok()).toBe(false);
    expect(message).toBe('Creating Ticket failed.');
    expect(response.status()).toBe(INTERNAL_SERVER_ERROR);
  });
});

test.describe('routes: /api/tickets POST createATicketController success', () => {
  test.beforeAll(async () => {
    await truncateTables('ticket');
  });
  test('ticket creation is successful', async ({ request }) => {
    const response = await request.post('/api/tickets', {
      data: validTicketAttribute,
      headers: { cookie }
    });
    const { message, ticket, seq } = (await response.json()) as { message: string; ticket: Ticket; seq: number };
    expect(response.ok()).toBe(true);
    expect(message).toBe('Ticket created.');
    expect(response.status()).toBe(CREATED);
    expect(ticket).toHaveProperty('id');
    expect(ticket).toHaveProperty('userId', user1.userId);
    expect(ticket).toHaveProperty('title', validTicketAttribute.title);
    expect(ticket).toHaveProperty('price', validTicketAttribute.price);

    /*Testing the publish Event*/
    const seqData = await getSequenceDataFromNats<{ [TicketSubjects.TicketCreated]: Ticket }>(Streams.TICKETS, seq);
    expect(seqData).toBeDefined();
    expect(seqData).toHaveProperty('subject', TicketSubjects.TicketCreated);
    expect(seqData).toHaveProperty('seq', seq);
    expect(seqData).toHaveProperty('data');
    expect(seqData).toHaveProperty('time'); //of the nats server arrival

    expect(seqData.data[TicketSubjects.TicketCreated]).toBeDefined();
    const seqDataTicket = seqData.data[TicketSubjects.TicketCreated];
    expect(seqDataTicket).toHaveProperty('id', ticket.id);
    expect(seqDataTicket).toHaveProperty('userId', ticket.userId);
    expect(seqDataTicket).toHaveProperty('title', ticket.title);
    expect(seqDataTicket).toHaveProperty('price', ticket.price);
    expect(seqDataTicket).toHaveProperty('createdAt', ticket.createdAt);
    expect(seqDataTicket).toHaveProperty('updatedAt', ticket.updatedAt);
  });
});
