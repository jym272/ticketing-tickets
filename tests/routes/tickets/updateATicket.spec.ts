import { test, expect } from '@playwright/test';
import { utils, events } from '@jym272ticketing/common';
const {
  httpStatusCodes,
  logRunning,
  logFinished,
  createUniqueUser,
  insertIntoTableWithReturnJson,
  generateTicketAttributes,
  truncateTables,
  getSequenceDataFromNats,
  parseMessage,
  generateRandomString,
  generateA32BitUnsignedInteger,
  createAnInvalidPrice,
  createAValidPrice,
  TICKET_ATTRIBUTES,
  publishToSubject,
  log
} = utils;
import { Ticket } from '@db/models';
const { Streams, TicketSubjects, subjects } = events;
const { NOT_FOUND, INTERNAL_SERVER_ERROR, UNAUTHORIZED, BAD_REQUEST, OK, FORBIDDEN } = httpStatusCodes;
const { MAX_VALID_TITLE_LENGTH } = TICKET_ATTRIBUTES;

// eslint-disable-next-line no-empty-pattern -- because we need to pass only the testInfo
test.beforeEach(({}, testInfo) => logRunning(testInfo));
// eslint-disable-next-line no-empty-pattern -- because we need to pass only the testInfo
test.afterEach(({}, testInfo) => logFinished(testInfo));

const user1 = createUniqueUser();
const user2 = createUniqueUser();

/*
  If the test fails increase the graceTime
 */
const graceTime = 50;

let ticket: Ticket;
test.describe('routes: /api/tickets/:id PUT update ticket while is lockdown ', () => {
  let orderId: number;
  test.beforeAll(async () => {
    await truncateTables('ticket');
    orderId = generateA32BitUnsignedInteger();
    ticket = await insertIntoTableWithReturnJson<Ticket>('ticket', {
      ...generateTicketAttributes(),
      userId: user1.userId
    });
    // the tk just created is also  in orders-api
  });
  test('failed because the ticket is lockdown', async ({ request }) => {
    // event published by orders api, an order with the ticket is created, the ticket is now locked
    await publishToSubject(subjects.OrderCreated, {
      [subjects.OrderCreated]: { id: orderId, ticket }
    });

    log(`waiting ${graceTime} ms for the listener to process the events`);
    await new Promise(resolve => setTimeout(resolve, graceTime));

    const response = await request.put(`/api/tickets/${ticket.id}`, {
      data: generateTicketAttributes(),
      headers: { cookie: user1.cookie }
    });
    expect(response.ok()).toBe(false);
    expect(response.status()).toBe(FORBIDDEN);
    const { message } = (await response.json()) as { message: string };
    expect(message).toBe('Ticket is reserved.');
  });
});
// another one bites the dust
test.describe('routes: /api/tickets/:id PUT update ticket', () => {
  test.beforeAll(async () => {
    await truncateTables('ticket');
    ticket = await insertIntoTableWithReturnJson<Ticket>('ticket', {
      ...generateTicketAttributes(),
      userId: user1.userId
    });
  });
  test('update a ticket success', async ({ request }) => {
    const data = generateTicketAttributes();
    const response = await request.put(`/api/tickets/${ticket.id}`, {
      data,
      headers: { cookie: user1.cookie }
    });
    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(OK);
    const { ticket: resTk, message, seq } = (await response.json()) as { ticket: Ticket; message: string; seq: number };
    expect(ticket).toBeDefined();
    const { title, price, id, userId: ui, version } = resTk;
    expect(title).toBe(data.title);
    expect(price).toBe(data.price);
    expect(ui).toBe(user1.userId);
    expect(id).toBe(ticket.id);
    expect(message).toBe('Ticket updated.');
    expect(version).toBe(ticket.version + 1);
    expect(version).toBe(1);

    /*Testing the publish Event*/
    const seqData = await getSequenceDataFromNats<{ [TicketSubjects.TicketUpdated]: Ticket }>(Streams.TICKETS, seq);
    expect(seqData).toBeDefined();
    expect(seqData).toHaveProperty('subject', TicketSubjects.TicketUpdated);
    expect(seqData).toHaveProperty('seq', seq);
    expect(seqData).toHaveProperty('data');
    expect(seqData).toHaveProperty('time'); //of the nats server arrival
    expect(seqData.data[TicketSubjects.TicketUpdated]).toBeDefined();
    const seqDataTicket = seqData.data[TicketSubjects.TicketUpdated];
    expect(seqDataTicket).toHaveProperty('id', ticket.id);
    expect(seqDataTicket).toHaveProperty('userId', ticket.userId);
    expect(seqDataTicket).toHaveProperty('title', data.title);
    expect(seqDataTicket).toHaveProperty('price', data.price);
    expect(seqDataTicket).toHaveProperty('createdAt');
    expect(seqDataTicket).toHaveProperty('updatedAt');
    expect(seqDataTicket).toHaveProperty('version', ticket.version + 1);
  });
});

test.describe('routes: /api/tickets/:id PUT update ticket failed', () => {
  test.beforeEach(async () => {
    await truncateTables('ticket');
  });
  test('invalid id in parameter request', async ({ request }) => {
    const invalidId = generateRandomString(5);
    const response = await request.put(`/api/tickets/${invalidId}`, {
      data: generateTicketAttributes(),
      headers: { cookie: user1.cookie }
    });
    const message = await parseMessage(response);
    expect(response.ok()).toBe(false);
    expect(message).toBe('Finding ticket failed.');
    expect(response.status()).toBe(INTERNAL_SERVER_ERROR);
  });
  test('Ticket Not found', async ({ request }) => {
    const validTicketId = generateA32BitUnsignedInteger();
    const response = await request.put(`/api/tickets/${validTicketId}`, {
      data: generateTicketAttributes(),
      headers: { cookie: user1.cookie }
    });
    const message = await parseMessage(response);
    expect(response.ok()).toBe(false);
    expect(message).toBe('Ticket not found.');
    expect(response.status()).toBe(NOT_FOUND);
  });
});

test.describe('routes: /api/tickets/:id PUT update ticket failed authorization', () => {
  test.beforeAll(async () => {
    await truncateTables('ticket');
    ticket = await insertIntoTableWithReturnJson<Ticket>('ticket', {
      ...generateTicketAttributes(),
      userId: user1.userId
    });
  });

  test('userId in cookie payload is not the same as the userId found in the ticket in db', async ({ request }) => {
    const response = await request.put(`/api/tickets/${ticket.id}`, {
      data: generateTicketAttributes(),
      headers: { cookie: user2.cookie }
    });
    const message = await parseMessage(response);
    expect(response.ok()).toBe(false);
    expect(message).toBe('Not authorized.');
    expect(response.status()).toBe(UNAUTHORIZED);
  });
});

test.describe('routes: /api/tickets/:id PUT update ticket failed because of attributes', () => {
  test('invalid price of a ticket', async ({ request }) => {
    const validTicketId = generateA32BitUnsignedInteger();
    const response = await request.put(`/api/tickets/${validTicketId}`, {
      data: {
        title: generateRandomString(MAX_VALID_TITLE_LENGTH),
        price: Number(createAnInvalidPrice())
      },
      headers: { cookie: user1.cookie }
    });
    const message = await parseMessage(response);
    expect(response.ok()).toBe(false);
    expect(message).toBe('Invalid price.');
    expect(response.status()).toBe(BAD_REQUEST);
  });
  test('invalid title of a ticket', async ({ request }) => {
    const validTicketId = generateA32BitUnsignedInteger();
    const response = await request.put(`/api/tickets/${validTicketId}`, {
      data: {
        title: generateRandomString(MAX_VALID_TITLE_LENGTH + 1, true),
        price: Number(createAValidPrice())
      },
      headers: { cookie: user1.cookie }
    });
    const message = await parseMessage(response);
    expect(response.ok()).toBe(false);
    expect(message).toBe('Invalid title.');
    expect(response.status()).toBe(BAD_REQUEST);
  });
});

test.describe('routes: /api/tickets/:id PUT requireAuth controller', () => {
  test("current user doesn't exists, not authorized by requireAuth common controller", async ({ request }) => {
    const validTicketId = generateA32BitUnsignedInteger();
    const response = await request.put(`/api/tickets/${validTicketId}`, {
      data: generateTicketAttributes()
    });
    const message = await parseMessage(response);
    expect(response.ok()).toBe(false);
    expect(message).toBe('Not authorized.');
    expect(response.status()).toBe(UNAUTHORIZED);
  });
});
