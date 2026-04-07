export interface RouteSummary {
  routeId: string;
  shortName: string;
  directions: {
    directionId: number;
    headsign: string;
  }[];
}

export interface RouteDetail {
  routeId: string;
  shortName: string;
  directionId: number;
  headsign: string;
  stops: {
    stopId: string;
    stopName: string;
    stopCode: string;
    lat: number;
    lon: number;
    sequence: number;
  }[];
  shape: [number, number][];
  tripIds: string[];
  oppositeTripIds: string[];
  firstDeparture: string | null;
  lastDeparture: string | null;
  tripCount: number;
}

export interface VehiclePosition {
  vehicleId: string;
  routeShortName: string;
  tripId: string;
  directionId: number;
  lat: number;
  lon: number;
  bearing: number;
  speed: number;
  timestamp: number;
}
