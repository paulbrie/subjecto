/**
 * Custom error for when `nextAssign` is called with a non-object value.
 */
export class SubjectInvalidValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubjectInvalidValueError";
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, SubjectInvalidValueError.prototype);
  }
}

/**
 * Custom error for when `nextPush` is called on a subject whose value is not an array.
 */
export class SubjectNotAnArrayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubjectNotAnArrayError";
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, SubjectNotAnArrayError.prototype);
  }
}
