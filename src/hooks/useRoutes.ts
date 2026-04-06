import { useState, useEffect } from "react";
import type { RouteSummary } from "../types";

export function useRoutes() {
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/routes.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load routes: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setRoutes(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { routes, loading, error };
}
