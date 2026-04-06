import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import JSZip from "jszip";

const GTFS_URL =
  "https://api.data.gov.my/gtfs-static/prasarana?category=rapid-bus-penang";
const OUTPUT_DIR = path.resolve("public/data");
const ROUTE_DETAILS_DIR = path.join(OUTPUT_DIR, "route-details");

interface Route {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: string;
}

interface Trip {
  route_id: string;
  service_id: string;
  trip_id: string;
  trip_headsign: string;
  direction_id: string;
  shape_id: string;
}

interface Stop {
  stop_id: string;
  stop_code: string;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
}

interface ShapePoint {
  shape_id: string;
  shape_pt_lat: string;
  shape_pt_lon: string;
  shape_pt_sequence: string;
  shape_dist_traveled: string;
}

interface StopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: string;
  stop_headsign: string;
  shape_dist_traveled: string;
}

function roundCoord(v: number): number {
  return Math.round(v * 100000) / 100000;
}

function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

async function main() {
  console.log("Downloading GTFS Static ZIP...");
  const response = await fetch(GTFS_URL, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  console.log(`Downloaded ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB`);

  console.log("Extracting ZIP...");
  const zip = await JSZip.loadAsync(buffer);

  const readCsv = async <T>(filename: string): Promise<T[]> => {
    const file = zip.file(filename);
    if (!file) throw new Error(`${filename} not found in ZIP`);
    const text = await file.async("text");
    return parse(text, { columns: true, skip_empty_lines: true }) as T[];
  };

  const [routesRaw, tripsRaw, stopsRaw, shapesRaw, stopTimesRaw] =
    await Promise.all([
      readCsv<Route>("routes.txt"),
      readCsv<Trip>("trips.txt"),
      readCsv<Stop>("stops.txt"),
      readCsv<ShapePoint>("shapes.txt"),
      readCsv<StopTime>("stop_times.txt"),
    ]);

  console.log(
    `Parsed: ${routesRaw.length} routes, ${tripsRaw.length} trips, ${stopsRaw.length} stops, ${shapesRaw.length} shape points, ${stopTimesRaw.length} stop times`
  );

  // Build lookup maps
  const stopsMap = new Map<string, Stop>();
  for (const s of stopsRaw) {
    stopsMap.set(s.stop_id, s);
  }

  // Group shapes by shape_id
  const shapesMap = new Map<string, ShapePoint[]>();
  for (const sp of shapesRaw) {
    let arr = shapesMap.get(sp.shape_id);
    if (!arr) {
      arr = [];
      shapesMap.set(sp.shape_id, arr);
    }
    arr.push(sp);
  }
  // Sort each shape by sequence
  for (const [, pts] of shapesMap) {
    pts.sort((a, b) => Number(a.shape_pt_sequence) - Number(b.shape_pt_sequence));
  }

  // Group stop_times by trip_id
  const stopTimesMap = new Map<string, StopTime[]>();
  for (const st of stopTimesRaw) {
    let arr = stopTimesMap.get(st.trip_id);
    if (!arr) {
      arr = [];
      stopTimesMap.set(st.trip_id, arr);
    }
    arr.push(st);
  }
  for (const [, sts] of stopTimesMap) {
    sts.sort((a, b) => Number(a.stop_sequence) - Number(b.stop_sequence));
  }

  // Group trips by route_id + direction_id
  const tripsByRouteDir = new Map<string, Trip[]>();
  for (const t of tripsRaw) {
    const key = `${t.route_id}_${t.direction_id}`;
    let arr = tripsByRouteDir.get(key);
    if (!arr) {
      arr = [];
      tripsByRouteDir.set(key, arr);
    }
    arr.push(t);
  }

  // Build output
  const routesSummary: {
    routeId: string;
    shortName: string;
    directions: { directionId: number; headsign: string }[];
  }[] = [];

  // Ensure output dirs exist
  fs.mkdirSync(ROUTE_DETAILS_DIR, { recursive: true });

  for (const route of routesRaw) {
    const directions: { directionId: number; headsign: string }[] = [];

    for (const dirId of [0, 1]) {
      const key = `${route.route_id}_${dirId}`;
      const trips = tripsByRouteDir.get(key);
      if (!trips || trips.length === 0) continue;

      // Pick a representative trip (first one)
      const repTrip = trips[0];
      const headsign = repTrip.trip_headsign || route.route_short_name;

      directions.push({ directionId: dirId, headsign });

      // Get stops for this trip
      const tripStopTimes = stopTimesMap.get(repTrip.trip_id) || [];
      const stops = tripStopTimes.map((st) => {
        const stop = stopsMap.get(st.stop_id);
        return {
          stopId: st.stop_id,
          stopName: stop?.stop_name || "",
          stopCode: stop?.stop_code || "",
          lat: roundCoord(Number(stop?.stop_lat || 0)),
          lon: roundCoord(Number(stop?.stop_lon || 0)),
          sequence: Number(st.stop_sequence),
        };
      });

      // Get shape
      const shapePoints = shapesMap.get(repTrip.shape_id) || [];
      const shape: [number, number][] = shapePoints.map((sp) => [
        roundCoord(Number(sp.shape_pt_lat)),
        roundCoord(Number(sp.shape_pt_lon)),
      ]);

      const routeDetail = {
        routeId: route.route_id,
        shortName: route.route_short_name,
        directionId: dirId,
        headsign,
        stops,
        shape,
      };

      const detailPath = path.join(
        ROUTE_DETAILS_DIR,
        `${route.route_id}_${dirId}.json`
      );
      fs.writeFileSync(detailPath, JSON.stringify(routeDetail));
    }

    if (directions.length > 0) {
      routesSummary.push({
        routeId: route.route_id,
        shortName: route.route_short_name,
        directions,
      });
    }
  }

  // Sort routes by shortName naturally
  routesSummary.sort((a, b) => naturalSort(a.shortName, b.shortName));

  const routesPath = path.join(OUTPUT_DIR, "routes.json");
  fs.writeFileSync(routesPath, JSON.stringify(routesSummary));

  console.log(
    `Done! Generated ${routesSummary.length} routes, wrote to ${OUTPUT_DIR}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
