import { useState, useEffect } from 'react';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

interface PriceData {
    dates: string[];
    prices: number[];
}

interface UseFetchPricesResult {
    data: PriceData;
    loading: boolean;
    error: string | null;
}

export const useFetchPrices = (ticker: string, fromDate?: string, toDate?: string): UseFetchPricesResult => {
    const [data, setData] = useState<PriceData>({ dates: [], prices: [] });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!ticker) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        const signal = controller.signal;

        const fetchPrices = async () => {
            console.log("Fetching prices for:", ticker);
            setLoading(true);

            try {
                const url = new URL(`${BASE_URL}/companies/price/${ticker}`);
                if (fromDate) url.searchParams.append('fromDate', fromDate);
                if (toDate) url.searchParams.append('toDate', toDate);

                const response = await fetch(url.toString(), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    signal,
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result: PriceData = await response.json();
                setData(result);
            } catch (err) {
                if (err instanceof Error) {
                    if (err.name === 'AbortError') {
                        console.log("Fetch aborted");
                    } else {
                        console.error("Fetch error:", err.message);
                        setError(err.message);
                    }
                } else {
                    console.error("Unexpected error:", err);
                    setError("An unexpected error occurred");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();

        return () => {
            controller.abort(); // Abort the fetch on cleanup
        };
    }, [ticker, fromDate, toDate]);

    return { data, loading, error };
};

export default useFetchPrices;
