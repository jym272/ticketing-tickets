import { TICKET_ATTRIBUTES } from '@utils/constants';
import crypto from 'crypto';
import { signJwtToken } from '@tests/test-utils/signJwtToken';

// eslint-disable-next-line no-unused-vars
enum PriceValidity {
  // eslint-disable-next-line no-unused-vars
  Invalid,
  // eslint-disable-next-line no-unused-vars
  Valid
}
export const priceValidity = {
  ...PriceValidity
};

const { MAX_DECIMALS, MAX_INTEGER } = TICKET_ATTRIBUTES;

const createRandomMultiplier = (maxZeros: number) => {
  if (maxZeros < 0) throw new Error('maxZeros must be greater than or equal to 0');
  const validValues = [];
  for (const i of Array(maxZeros + 1).keys()) {
    validValues.push(Math.pow(10, i));
  }
  const randomIndex = Math.floor(Math.random() * validValues.length);
  return validValues[randomIndex];
};

export const createAPrice = (valid = PriceValidity.Valid) => {
  const invalidIntegerPartMultiplier = Math.pow(10, MAX_INTEGER + 1);
  const invalidDecimalPartMultiplier = Math.pow(10, MAX_DECIMALS + 1);
  const integerMultiplier = valid ? createRandomMultiplier(MAX_INTEGER) : invalidIntegerPartMultiplier;
  const decimalMultiplier = valid ? createRandomMultiplier(MAX_DECIMALS) : invalidDecimalPartMultiplier;
  const integerPrice = Math.floor(Math.random() * integerMultiplier).toString();
  const decimalPrice = Math.floor(Math.random() * decimalMultiplier).toString();
  return `${integerPrice}.${decimalPrice}`;
};

export const generateRandomString = (size: number) => crypto.randomBytes(size).toString('hex');

export const createACookieSession = (user: { userEmail: string; userId: string }) => {
  const token = signJwtToken(user);
  const session = JSON.stringify({ jwt: token });
  const encodedSession = Buffer.from(session).toString('base64');
  return `session=${encodedSession}`;
};
