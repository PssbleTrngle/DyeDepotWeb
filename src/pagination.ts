export type Pagination = {
  next?: number;
  previous?: number;
  total: number;
  page: number;
};

export type Page<T> = {
  values: T[];
  pagination: Pagination;
};
