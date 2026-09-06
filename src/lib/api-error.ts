export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly code = 'BAD_REQUEST'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
