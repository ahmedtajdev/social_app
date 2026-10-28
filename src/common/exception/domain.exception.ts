import { ApplicationException } from "./application.exception";

export class BadRequestException extends ApplicationException {
  constructor(message: string = "BadRequest", cause?: unknown) {
    super(message, 400, cause);
  }
}

export class NotfoundException extends ApplicationException {
  constructor(message: string = "Notfound", cause?: unknown) {
    super(message, 404, cause);
  }
}

export class UnauthorizedException extends ApplicationException {
  constructor(message: string = "Unauthorized", cause?: unknown) {
    super(message, 401, cause);
  }
}

export class ForbiddenException extends ApplicationException {
  constructor(message: string = "Forbidden", cause?: unknown) {
    super(message, 403, cause);
  }
}

export class ConflictException extends ApplicationException {
  constructor(message: string = "Conflict", cause?: unknown) {
    super(message, 409, cause);
  }
}

export class TooManyRequestException extends ApplicationException {
  constructor(message: string = "TooManyRequest", cause?: unknown) {
    super(message, 429, cause);
  }
}
