import type {
  ApiErrorBody,
  ApiErrorCode,
  NotYourTimeDetails,
  TooManyTriesDetails,
} from '@stockers/shared';

/** What the API answers when something is wrong: `{code, message}` plus the HTTP status. */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** 403 NOT_YOUR_TIME carries the worker's slot and the time it is now (screen 2). */
export function isNotYourTime(
  error: unknown,
): error is ApiError & { code: 'NOT_YOUR_TIME'; details: NotYourTimeDetails } {
  return isApiError(error) && error.code === 'NOT_YOUR_TIME';
}

export function isTooManyTries(
  error: unknown,
): error is ApiError & { code: 'TOO_MANY_TRIES'; details: TooManyTriesDetails } {
  return isApiError(error) && error.code === 'TOO_MANY_TRIES';
}

type Query = Record<string, string | number | boolean | null | undefined>;

export interface ApiClient {
  get<T>(path: string, query?: Query): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  patch<T>(path: string, body?: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
  /** A file download (the owner's PDF and Excel exports). */
  blob(path: string, query?: Query): Promise<Blob>;
}

/** The error a plain failure status means, for an answer that is not `{code, message}`. */
function fallbackBody(status: number): ApiErrorBody {
  if (status === 401) return { code: 'UNAUTHENTICATED', message: 'Please sign in.' };
  if (status === 404) return { code: 'NOT_FOUND', message: 'Not found.' };
  if (status === 429) return { code: 'TOO_MANY_TRIES', message: 'Too many tries. Wait a little.' };
  return { code: 'VALIDATION', message: 'Something went wrong. Try again.' };
}

async function failure(response: Response): Promise<ApiError> {
  let body: ApiErrorBody | null = null;
  try {
    const parsed: unknown = await response.json();
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as ApiErrorBody).code === 'string' &&
      typeof (parsed as ApiErrorBody).message === 'string'
    ) {
      body = parsed as ApiErrorBody;
    }
  } catch {
    // Not JSON: use the plain answer for the status.
  }
  return new ApiError(response.status, body ?? fallbackBody(response.status));
}

/**
 * A small typed fetch wrapper. `base` is the API namespace of one app (for example `/api/counter`).
 * It holds no path of its own, so it can sit in `lib` and be used by both apps.
 */
export function createApiClient(base: string): ApiClient {
  const origin = typeof location === 'undefined' ? 'http://localhost' : location.origin;

  const url = (path: string, query?: Query): string => {
    const target = new URL(`${base}${path}`, origin);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== '') {
        target.searchParams.set(key, String(value));
      }
    }
    return target.toString();
  };

  const send = async (method: string, path: string, body?: unknown): Promise<Response> => {
    const response = await fetch(url(path), {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    });
    if (!response.ok) throw await failure(response);
    return response;
  };

  return {
    async get<T>(path: string, query?: Query) {
      const response = await fetch(url(path, query), { credentials: 'same-origin' });
      if (!response.ok) throw await failure(response);
      return (await response.json()) as T;
    },
    async post<T>(path: string, body?: unknown) {
      return (await (await send('POST', path, body)).json()) as T;
    },
    async patch<T>(path: string, body?: unknown) {
      return (await (await send('PATCH', path, body)).json()) as T;
    },
    async delete<T>(path: string) {
      return (await (await send('DELETE', path)).json()) as T;
    },
    async blob(path: string, query?: Query) {
      const response = await fetch(url(path, query), { credentials: 'same-origin' });
      if (!response.ok) throw await failure(response);
      return response.blob();
    },
  };
}
