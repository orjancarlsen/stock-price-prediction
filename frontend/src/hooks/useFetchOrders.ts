import { useState, useEffect } from 'react';
import { Order } from '../types';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const useFetchOrders = (): Order[] => {
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        const fetchOrders = async () => {
            console.log("Fetching orders");
            try {
                const response = await fetch(`${BASE_URL}/orders`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result: Order[] = await response.json();
                setOrders(result);
            } catch (err) {
                console.error("Unexpected error:", err);
            }
        };

        fetchOrders();
    }, []);

    return orders;
};

export default useFetchOrders;
