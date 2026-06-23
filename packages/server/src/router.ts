type RouteHandler = (req: Request) => Response | Promise<Response>;

const routes = new Map<string, RouteHandler>();

export function route(method: string, path: string, handler: RouteHandler) {
  routes.set(`${method}:${path}`, handler);
}

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;
  const key = `${method}:${url.pathname}`;

  const handler = routes.get(key);
  if (handler) {
    return handler(req);
  }

  if (method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  return new Response("Not Found", { status: 404 });
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
