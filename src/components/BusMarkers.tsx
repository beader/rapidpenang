import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { VehiclePosition } from "../types";

function createBusIcon(bearing: number, moving: boolean): L.DivIcon {
  const color = moving ? "#22C55E" : "#9CA3AF";
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    html: `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(${bearing}, 14, 14)">
        <circle cx="14" cy="14" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <polygon points="14,4 10,16 14,14 18,16" fill="white" opacity="0.9"/>
      </g>
    </svg>`,
  });
}

interface Props {
  vehicles: VehiclePosition[];
}

export default function BusMarkers({ vehicles }: Props) {
  return (
    <>
      {vehicles.map((v) => (
        <Marker
          key={v.vehicleId}
          position={[v.lat, v.lon]}
          icon={createBusIcon(v.bearing, v.speed > 0)}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">🚌 {v.vehicleId}</div>
              <div className="text-gray-500 text-xs">
                Speed: {(v.speed * 3.6).toFixed(1)} km/h
              </div>
              <div className="text-gray-500 text-xs">
                Direction: {v.directionId}
              </div>
              {v.timestamp > 0 && (
                <div className="text-gray-400 text-xs">
                  Updated: {new Date(v.timestamp * 1000).toLocaleTimeString()}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
