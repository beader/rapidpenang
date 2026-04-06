import type { RouteDetail, RouteSummary, VehiclePosition } from "../types";
import DirectionToggle from "./DirectionToggle";

interface Props {
  route: RouteSummary;
  detail: RouteDetail | null;
  directionId: number;
  onDirectionChange: (directionId: number) => void;
  vehicles: VehiclePosition[];
  lastUpdate: number | null;
  countdown: number;
  error: string | null;
  onStopClick: (lat: number, lon: number) => void;
}

export default function InfoPanel({
  route,
  detail,
  directionId,
  onDirectionChange,
  vehicles,
  lastUpdate,
  countdown,
  error,
  onStopClick,
}: Props) {
  const timeAgo = lastUpdate
    ? `${Math.round((Date.now() - lastUpdate) / 1000)}s ago`
    : "--";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-blue-700">
          {route.shortName}
        </span>
        <span className="text-xs text-gray-500">{detail?.headsign}</span>
      </div>

      <DirectionToggle
        directions={route.directions}
        activeDirection={directionId}
        onChange={onDirectionChange}
      />

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          🚌 <strong className="text-gray-700">{vehicles.length}</strong> online
        </span>
        <span className="flex items-center gap-1">
          {error ? (
            <span className="text-red-500">⚠ {error}</span>
          ) : (
            <>
              Updated {timeAgo} · Next in {countdown}s
            </>
          )}
        </span>
      </div>

      {detail && detail.stops.length > 0 && (
        <div className="border-t border-gray-200 pt-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">
            Stops
          </h3>
          <ul className="space-y-1 max-h-[40vh] overflow-y-auto">
            {detail.stops.map((stop, i) => (
              <li
                key={`${stop.stopId}-${i}`}
                onClick={() => onStopClick(stop.lat, stop.lon)}
                className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <span className="text-gray-700">{stop.stopName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
