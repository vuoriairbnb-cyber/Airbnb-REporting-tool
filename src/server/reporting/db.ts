type SupabaseError = {
  message: string;
};

type QueryResult<T = unknown> = Promise<{
  data: T | null;
  error: SupabaseError | null;
}>;

export type SupabaseQueryBuilder<T = unknown> = {
  select(columns?: string): SupabaseQueryBuilder<T>;
  insert(values: unknown): SupabaseQueryBuilder<T>;
  update(values: unknown): SupabaseQueryBuilder<T>;
  delete(): SupabaseQueryBuilder<T>;
  eq(column: string, value: unknown): SupabaseQueryBuilder<T>;
  gte(column: string, value: unknown): SupabaseQueryBuilder<T>;
  lte(column: string, value: unknown): SupabaseQueryBuilder<T>;
  order(
    column: string,
    options?: {
      ascending?: boolean;
      nullsFirst?: boolean;
    }
  ): SupabaseQueryBuilder<T>;
  single(): QueryResult<T>;
  then<TResult1 = { data: T | null; error: SupabaseError | null }, TResult2 = never>(
    onfulfilled?:
      | ((value: {
          data: T | null;
          error: SupabaseError | null;
        }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2>;
};

export type SupabaseReportingClient = {
  from(table: string): SupabaseQueryBuilder;
};
