const DEFAULT_PAGE_SIZE = 1000;

export interface PageResult<T, E = unknown> {
  data: T[] | null;
  error: E | null;
}

export async function fetchAllRows<T, E = unknown>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T, E>>,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PageResult<T, E>> {
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    if (page.error) return { data: null, error: page.error };

    const pageRows = page.data ?? [];
    rows.push(...pageRows);
    if (pageRows.length < pageSize) return { data: rows, error: null };
  }
}
