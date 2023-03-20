import childProcess from 'child_process';
import { promisify } from 'util';
import { utils } from '@jym272ticketing/common';
const { activateLogging, log } = utils;

const exec = promisify(childProcess.exec);

export const truncateTicketsTable = async (logging = activateLogging()) => {
  try {
    const { stdout, stderr } = await exec('./scripts/truncate-table');
    if (stderr) log(stderr);
    if (stdout && logging) log(stdout);
  } catch (error) {
    log(`Error executing script: ${error as string}`);
  }
};
