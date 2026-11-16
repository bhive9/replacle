import { IncomingMessage, ServerResponse } from "node:http";
import { NextRequest } from "next/server";

export type RouteHandler = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<Response>;

// Next's generated route handler signature narrows params to the route's keys;
// the adapter resolves a superset, so casting through unknown is safe.
export const asRoute = (handler: unknown) => handler as RouteHandler;

export interface Route {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Express-style path, e.g. "/api/local/game/:gameId" */
  path: string;
  handler: RouteHandler;
}

interface CompiledRoute extends Route {
  segments: string[];
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function writeResponse(res: ServerResponse, response: Response) {
  res.statusCode = response.status;
  const contentType = response.headers.get("content-type");
  if (contentType) res.setHeader("content-type", contentType);
  res.end(await response.text());
}

/**
 * Adapts Next.js route handlers into a supertest-compatible app function:
 * supertest wraps any `(req, res) => void` in an HTTP server.
 */
export function createApiApp(routes: Route[]) {
  const compiled: CompiledRoute[] = routes.map((route) => ({
    ...route,
    segments: route.path.split("/").filter(Boolean),
  }));

  return async function handle(req: IncomingMessage, res: ServerResponse) {
    const url = req.url ?? "/";
    const pathname = url.split("?")[0];
    const method = (req.method ?? "GET").toUpperCase();
    const pathSegments = pathname.split("/").filter(Boolean);

    for (const route of compiled) {
      if (route.method !== method) continue;
      const params = matchSegments(route.segments, pathSegments);
      if (!params) continue;

      const body = await readBody(req);
      const nextReq = new NextRequest(`http://localhost${url}`, {
        method,
        headers: req.headers as Record<string, string>,
        body: body.length > 0 ? body : undefined,
      });
      const response = await route.handler(nextReq, { params: Promise.resolve(params) });
      await writeResponse(res, response);
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: "No route matched" }));
  };
}

function matchSegments(pattern: string[], actual: string[]): Record<string, string> | null {
  if (pattern.length !== actual.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pattern.length; i++) {
    const expected = pattern[i];
    if (expected.startsWith(":")) {
      params[expected.slice(1)] = decodeURIComponent(actual[i]);
    } else if (expected !== actual[i]) {
      return null;
    }
  }
  return params;
}
