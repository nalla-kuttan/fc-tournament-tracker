class FetchError extends Error {
    status?: number;
}

export const fetcher = (url: string) => fetch(url).then((res) => {
    if (!res.ok) {
        const error = new FetchError('An error occurred while fetching the data.');
        error.status = res.status;
        throw error;
    }
    return res.json();
});
