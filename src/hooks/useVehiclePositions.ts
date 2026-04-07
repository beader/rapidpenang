import { useState, useEffect, useCallback, useRef } from "react";
import type { VehiclePosition } from "../types";
import { fetchVehiclePositions } from "../services/gtfsRealtime";

const POLL_INTERVAL = 15_000;

export function useVehiclePositions(activeRouteShortName: string | null) {
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
  const [allVehicles, setAllVehicles] = useState<VehiclePosition[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL / 1000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const doFetch = useCallback(async () => {
    try {
      const all = await fetchVehiclePositions();
      setAllVehicles(all);
      setLastUpdate(Date.now());
      setError(null);
      setCountdown(POLL_INTERVAL / 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fetch failed");
    }
  }, []);

  // Filter vehicles by route (direction filtering happens in App via trip_id lookup)
  useEffect(() => {
    if (!activeRouteShortName) {
      setVehicles([]);
      return;
    }
    setVehicles(
      allVehicles.filter((v) => v.routeShortName === activeRouteShortName)
    );
  }, [allVehicles, activeRouteShortName]);

  // Polling lifecycle
  useEffect(() => {
    if (!activeRouteShortName) {
      setVehicles([]);
      setAllVehicles([]);
      setLastUpdate(null);
      return;
    }

    doFetch();
    timerRef.current = setInterval(doFetch, POLL_INTERVAL);

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    const handleVisibility = () => {
      if (document.hidden) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (countdownRef.current) clearInterval(countdownRef.current);
      } else {
        doFetch();
        timerRef.current = setInterval(doFetch, POLL_INTERVAL);
        countdownRef.current = setInterval(() => {
          setCountdown((prev) => Math.max(0, prev - 1));
        }, 1000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [activeRouteShortName, doFetch]);

  return { vehicles, lastUpdate, error, countdown };
}
