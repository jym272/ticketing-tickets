import { TICKET_ATTRIBUTES } from '@utils/constants';
const { MAX_DECIMALS, MAX_INTEGER, MAX_VALID_TITLE_LENGTH } = TICKET_ATTRIBUTES;

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,14}$/;
  return emailRegex.test(email);
};
// min 8 characters, 1 uppercase, 1 lowercase, 1 number, no special characters
export const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
};

export const isValidTitle = (title: string): boolean => {
  const titleRegex = new RegExp(`^.{1,${MAX_VALID_TITLE_LENGTH}}$`);
  return titleRegex.test(title);
};

export const isValidPrice = (price: string): boolean => {
  const priceRegex = new RegExp(`^\\d{1,${MAX_INTEGER}}(\\.\\d{1,${MAX_DECIMALS}})?$`);
  return priceRegex.test(price);
};
