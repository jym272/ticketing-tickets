import { JwtPayload } from 'jsonwebtoken';

export interface TicketAttributes {
  title: string;
  price: string;
  id?: string;
}

export interface JwtPayloadCustom extends JwtPayload {
  permissions: {
    authenticated: boolean;
  };
}
