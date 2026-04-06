import { useState, useEffect } from "react";
import type { RouteDetail } from "../types";

export function useRouteDetail(routeId: string | null, directionId: number) {
  const [detail, setDetail] = useState<RouteDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!routeId) {
      setDetail(null);
      return;
    }

    setLoading(true);
    fetch(
      `${import.meta.env.BASE_URL}data/route-details/${routeId}_${directionId}.json`
    )
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load route detail`);
        return res.json();
      })
      .then((data) => {
        setDetail(data);
        setLoading(false);
      })
      .catch(() => {
        setDetail(null);
        setLoading(false);
      });
  }, [routeId, directionId]);

  return { detail, loading };
}
