import { Ticket } from '@db/models';

export interface TicketAttributes {
  title: string;
  price: number;
}

export interface Order {
  id: number;
  ticket: Ticket;
  status: string;
}
