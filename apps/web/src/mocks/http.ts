import { HttpResponse, type HttpResponseResolver } from 'msw';
import { MockApiError } from './db/errors';

export interface Call<TBody = Record<string, unknown>> {
  /** Path parameters such as `:id`. */
  param(name: string): string;
  query: URLSearchParams;
  body: TBody;
}

async function readBody(request: Request): Promise<unknown> {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'DELETE')
    return {};
  try {
    return await request.json();
  } catch {
    return {};
  }
}

/**
 * Wraps one operation of the mock as an MSW resolver. A result becomes JSON; a `MockApiError`
 * becomes `{code, message}` with its HTTP status, the way the real API answers.
 */
export function endpoint<TBody = Record<string, unknown>>(
  run: (call: Call<TBody>) => unknown,
): HttpResponseResolver {
  return async ({ request, params }) => {
    try {
      const body = (await readBody(request)) as TBody;
      const result = run({
        param: (name) => String(params[name] ?? ''),
        query: new URL(request.url).searchParams,
        body,
      });
      return HttpResponse.json((await result) ?? { ok: true });
    } catch (error) {
      if (error instanceof MockApiError)
        return HttpResponse.json(error.body, { status: error.status });
      throw error;
    }
  };
}

/** The owners' PDF and Excel downloads: a file answer, with the same error answers as any endpoint. */
export function fileEndpoint(
  run: (call: Call) => { content: string; type: string; name: string },
): HttpResponseResolver {
  return ({ request, params }) => {
    try {
      const file = run({
        param: (name) => String(params[name] ?? ''),
        query: new URL(request.url).searchParams,
        body: {},
      });
      return new HttpResponse(file.content, {
        headers: {
          'Content-Type': file.type,
          'Content-Disposition': `attachment; filename="${file.name}"`,
        },
      });
    } catch (error) {
      if (error instanceof MockApiError)
        return HttpResponse.json(error.body, { status: error.status });
      throw error;
    }
  };
}
