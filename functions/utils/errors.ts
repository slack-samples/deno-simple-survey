export class TriggerOperationError extends Error {
  error?: string | undefined;

  constructor(error?: string, message?: string) {
    super(message); // initialize base class
    this.error = error;
  }
}

/**
 * Define a type guard for TriggerOperationError by
 * defining a function whose return type is a type predicate
 * https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
 */
export function isTriggerOperationError(
  err: unknown,
): err is TriggerOperationError {
  return err instanceof TriggerOperationError;
}
