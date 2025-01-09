import { useState, useEffect } from 'react';
import { Transaction } from '../types';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const useFetchTransactions = (): Transaction[] => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        const fetchTransactions = async () => {
            console.log("Fetching transactions");
            try {
                const response = await fetch(`${BASE_URL}/transactions`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result: Transaction[] = await response.json();
                setTransactions(result);
            } catch (err) {
                console.error("Unexpected error:", err);
            }
        };

        fetchTransactions();
    }, []);

    return transactions;
};

export default useFetchTransactions;
