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
    const fallbackMessage = response.status >= 500
      ? 'Live data could not be loaded. Please retry.'
      : `The request could not be completed (${response.status}).`;
    throw new FetchError(
      body?.error || fallbackMessage,
      response.status,
      body?.code,
      body?.requestId
    );
  }
  return body;
}
