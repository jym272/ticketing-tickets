import { initializeSetup, startSetup } from './setup';
import { utils } from '@jym272ticketing/common';
const { log, successConnectionMsg } = utils;
import { getEnvOrFail, rocketEmoji } from '@utils/index';
import { getJetStreamClient, getNatsConnection } from '@events/nats-jetstream';

const { server } = initializeSetup();

const PORT = getEnvOrFail('PORT');

void (async () => {
  try {
    await getJetStreamClient();
    await startSetup(server);
    const nc = await getNatsConnection();
    // TODO: refactor with an extre funcion for nats and tested this wiht skaffold closeing
    // the nats server oberved the tickets-api being closed
    // TODO: refactor this, is horrible
    nc.closed()
      .then(() => {
        log('Nats connection closed');
        process.exit(); //is something we want! //just throw an error, not use the process.exit
      })
      .catch(err => {
        log(err);
        process.exit(); //just throw an error, not use the process.exit
      });
    server.listen(PORT, () => successConnectionMsg(`${rocketEmoji} Server is running on port ${PORT}`));
  } catch (error) {
    log(error);
    process.exitCode = 1; //nothing more to do, is going to be exit
  }
})();

const listener = async () => {
  const nc = await getNatsConnection();
  await nc.drain();
  process.exit();
};

process.on('SIGINT', listener);
process.on('SIGTERM', listener);
