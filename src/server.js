import { createApp } from './http/app.js';
import { createRouter } from './http/router.js';
import { registerApiRoutes } from './http/routes.js';

import { createMemoryRepository } from './repositories/memory.js';
import { createMockPaymentGateway } from './lib/mockPaymentGateway.js';

import { createEventService } from './services/eventService.js';
import { createBookingService } from './services/bookingService.js';

import { config } from './config.js';

const repository = createMemoryRepository();
const paymentGateway = createMockPaymentGateway();

const eventService = createEventService(repository);
const bookingService = createBookingService(repository, paymentGateway);

const router = createRouter();

registerApiRoutes(router, eventService, bookingService);

const server = createApp({ router });

server.listen(config.port, () => {
  console.log(`Ticketing API running at http://localhost:${config.port}`);
});
