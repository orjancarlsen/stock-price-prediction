import { useState, useEffect } from 'react';

export const useFetchCompanies = (url) => {
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Ensure data is an array of objects
        if (Array.isArray(data)) {
          setCompanies(data); // Store the array of company objects
        } else {
          throw new Error("Unexpected response format");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [url]);

  return { companies, error, loading };
};
