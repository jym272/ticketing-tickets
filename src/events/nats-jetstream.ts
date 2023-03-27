import {
  AckPolicy,
  connect,
  consumerOpts,
  createInbox,
  DeliverPolicy,
  JetStreamClient,
  JetStreamManager,
  NatsConnection,
  StringCodec
} from 'nats';
import { ConsumerOptsBuilder } from 'nats/lib/nats-base-client/types';
import { STREAM_NOT_FOUND } from '@utils/constants';
import { log } from '@jym272ticketing/common/dist/utils';

let nc: NatsConnection | undefined;
let js: JetStreamClient | undefined;

export enum Subjects {
  TicketCreated = 'tickets.created'
}
const getDurableName = (subject: Subjects) => {
  const parts = subject.split('.');
  if (!parts.length) {
    throw new Error('Subject is empty');
  }
  const upperCaseParts = parts.map(part => part.toUpperCase());
  return upperCaseParts.join('_');
};

export type SubjectsType = Subjects;
export let opts: ConsumerOptsBuilder; // for the subscription
export const stream = 'tickets';
export const subj = `tickets.*`;
export const durableName = getDurableName(Subjects.TicketCreated);
const queueGroupName = Subjects.TicketCreated;
const filterSubject = Subjects.TicketCreated;

const natsServerUrl = 'nats://localhost:4222'; //TODO: move to env, change nats if is not local

export const getNatsConnection = async () => {
  if (nc) {
    return nc;
  }
  nc = await connect({ servers: natsServerUrl });
  return nc;
};

const verifyStream = async (jsm: JetStreamManager) => {
  try {
    await jsm.streams.find(subj);
  } catch (e) {
    if (e instanceof Error && e.message === STREAM_NOT_FOUND) {
      log(`Stream ${stream} not found, creating...`);
      await jsm.streams.add({ name: stream, subjects: [subj] });
      log(`Stream ${stream} with subject ${subj} CREATED`);
      return;
    }
    throw e;
  }
  log(`Stream '${stream}' with subject '${subj}' FOUND`);
};

const findConsumer = async (jsm: JetStreamManager) => {
  const consumers = await jsm.consumers.list(stream).next();
  for (const ci of consumers) {
    const { config } = ci;
    if (config.durable_name === durableName) {
      return true;
    }
  }
  return false;
};

const verifyConsumer = async (jsm: JetStreamManager) => {
  if (!(await findConsumer(jsm))) {
    log(`Consumer with name ${durableName} not found. Creating consumer...`);
    await jsm.consumers.add(stream, {
      durable_name: durableName,
      deliver_policy: DeliverPolicy.All,
      ack_policy: AckPolicy.Explicit,
      deliver_subject: createInbox(),
      deliver_group: queueGroupName,
      filter_subject: filterSubject
    });
    log(`Consumer with name ${durableName} CREATED`);
    return;
  }
  log(`Consumer with name ${durableName} FOUND`);
};

const bindConsumer = () => {
  opts = consumerOpts();
  opts.queue(queueGroupName);
  opts.manualAck();
  opts.bind(stream, durableName);
};

export const getJetStreamClient = async () => {
  if (js) {
    return js;
  }
  const nc = await getNatsConnection();
  const jsm = await nc.jetstreamManager();
  await verifyStream(jsm);
  await verifyConsumer(jsm);
  bindConsumer();
  js = nc.jetstream();
  return js;
};

export const sc = StringCodec();
