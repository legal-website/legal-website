'use client'

import { useState, useEffect } from 'react';

export default function AnalyticsTestPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/analytics/test-connection');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Analytics Test Page</h1>
      {loading ? (
        <div>Loading...</div>
      ) : data ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <div>Error loading data.</div>
      )}
    </div>
  );
}