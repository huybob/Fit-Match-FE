export class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string = "HTTP_ERROR",
    public readonly path?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
