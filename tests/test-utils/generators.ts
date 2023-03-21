import { TICKET_ATTRIBUTES } from '@utils/constants';
import crypto from 'crypto';
import { signJwtToken } from '@tests/test-utils/signJwtToken';
import { Ticket, TicketAttributes } from '@custom-types/index';
const { MAX_VALID_TITLE_LENGTH, MAX_INTEGER, MAX_DECIMALS } = TICKET_ATTRIBUTES;

const createRandomMultiplier = (maxZeros: number) => {
  if (maxZeros < 0) throw new Error('maxZeros must be greater than or equal to 0');
  const validValues = [];
  for (const i of Array(maxZeros + 1).keys()) {
    validValues.push(Math.pow(10, i));
  }
  const randomIndex = Math.floor(Math.random() * validValues.length);
  return validValues[randomIndex];
};

/*
 * Valid price: [1.0, 100000000.99] with MAX_INTEGER 8 and MAX_DECIMALS 2
 */
export const createAValidPrice = (): string => {
  const integerMultiplier = createRandomMultiplier(MAX_INTEGER);
  const decimalMultiplier = createRandomMultiplier(MAX_DECIMALS);
  // integerMultiplier -> [1, 10, ..., 10**8]
  //  1 - Math.random() -> (0, 1]
  // (0, 1] * [1, 10, ..., 10**8] -> [1, 10, ..., 10**8]
  // integerPriceValid -> [1, 10**8] with MAX_INTEGER 8
  const integerPrice = Math.ceil((1 - Math.random()) * integerMultiplier).toString();
  // decimalMultiplier -> [1, 10, 100]
  //  Math.random() -> [0, 1)
  // [0, 1) * [1, 10, 100] -> [0, 100) -> con floor -> [0, 99]
  // decimalPriceValid -> [0, 99] with MAX_DECIMALS 2
  const decimalPrice = Math.floor(Math.random() * decimalMultiplier).toString();
  return `${integerPrice}.${decimalPrice}`;
};
/*
 * With a valid integer part, the decimal part is invalid:
 * X -> digit between [1, 9]
 * [validIntegerPart.XXX , validIntegerPart.XXXXXXX]
 * With a valid decimal part, the integer part is invalid:
 * invalidIntegerPart -> the digits of the invalid integer part are between [MAX_INTEGER + 1, MAX_INTEGER + 5]
 */
export const createAnInvalidPrice = (): string => {
  const choice = Math.random() > 0.5 ? 'integer' : 'decimal';
  const validPrice = createAValidPrice();
  let [integer, decimal] = validPrice.toString().split('.');
  const numberOfDecimalsToAdd = Math.ceil(Math.random() * 6 + 1);
  switch (choice) {
    case 'decimal': {
      // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars -- because only the iteration is needed
      for (const i of Array(numberOfDecimalsToAdd).keys()) {
        const randomDigit = Math.ceil((1 - Math.random()) * 9).toString();
        decimal = decimal + randomDigit;
      }
      return `${integer}.${decimal}`;
    }
    case 'integer': {
      const integerDigitsToaAdd = MAX_INTEGER + Math.floor(Math.random() * 5);
      // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars -- because only the iteration is needed
      for (const i of Array(integerDigitsToaAdd).keys()) {
        const randomDigit = Math.ceil((1 - Math.random()) * 9).toString();
        integer = integer + randomDigit;
      }
      return `${integer}.${decimal}`;
    }
  }
};

/*
 * @param {number} maxStringLength - the maximum length of the string to be generated
 * @param {boolean} fixedLength - if true, the generated string will always be of length maxStringLength
 * @returns {string} - a random string of length between 1 and maxStringLength, not a number
 */
export const generateRandomString = (maxStringLength: number, fixedLength = false): string => {
  if (maxStringLength < 1) throw new Error('maxStringLength must be greater than or equal to 1');
  const randomString = crypto.randomBytes(maxStringLength).toString('hex');
  // randomStringLength -> [1,maxStringLength]
  const randomStringLength = Math.ceil((1 - Math.random()) * maxStringLength);
  const generatedString = randomString.slice(0, fixedLength ? maxStringLength : randomStringLength);
  if (isNaN(Number(generatedString))) return generatedString;
  return generateRandomString(maxStringLength, fixedLength);
};
// generateA32BitUnsignedInteger -> [1, 2^32 - 1]
export const generateA32BitUnsignedInteger = () => {
  //by definition, 32-bit unsigned integers can only be between 0 and 2^32 - 1
  const maxNumber = Math.pow(2, 31) - 1;
  const numberOfDigitsInMaxNumber = maxNumber.toString().length;
  // power [0,9]
  const power = Math.floor(Math.random() * numberOfDigitsInMaxNumber);
  // rand is between (0,1]
  const rand = 1 - Math.random();
  return Math.ceil(rand * maxNumber * Math.pow(10, -power));
};
export const createACookieSession = (user: { userEmail: string; userId: number }) => {
  const token = signJwtToken(user);
  const session = JSON.stringify({ jwt: token });
  const encodedSession = Buffer.from(session).toString('base64');
  return `session=${encodedSession}`;
};

export const generateValidTicketAttributes = (): TicketAttributes => {
  return {
    title: generateRandomString(MAX_VALID_TITLE_LENGTH),
    price: Number(createAValidPrice())
  };
};

export const generateValidTicket = (userId: number): Ticket => {
  return {
    ...generateValidTicketAttributes(),
    userId
  };
};
