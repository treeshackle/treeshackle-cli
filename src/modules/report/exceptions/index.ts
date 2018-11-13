export class InvalidConfigurationException extends Error {
  constructor(errors: string[]) {
    const message = errors.map((e, i) => `${i}. ${e}`).join("\n");
    super(message);
    this.message = message;
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }
}
