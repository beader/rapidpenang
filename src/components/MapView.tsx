import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { RouteDetail, VehiclePosition } from "../types";
import RouteLayer from "./RouteLayer";
import BusMarkers from "./BusMarkers";
import { useEffect } from "react";
import L from "leaflet";

const PENANG_CENTER: [number, number] = [5.37, 100.37];
const DEFAULT_ZOOM = 12;

function FitBounds({ detail }: { detail: RouteDetail | null }) {
  const map = useMap();

  useEffect(() => {
    if (!detail || detail.shape.length === 0) return;
    const bounds = L.latLngBounds(
      detail.shape.map(([lat, lon]) => [lat, lon] as [number, number])
    );
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [detail, map]);

  return null;
}

interface FlyToProps {
  target: [number, number] | null;
}

function FlyTo({ target }: FlyToProps) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 16, { duration: 0.5 });
    }
  }, [target, map]);
  return null;
}

interface Props {
  detail: RouteDetail | null;
  vehicles: VehiclePosition[];
  flyToTarget: [number, number] | null;
}

export default function MapView({ detail, vehicles, flyToTarget }: Props) {
  return (
    <MapContainer
      center={PENANG_CENTER}
      zoom={DEFAULT_ZOOM}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds detail={detail} />
      <FlyTo target={flyToTarget} />
      {detail && <RouteLayer detail={detail} />}
      <BusMarkers vehicles={vehicles} />
    </MapContainer>
  );
}
