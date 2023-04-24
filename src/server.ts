import { initializeSetup, startSetup } from './setup';
import { utils, events } from '@jym272ticketing/common';
const { log, successConnectionMsg, getEnvOrFail, rocketEmoji } = utils;
const { subjects, subscribe } = events;
import { nc, startJetStream, Streams } from '@jym272ticketing/common/dist/events';
import { orderCancelledListener, orderCreatedListener } from '@events/listeners';

const { server } = initializeSetup();

const PORT = getEnvOrFail('PORT');
// some silly comment again
void (async () => {
  const queueGroupName = 'tickets-service';
  try {
    await startJetStream({
      queueGroupName,
      streams: [Streams.TICKETS, Streams.ORDERS],
      nats: {
        url: `nats://${getEnvOrFail('NATS_SERVER_HOST')}:${getEnvOrFail('NATS_SERVER_PORT')}`
      }
    });
    await startSetup(server);
    server.listen(PORT, () => successConnectionMsg(`${rocketEmoji} Server is running on port ${PORT}`));
    void subscribe(subjects.OrderCreated, queueGroupName, orderCreatedListener);
    void subscribe(subjects.OrderUpdated, queueGroupName, orderCancelledListener);
  } catch (error) {
    log(error);
    process.exitCode = 1;
  }
})();

const listener = async () => {
  if (nc) {
    await nc.drain();
    log('NATS connection drained');
  }
  process.exit();
};

process.on('SIGINT', listener);
process.on('SIGTERM', listener);
