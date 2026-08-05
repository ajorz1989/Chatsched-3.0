export class AppError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status?: number) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
