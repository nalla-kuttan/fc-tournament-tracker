export class FetchError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly requestId?: string
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

export async function fetcher(url: string) {
  const response = await fetch(url, { cache: 'no-store' });
  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null;
  if (!response.ok) {
    throw new FetchError(
      body?.error || `Request failed with status ${response.status}`,
      response.status,
      body?.code,
      body?.requestId
    );
  }
  return body;
}
