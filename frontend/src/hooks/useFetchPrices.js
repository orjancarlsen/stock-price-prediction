import { useState, useEffect } from 'react';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

const useFetchPrices = (ticker, fromDate, toDate) => {
    const [data, setData] = useState({ dates: [], prices: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                const response = await fetch(`${BASE_URL}/companies/price/${ticker}?fromDate=${fromDate}&toDate=${toDate}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    signal,
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();
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
