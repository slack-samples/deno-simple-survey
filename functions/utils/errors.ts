export class TriggerOperationError extends Error {
  error?: string | undefined;

  constructor(error?: string, message?: string) {
    super(message);
    this.error = error;
  }
}

export function isTriggerOperationError(
  err: Error,
): err is TriggerOperationError {
  return err instanceof TriggerOperationError;
}
