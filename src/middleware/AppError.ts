export class AppError extends Error {
  constructor(
    public message: string,
    public statusNumber: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}
