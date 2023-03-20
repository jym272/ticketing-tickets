import express from 'express';
import { home } from '@routes/home';
import { utils } from '@routes/utils';
import { tickets } from '@routes/tickets';

const routes = [home, tickets, utils];

export const addRoutes = (server: express.Express) => {
  for (const route of routes) {
    server.use(route);
  }
};
