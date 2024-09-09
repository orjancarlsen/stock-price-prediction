import { useState, useEffect } from 'react';

export const useFetchCompanies = (url) => {
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch(url);
        console.log("Response: " + response);
        const data = await response.json();
        setCompanies(data);
      } catch (err) {
        console.log("Failed here: " + err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [url]);

  return { companies, error, loading };
};
