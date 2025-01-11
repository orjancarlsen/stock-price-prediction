import { useState, useEffect } from 'react';
import { Asset } from '../types';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const useFetchPortfolio = (): Asset[] => {
    const [portfolio, setPortfolio] = useState<Asset[]>([]);

    useEffect(() => {
        const fetchPortfolio = async () => {
            console.log("Fetching portfolio");
            try {
                const response = await fetch(`${BASE_URL}/portfolio`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result: Asset[] = await response.json();
                setPortfolio(result);
            } catch (err) {
                console.error("Unexpected error:", err);
            }
        };

        fetchPortfolio();
    }, []);

    return portfolio;
};

export default useFetchPortfolio;
