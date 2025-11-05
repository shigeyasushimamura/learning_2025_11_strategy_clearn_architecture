export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
  readonly isSuccess = true;
  readonly isFailure = false;

  constructor(readonly value: T) {}

  unwrap(): T {
    return this.value;
  }

  unwrapError(): never {
    throw new Error("Called unwrapError on Success");
  }

  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Success(fn(this.value));
  }

  flatMap<U, E>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }
}

export class Failure<E> {
  readonly isSuccess = false;
  readonly isFailure = true;

  constructor(readonly error: E) {}

  unwrap(): never {
    throw new Error("Cannot unwrap on Failure");
  }

  unwrapError(): E {
    return this.error;
  }

  map<U>(_fn: (value: never) => U): Result<U, E> {
    return new Failure(this.error);
  }

  flatMap<U>(_fn: (value: never) => Result<U, E>): Result<U, E> {
    return new Failure(this.error);
  }
}

export const ok = <T>(value: T): Success<T> => new Success(value);
export const fail = <E>(error: E): Failure<E> => new Failure(error);
