import { useState, useMemo, useRef, useEffect } from "react";
import type { RouteSummary } from "../types";

interface Props {
  routes: RouteSummary[];
  onSelect: (route: RouteSummary) => void;
  selectedRoute: RouteSummary | null;
}

export default function SearchPanel({ routes, onSelect, selectedRoute }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return routes;
    const q = query.toLowerCase();
    return routes.filter(
      (r) =>
        r.shortName.toLowerCase().includes(q) ||
        r.directions.some((d) => d.headsign.toLowerCase().includes(q))
    );
  }, [routes, query]);

  // Close dropdown on outside click/touch
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  return (
    <div ref={panelRef} className="relative">
      {selectedRoute && !open ? (
        <button
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="w-full px-4 py-3 rounded-xl bg-white shadow-md border border-gray-200 text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-700">{selectedRoute.shortName}</span>
            <span className="text-gray-500 text-xs truncate max-w-[180px]">
              {selectedRoute.directions.map((d) => d.headsign).join(" / ")}
            </span>
          </div>
          <span className="text-gray-400 text-xs">Change</span>
        </button>
      ) : (
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          placeholder="Search route (e.g. 101, 401)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
        />
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute z-[1000] mt-1 w-full max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg overscroll-contain">
          {filtered.map((r) => (
            <li
              key={r.routeId}
              onClick={() => {
                onSelect(r);
                setQuery("");
                setOpen(false);
                inputRef.current?.blur();
              }}
              className={`px-4 py-3.5 cursor-pointer active:bg-blue-50 border-b border-gray-100 last:border-b-0 ${
                selectedRoute?.routeId === r.routeId ? "bg-blue-50" : ""
              }`}
            >
              <span className="font-semibold text-blue-700 mr-2 text-base">
                {r.shortName}
              </span>
              <span className="text-gray-500 text-xs">
                {r.directions.map((d) => d.headsign).join(" / ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
