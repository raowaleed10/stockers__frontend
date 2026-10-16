import type { ApiErrorBody, ApiErrorCode } from '@stockers/shared';

/** What a mock operation throws. The handler turns it into `{code, message}` with the HTTP status. */
export class MockApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'MockApiError';
    this.status = status;
    this.body = body;
  }
}

const STATUS: Record<ApiErrorCode, number> = {
  UNAUTHENTICATED: 401,
  SESSION_ENDED: 401,
  NOT_YOUR_TIME: 403,
  WRONG_PIN: 401,
  WRONG_PASSWORD: 401,
  TOO_MANY_TRIES: 429,
  NOT_FOUND: 404,
  VALIDATION: 400,
  PRICE_NOT_SET: 409,
  TABLE_BUSY: 409,
  TABLE_OUT_OF_ORDER: 409,
  UNDO_EXPIRED: 409,
  CHANGE_TYPE_EXPIRED: 409,
  GAME_NOT_RUNNING: 409,
  BILL_MISMATCH: 400,
  NOTE_REQUIRED: 400,
  OUT_OF_STOCK: 409,
  NOT_ALLOWED: 403,
};

export function fail(code: ApiErrorCode, message: string, details?: unknown): never {
  throw new MockApiError(STATUS[code], { code, message, details });
}

/** Runs a rule from `@stockers/shared`; a `RangeError` from it becomes a plain 400 answer. */
export function rule<T>(run: () => T, code: ApiErrorCode = 'VALIDATION'): T {
  try {
    return run();
  } catch (error) {
    if (error instanceof RangeError) return fail(code, error.message);
    throw error;
  }
}
