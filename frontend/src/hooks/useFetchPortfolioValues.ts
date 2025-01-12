import { useState, useEffect } from 'react';
import { PortfolioValue } from '../types';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const useFetchPortfolioValues = (): PortfolioValue[] => {
    const [portfolioValues, setPortfolioValues] = useState<PortfolioValue[]>([]);

    useEffect(() => {
        const fetchPortfolioValues = async () => {
            console.log("Fetching portfolio values");
            try {
                const response = await fetch(`${BASE_URL}/portfolio/values`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result: PortfolioValue[] = await response.json();
                setPortfolioValues(result);
            } catch (err) {
                console.error("Unexpected error:", err);
            }
        };

        fetchPortfolioValues();
    }, []);

    return portfolioValues;
};

export default useFetchPortfolioValues;
