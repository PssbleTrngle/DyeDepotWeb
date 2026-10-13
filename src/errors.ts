export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export function badRequest(): never {
  throw new HttpError("Bad Request", 400);
}

export function invalidMethod(): never {
  throw new HttpError("Method Not Allowed", 405);
}
