function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(data));
}

export function registerApiRoutes(router, eventService, bookingService) {
  router.post('/api/events', async (request, response) => {
    const event = await eventService.createEvent(
      request.body,
      request.headers['x-user-id']
    );
    sendJson(response, 201, event);
  });

  router.get('/api/events', async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const criteria = Object.fromEntries(url.searchParams.entries());
    const events = await eventService.searchPublishedEvents(criteria);
    sendJson(response, 200, events);
  });

  router.get('/api/events/:id', async (request, response, params) => {
    const event = await eventService.getEvent(
      params.id,
      request.headers['x-user-id']
    );
    sendJson(response, 200, event);
  });

  router.post('/api/events/:id/tiers', async (request, response, params) => {
    const event = await eventService.addTier(
      params.id,
      request.body,
      request.headers['x-user-id']
    );
    sendJson(response, 201, event);
  });

  router.post('/api/events/:id/publish', async (request, response, params) => {
    const event = await eventService.publishEvent(
      params.id,
      request.headers['x-user-id']
    );
    sendJson(response, 200, event);
  });

  router.post('/api/events/:id/unpublish', async (request, response, params) => {
    const event = await eventService.unpublishEvent(
      params.id,
      request.headers['x-user-id']
    );
    sendJson(response, 200, event);
  });

  router.post('/api/bookings', async (request, response) => {
    const booking = await bookingService.book(
      request.body,
      request.headers['x-user-id']
    );
    sendJson(response, 201, booking);
  });

  router.get('/api/bookings/:reference', async (request, response, params) => {
    const booking = await bookingService.getBooking(
      params.reference,
      request.headers['x-user-id']
    );
    sendJson(response, 200, booking);
  });

  router.post('/api/bookings/:reference/pay', async (request, response, params) => {
    const booking = await bookingService.pay(
      params.reference,
      request.body,
      request.headers['x-user-id']
    );
    sendJson(response, 200, booking);
  });

  router.post('/api/bookings/:reference/cancel', async (request, response, params) => {
    const booking = await bookingService.cancel(
      params.reference,
      request.headers['x-user-id']
    );
    sendJson(response, 200, booking);
  });
}
