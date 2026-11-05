
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRouter } from './router.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.resolve(currentDirectory, '../../public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(data));
}

function sendError(response, statusCode, code, message) {
  sendJson(response, statusCode, {
    error: { code, message },
  });
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString('utf8');

  if (!body.trim()) {
    throw Object.assign(new Error('Request body is empty.'), {
      code: 'INVALID_JSON',
    });
  }

  try {
    return JSON.parse(body);
  } catch {
    throw Object.assign(new Error('Request body must contain valid JSON.'), {
      code: 'INVALID_JSON',
    });
  }
}

async function serveStaticFile(response, pathname) {
  let decodedPath;

  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    sendError(response, 400, 'INVALID_PATH', 'The requested path is invalid.');
    return;
  }

  const relativePath = decodedPath.replace(/^\/+/, '') || 'index.html';
  const filePath = path.resolve(publicDirectory, relativePath);
  const relativeToPublic = path.relative(publicDirectory, filePath);

  if (
    relativeToPublic === '..' ||
    relativeToPublic.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToPublic)
  ) {
    sendError(response, 403, 'FORBIDDEN', 'Access to this path is not allowed.');
    return;
  }

  try {
    const fileInfo = await stat(filePath);

    if (!fileInfo.isFile()) {
      sendError(response, 404, 'NOT_FOUND', 'File not found.');
      return;
    }

    const contents = await readFile(filePath);
    const contentType =
      MIME_TYPES[path.extname(filePath).toLowerCase()] ??
      'application/octet-stream';

    response.writeHead(200, { 'Content-Type': contentType });
    response.end(contents);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      sendError(response, 404, 'NOT_FOUND', 'File not found.');
      return;
    }

    throw error;
  }
}

export function createApp() {
  const router = createRouter();

  router.get('/health', (_request, response) => {
    sendJson(response, 200, { status: 'ok' });
  });

  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      const { pathname } = url;
      const isApiRequest =
        pathname === '/api' || pathname.startsWith('/api/');

        if (
          isApiRequest &&
          request.method !== 'GET' &&
          request.method !== 'HEAD'
        ) {
          request.body = await readJsonBody(request);
        }

      const route = router.match(request.method, pathname);

      if (route) {
        await route.handler(request, response, route.params);
        return;
      }

      if (pathname.startsWith('/api/')) {
        sendError(response, 404, 'NOT_FOUND', 'API route not found.');
        return;
      }

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        sendError(
          response,
          405,
          'METHOD_NOT_ALLOWED',
          'This HTTP method is not supported for static files.',
        );
        return;
      }

      if (request.method === 'HEAD') {
        const temporaryResponse = {
          writeHead(statusCode, headers) {
            response.writeHead(statusCode, headers);
          },
          end() {
            response.end();
          },
        };

        await serveStaticFile(temporaryResponse, pathname);
        return;
      }

      await serveStaticFile(response, pathname);
    } catch (error) {
      if (error.code === 'INVALID_JSON') {
        sendError(response, 400, 'INVALID_JSON', error.message);
        return;
      }

      if (!response.headersSent) {
        sendError(response, 500, 'INTERNAL_ERROR', 'An internal server error occurred.');
      } else {
        response.destroy();
      }
    }
  });
}

export { readJsonBody };
