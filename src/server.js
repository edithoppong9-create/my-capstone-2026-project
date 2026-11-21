import { createApp } from './http/app.js';
import { createRouter } from './http/router.js';
import { registerApiRoutes } from './http/routes.js';

import { createDatabase } from './db/connection.js';
import { createSQLiteRepository } from './repositories/sqlite.js';
import { createMockPaymentGateway } from './lib/mockPaymentGateway.js';

import { createEventService } from './services/eventService.js';
import { createBookingService } from './services/bookingService.js';

import { config } from './config.js';

const db = createDatabase();
const repository = createSQLiteRepository(db);
const paymentGateway = createMockPaymentGateway();

const eventService = createEventService(repository);
const bookingService = createBookingService(repository, paymentGateway);

const router = createRouter();

registerApiRoutes(router, eventService, bookingService);

const server = createApp({ router });

server.listen(config.port, () => {
  console.log(`Ticketing API running at http://localhost:${config.port}`);
});
