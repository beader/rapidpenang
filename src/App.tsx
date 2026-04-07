import { useState, useCallback, useRef, useMemo } from "react";
import SearchPanel from "./components/SearchPanel";
import MapView from "./components/MapView";
import InfoPanel from "./components/InfoPanel";
import { useRoutes } from "./hooks/useRoutes";
import { useRouteDetail } from "./hooks/useRouteDetail";
import { useVehiclePositions } from "./hooks/useVehiclePositions";
import type { RouteSummary } from "./types";

type DrawerState = "collapsed" | "peek" | "full";

export default function App() {
  const { routes, loading } = useRoutes();
  const [selectedRoute, setSelectedRoute] = useState<RouteSummary | null>(null);
  const [directionId, setDirectionId] = useState(0);
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null);
  const [drawer, setDrawer] = useState<DrawerState>("collapsed");

  // Drag state for mobile drawer
  const dragRef = useRef({ startY: 0, startHeight: 0, dragging: false });
  const drawerRef = useRef<HTMLDivElement>(null);

  const { detail } = useRouteDetail(
    selectedRoute?.routeId ?? null,
    directionId
  );
  const { vehicles: routeVehicles, lastUpdate, error, countdown } =
    useVehiclePositions(selectedRoute?.shortName ?? null);

  // Filter vehicles by direction using trip_id mapping from static data.
  // Feed's direction_id is unreliable for Rapid Penang, so we look up trip_id
  // against the preprocessed direction/opposite-direction trip sets.
  const vehicles = useMemo(() => {
    if (!detail) return routeVehicles;
    const currentSet = new Set(detail.tripIds);
    const oppositeSet = new Set(detail.oppositeTripIds);
    return routeVehicles.filter((v) => {
      if (currentSet.has(v.tripId)) return true;
      if (oppositeSet.has(v.tripId)) return false;
      // Unmatched trip_id (~33% of RT data) → show in both directions as best effort
      return true;
    });
  }, [routeVehicles, detail]);

  const handleSelectRoute = useCallback((route: RouteSummary | null) => {
    setSelectedRoute(route);
    setDirectionId(route?.directions[0]?.directionId ?? 0);
    setDrawer(route ? "peek" : "collapsed");
    setFlyToTarget(null);
  }, []);

  const handleStopClick = useCallback((lat: number, lon: number) => {
    setFlyToTarget([lat, lon]);
    setDrawer("peek");
  }, []);

  const cycleDrawer = useCallback(() => {
    setDrawer((prev) => {
      if (prev === "collapsed") return "peek";
      if (prev === "peek") return "full";
      return "peek";
    });
  }, []);

  // Touch handlers for drawer drag
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragRef.current.startY = e.touches[0].clientY;
    dragRef.current.startHeight = drawerRef.current?.offsetHeight ?? 0;
    dragRef.current.dragging = true;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    const dy = dragRef.current.startY - e.changedTouches[0].clientY;
    // Swipe up → expand, swipe down → collapse
    if (dy > 40) {
      setDrawer((prev) => (prev === "collapsed" ? "peek" : "full"));
    } else if (dy < -40) {
      setDrawer((prev) => (prev === "full" ? "peek" : "collapsed"));
    }
  }, []);

  const drawerHeight =
    drawer === "full" ? "60vh" : drawer === "peek" ? "140px" : "0px";

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-80 flex-shrink-0 bg-white border-r border-gray-200 p-4 gap-4 overflow-hidden">
        <h1 className="text-lg font-bold text-gray-800">
          Penang Bus Tracker
        </h1>
        <SearchPanel
          routes={routes}
          onSelect={handleSelectRoute}
          selectedRoute={selectedRoute}
        />
        {selectedRoute && (
          <div className="flex-1 overflow-y-auto">
            <InfoPanel
              route={selectedRoute}
              detail={detail}
              directionId={directionId}
              onDirectionChange={setDirectionId}
              vehicles={vehicles}
              lastUpdate={lastUpdate}
              countdown={countdown}
              error={error}
              onStopClick={handleStopClick}
            />
          </div>
        )}
        {loading && (
          <p className="text-sm text-gray-400">Loading routes...</p>
        )}
      </div>

      {/* Map area */}
      <div className="flex-1 relative">
        {/* Mobile search bar */}
        <div className="md:hidden absolute top-0 left-0 right-0 z-[1000] p-2">
          <SearchPanel
            routes={routes}
            onSelect={handleSelectRoute}
            selectedRoute={selectedRoute}
          />
        </div>

        <MapView
          detail={detail}
          vehicles={vehicles}
          flyToTarget={flyToTarget}
        />

        {/* Mobile bottom drawer */}
        {selectedRoute && (
          <div
            ref={drawerRef}
            className="md:hidden absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-2xl transition-all duration-300 ease-out"
            style={{
              height: drawerHeight,
              boxShadow: "0 -2px 20px rgba(0,0,0,0.15)",
            }}
          >
            {/* Drag handle */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={cycleDrawer}
              className="flex flex-col items-center pt-2 pb-1 cursor-pointer select-none"
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full mb-2" />
              {/* Peek summary: always visible when drawer has height */}
              <div className="w-full px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-blue-700">
                    {selectedRoute.shortName}
                  </span>
                  <span className="text-xs text-gray-500 truncate max-w-[140px]">
                    {detail?.headsign}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>
                    <strong className="text-gray-700">{vehicles.length}</strong> online
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectRoute(null);
                    }}
                    className="ml-1 text-gray-400 active:text-gray-600 p-1"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable content (only visible in full mode) */}
            <div
              className="px-4 pb-4 overflow-y-auto"
              style={{ height: "calc(100% - 64px)" }}
            >
              <InfoPanel
                route={selectedRoute}
                detail={detail}
                directionId={directionId}
                onDirectionChange={setDirectionId}
                vehicles={vehicles}
                lastUpdate={lastUpdate}
                countdown={countdown}
                error={error}
                onStopClick={handleStopClick}
                compact
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
