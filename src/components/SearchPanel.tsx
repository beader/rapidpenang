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

  const filtered = useMemo(() => {
    if (!query.trim()) return routes;
    const q = query.toLowerCase();
    return routes.filter(
      (r) =>
        r.shortName.toLowerCase().includes(q) ||
        r.directions.some((d) => d.headsign.toLowerCase().includes(q))
    );
  }, [routes, query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={panelRef} className="relative">
      <input
        type="text"
        placeholder="Search route..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      {selectedRoute && !open && (
        <div className="mt-2 px-3 py-2 bg-blue-50 rounded-md text-sm text-blue-800 flex items-center justify-between">
          <span className="font-semibold">{selectedRoute.shortName}</span>
          <button
            onClick={() => {
              onSelect(null as unknown as RouteSummary);
              setQuery("");
            }}
            className="text-blue-500 hover:text-blue-700 text-xs ml-2"
          >
            Clear
          </button>
        </div>
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute z-[1000] mt-1 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {filtered.map((r) => (
            <li
              key={r.routeId}
              onClick={() => {
                onSelect(r);
                setQuery("");
                setOpen(false);
              }}
              className={`px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${
                selectedRoute?.routeId === r.routeId ? "bg-blue-50" : ""
              }`}
            >
              <span className="font-semibold text-blue-700 mr-2">
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
