import { useState, useEffect } from 'react';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

export const useFetchCompanies = (endpoint) => {
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchCompanies = async () => {
      console.log("Fetching companies from:", `${BASE_URL}${endpoint}`);
      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, { signal });
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setCompanies(data);
        } else {
          setError("Invalid data format");
          setCompanies([]);
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log("Fetch aborted");
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();

    return () => {
      controller.abort(); // Abort the fetch on cleanup
    };
  }, []);

  return { companies, error, loading };
};
