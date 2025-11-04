export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
  readonly isSuccess = true;
  readonly isFailure = false;

  constructor(readonly value: T) {}

  // mapは値を別の型に変換する方なので、新しい型パラメータUが必要
  // T型の値を受け取り、U型に変換する関数fnを適用して、その結果をResult<U,never>として返す
  // 成功時(success)のmapでは失敗することがないので、エラー型Eは存在しない->neverを使う
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

  map<U>(_fn: (value: never) => U): Result<U, E> {
    return new Failure(this.error);
  }

  flatMap<U>(_fn: (value: never) => Result<U, E>): Result<U, E> {
    return new Failure(this.error);
  }
}

// ヘルパー関数
export const ok = <T>(value: T): Success<T> => new Success(value);
export const fail = <E>(error: E): Failure<E> => new Failure(error);
