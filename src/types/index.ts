import { HttpStatusCodes } from '@utils/statusCodes';
import { JwtPayload } from 'jsonwebtoken';

export interface TicketAttributes {
  title: string;
  price: string;
  id?: string;
}

export interface ErrorWithStatus extends Error {
  statusCode: HttpStatusCodes;
}

export interface JwtPayloadCustom extends JwtPayload {
  permissions: {
    authenticated: boolean;
  };
}
