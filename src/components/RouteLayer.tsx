import { Polyline, CircleMarker, Popup } from "react-leaflet";
import type { RouteDetail } from "../types";

interface Props {
  detail: RouteDetail;
}

export default function RouteLayer({ detail }: Props) {
  return (
    <>
      {detail.shape.length > 0 && (
        <Polyline
          positions={detail.shape}
          pathOptions={{ color: "#3B82F6", weight: 5, opacity: 0.7 }}
        />
      )}
      {detail.stops.map((stop, i) => (
        <CircleMarker
          key={`${stop.stopId}-${i}`}
          center={[stop.lat, stop.lon]}
          radius={5}
          pathOptions={{
            color: "#3B82F6",
            fillColor: "#ffffff",
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{stop.stopName}</div>
              <div className="text-gray-500 text-xs">
                Stop #{stop.sequence} · {stop.stopCode}
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}
