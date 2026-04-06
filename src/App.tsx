import { useState, useCallback } from "react";
import SearchPanel from "./components/SearchPanel";
import MapView from "./components/MapView";
import InfoPanel from "./components/InfoPanel";
import { useRoutes } from "./hooks/useRoutes";
import { useRouteDetail } from "./hooks/useRouteDetail";
import { useVehiclePositions } from "./hooks/useVehiclePositions";
import type { RouteSummary } from "./types";

export default function App() {
  const { routes, loading } = useRoutes();
  const [selectedRoute, setSelectedRoute] = useState<RouteSummary | null>(null);
  const [directionId, setDirectionId] = useState(0);
  const [flyToTarget, setFlyToTarget] = useState<[number, number] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { detail } = useRouteDetail(
    selectedRoute?.routeId ?? null,
    directionId
  );
  const { vehicles, lastUpdate, error, countdown } = useVehiclePositions(
    selectedRoute?.shortName ?? null
  );

  const handleSelectRoute = useCallback((route: RouteSummary | null) => {
    setSelectedRoute(route);
    setDirectionId(route?.directions[0]?.directionId ?? 0);
    setDrawerOpen(!!route);
    setFlyToTarget(null);
  }, []);

  const handleStopClick = useCallback((lat: number, lon: number) => {
    setFlyToTarget([lat, lon]);
  }, []);

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
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
        <div className="md:hidden absolute top-0 left-0 right-0 z-[1000] p-3 bg-white/90 backdrop-blur-sm">
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
            className={`md:hidden absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-2xl shadow-lg transition-transform ${
              drawerOpen ? "max-h-[60vh]" : "max-h-16"
            } overflow-hidden`}
          >
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="w-full flex items-center justify-center py-2"
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </button>
            <div className="px-4 pb-4 overflow-y-auto max-h-[calc(60vh-2rem)]">
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
          </div>
        )}
      </div>
    </div>
  );
}
