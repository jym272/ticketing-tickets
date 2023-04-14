import { initializeSetup, startSetup } from './setup';
import { utils, events } from '@jym272ticketing/common';
const { log, successConnectionMsg } = utils;
const { subjects, subscribe } = events;
import { getEnvOrFail, rocketEmoji } from '@utils/index';
import { nc, startJetStream, Streams } from '@jym272ticketing/common/dist/events';
import { orderCancelledListener, orderCreatedListener } from '@events/listeners';

const { server } = initializeSetup();

const PORT = getEnvOrFail('PORT');

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
    // TODO: logs red and green and yellow with chalk
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
