export class ApplicationException extends Error {
  constructor(
    message: string,
    public status: number,
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
