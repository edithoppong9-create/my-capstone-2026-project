
export function createRouter() {
  const routes = [];

  function add(method, path, handler) {
    const keys = [];
    const pattern = path
      .split('/')
      .map((segment) => {
        if (segment.startsWith(':')) {
          keys.push(segment.slice(1));
          return '([^/]+)';
        }

        return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('/');

    routes.push({
      method: method.toUpperCase(),
      path,
      handler,
      keys,
      regex: new RegExp(`^${pattern}/?$`),
    });
  }

  return {
    get(path, handler) {
      add('GET', path, handler);
    },

    post(path, handler) {
      add('POST', path, handler);
    },

    put(path, handler) {
      add('PUT', path, handler);
    },

    patch(path, handler) {
      add('PATCH', path, handler);
    },

    delete(path, handler) {
      add('DELETE', path, handler);
    },

    match(method, pathname) {
      for (const route of routes) {
        if (route.method !== method.toUpperCase()) {
          continue;
        }

        const match = pathname.match(route.regex);

        if (match) {
          const params = {};

          route.keys.forEach((key, index) => {
            params[key] = decodeURIComponent(match[index + 1]);
          });

          return {
            handler: route.handler,
            params,
          };
        }
      }

      return null;
    },
  };
}
