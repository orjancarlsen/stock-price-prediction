import { useState, useEffect } from 'react';
import { Company } from '../types';

const BASE_URL = process.env.REACT_APP_BACKEND_URL;

interface UseFetchCompaniesResult {
  companies: Company[];
  error: string | null;
  loading: boolean;
}

export const useFetchCompanies = (endpoint: string): UseFetchCompaniesResult => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
      } catch (err: any) {
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
  }, [endpoint]);

  return { companies, error, loading };
};
