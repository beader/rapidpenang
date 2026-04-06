import protobuf from "protobufjs";
import protoJson from "../proto/gtfs-realtime.json";
import type { VehiclePosition } from "../types";

const GTFS_RT_URL =
  "https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana?category=rapid-bus-penang";

let FeedMessage: protobuf.Type | null = null;

function getFeedMessage(): protobuf.Type {
  if (!FeedMessage) {
    const root = protobuf.Root.fromJSON(protoJson);
    FeedMessage = root.lookupType("transit_realtime.FeedMessage");
  }
  return FeedMessage;
}

export async function fetchVehiclePositions(): Promise<VehiclePosition[]> {
  const response = await fetch(GTFS_RT_URL);
  if (!response.ok) {
    throw new Error(`GTFS-RT fetch failed: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const feedMsg = getFeedMessage();
  const feed = feedMsg.decode(new Uint8Array(buffer)) as unknown as {
    entity: {
      id: string;
      vehicle: {
        trip: {
          routeId: string;
          tripId: string;
          directionId: number;
        };
        vehicle: {
          id: string;
          licensePlate: string;
        };
        position: {
          latitude: number;
          longitude: number;
          bearing: number;
          speed: number;
        };
        timestamp: number | { low: number; high: number };
      };
    }[];
  };

  return feed.entity
    .filter((e) => e.vehicle?.position)
    .map((e) => {
      const v = e.vehicle;
      const ts = v.timestamp;
      return {
        vehicleId: v.vehicle?.id || e.id,
        routeShortName: v.trip?.routeId || "",
        tripId: v.trip?.tripId || "",
        directionId: v.trip?.directionId || 0,
        lat: v.position.latitude,
        lon: v.position.longitude,
        bearing: v.position.bearing || 0,
        speed: v.position.speed || 0,
        timestamp:
          typeof ts === "object" && ts !== null ? (ts as { low: number }).low : (ts as number) || 0,
      };
    });
}
