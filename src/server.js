import { createApp } from './http/app.js';
import { config } from './config.js';

const server = createApp();

server.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
