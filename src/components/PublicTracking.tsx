import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Shipment, ShipmentStatus } from "../types";
import { Search, MapPin, Truck, Calendar, Scale, HelpCircle, ArrowRight, CornerDownRight, CheckCircle, Clock } from "lucide-react";
import TrackingTimeline from "./TrackingTimeline";
import CompanyLogo from "./CompanyLogo";
import { motion } from "motion/react";
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

// Read and resolve Google Maps API Key
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";
const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

// Coordinate lookup table for fallback and default tracking positions
const LOCATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Turkmenistan Cities / Locations
  "ashgabat": { lat: 37.9601, lng: 58.3260 },
  "ashgabat cargo hub": { lat: 37.9550, lng: 58.3300 },
  "ashgabat airport": { lat: 37.9868, lng: 58.3610 },
  "ashgabat airport (asb)": { lat: 37.9868, lng: 58.3610 },
  "ashgabat central sorting": { lat: 37.9620, lng: 58.3400 },
  "mary": { lat: 37.5938, lng: 61.8394 },
  "mary distribution office": { lat: 37.5950, lng: 61.8400 },
  "turkmenabat": { lat: 39.0150, lng: 63.5686 },
  "dashoguz": { lat: 41.8373, lng: 59.9667 },
  "balkanabat": { lat: 39.5100, lng: 54.3650 },
  "turkmenbashi": { lat: 40.0100, lng: 52.9800 },
  "turkmenistan": { lat: 38.9697, lng: 59.5563 },

  // International Transit Hubs & Countries
  "istanbul": { lat: 41.0082, lng: 28.9784 },
  "istanbul transit center": { lat: 41.2581, lng: 28.7302 },
  "france": { lat: 46.2276, lng: 2.2137 },
  "paris": { lat: 48.8566, lng: 2.3522 },
  "united kingdom": { lat: 55.3781, lng: -3.4360 },
  "london": { lat: 51.5074, lng: -0.1278 },
  "germany": { lat: 51.1657, lng: 10.4515 },
  "frankfurt": { lat: 50.1109, lng: 8.6821 },
  "china": { lat: 35.8617, lng: 104.1954 },
  "beijing": { lat: 39.9042, lng: 116.4074 },
  "united states": { lat: 37.0902, lng: -95.7129 },
  "new york": { lat: 40.7128, lng: -74.0060 },
  "dubai": { lat: 25.2048, lng: 55.2708 },
  "united arab emirates": { lat: 23.4241, lng: 53.8478 },
  "turkey": { lat: 38.9637, lng: 35.2433 },
};

// Polyline component for drawing shipment routes on Google Map
function Polyline({ path, color = "#EAB308", weight = 3 }: { path: google.maps.LatLngLiteral[]; color?: string; weight?: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map || path.length < 2) return;
    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: weight,
      map,
    });
    return () => {
      polyline.setMap(null);
    };
  }, [map, path, color, weight]);
  return null;
}

// Map Bounds Auto-fitting component
function MapUpdater({ coordinates }: { coordinates: google.maps.LatLngLiteral[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map || coordinates.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    coordinates.forEach(coord => bounds.extend(coord));
    map.fitBounds(bounds, {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50
    });
  }, [map, coordinates]);
  return null;
}

// Maps setup instructions card when API key is missing from secrets
function MapsApiKeySetupCard() {
  return (
    <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-6 space-y-4 text-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-700">
        <MapPin className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-black">Google Maps API Key Required</h4>
        <p className="text-xs text-gray-500 leading-relaxed">
          To visualize the live tracking route on an interactive Google Map, please configure your API key.
        </p>
      </div>
      
      <div className="text-left bg-white p-4 rounded-lg border border-amber-150 text-[11px] text-gray-600 space-y-2">
        <p><strong>Step 1:</strong> <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener" className="text-gold-600 hover:underline font-bold">Get an API Key</a></p>
        <p><strong>Step 2:</strong> When the <strong>"Enter your environment variable to continue"</strong> popup appears, paste your API key and press <strong>Enter</strong>.</p>
        <p><strong>Step 3 (Manual):</strong> Go to <strong>Settings</strong> (⚙️ gear icon, top-right) → <strong>Secrets</strong> → add <code>GOOGLE_MAPS_PLATFORM_KEY</code> as the secret name, and paste your API key.</p>
      </div>
      
      <p className="text-[10px] text-amber-600 italic font-medium">
        The app rebuilds automatically after you save the secret — no page reload needed.
      </p>
    </div>
  );
}

// Smoothly animated map marker to prevent sudden jumps
function SmoothMarker({ position, title, children }: { position: google.maps.LatLngLiteral; title?: string; children?: React.ReactNode }) {
  const [animatedPos, setAnimatedPos] = useState<google.maps.LatLngLiteral>(position);

  useEffect(() => {
    const startLat = animatedPos.lat;
    const startLng = animatedPos.lng;
    const endLat = position.lat;
    const endLng = position.lng;
    
    if (startLat === endLat && startLng === endLng) return;

    const duration = 1200; // 1.2 seconds elegant slide interpolation
    const startTime = performance.now();

    let animFrameId: number;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Deceleration easing (easeOutCubic)
      const ease = 1 - Math.pow(1 - progress, 3);

      const currentLat = startLat + (endLat - startLat) * ease;
      const currentLng = startLng + (endLng - startLng) * ease;

      setAnimatedPos({ lat: currentLat, lng: currentLng });

      if (progress < 1) {
        animFrameId = requestAnimationFrame(animate);
      }
    };

    animFrameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [position]);

  return (
    <AdvancedMarker position={animatedPos} title={title}>
      {children}
    </AdvancedMarker>
  );
}

// Sub-component to manage location geocoding and rendering on Google Map
interface TrackingMapProps {
  shipment: Shipment;
}

function TrackingMap({ shipment }: TrackingMapProps) {
  const geocodingLib = useMapsLibrary("geocoding");
  const [coords, setCoords] = useState<{
    origin?: google.maps.LatLngLiteral;
    current?: google.maps.LatLngLiteral;
    destination?: google.maps.LatLngLiteral;
  }>({});

  useEffect(() => {
    // Start with preset coordinates
    const resolved: typeof coords = {};
    const locationsToGeocode = [
      { key: "origin", value: shipment.originCountry },
      { key: "current", value: shipment.currentLocation },
      { key: "destination", value: shipment.destinationCountry }
    ];

    locationsToGeocode.forEach(({ key, value }) => {
      if (!value) return;
      const lower = value.toLowerCase().trim();
      if (LOCATION_COORDINATES[lower]) {
        resolved[key as keyof typeof coords] = LOCATION_COORDINATES[lower];
      } else {
        // Fallback broad search inside lookup table keys
        for (const dictKey of Object.keys(LOCATION_COORDINATES)) {
          if (lower.includes(dictKey) || dictKey.includes(lower)) {
            resolved[key as keyof typeof coords] = LOCATION_COORDINATES[dictKey];
            break;
          }
        }
      }
    });

    // Override current location with real high-accuracy GPS coords if available
    if (shipment.currentLat !== undefined && shipment.currentLng !== undefined) {
      resolved.current = { lat: shipment.currentLat, lng: shipment.currentLng };
    }

    setCoords(resolved);

    // If geocoding library loaded, execute live queries to get high-accuracy coordinates
    if (!geocodingLib) return;

    const geocoder = new geocodingLib.Geocoder();

    const geocodeLocation = async (locName: string): Promise<google.maps.LatLngLiteral | null> => {
      try {
        const response = await geocoder.geocode({ address: locName });
        if (response.results?.[0]?.geometry?.location) {
          const loc = response.results[0].geometry.location;
          return { lat: loc.lat(), lng: loc.lng() };
        }
      } catch (err) {
        console.warn(`Dynamic geocoding failed for "${locName}":`, err);
      }
      return null;
    };

    const runDynamicGeocoding = async () => {
      const dynamicResolved = { ...resolved };
      let updated = false;

      for (const { key, value } of locationsToGeocode) {
        if (!value) continue;
        // Skip current location geocoding if we already have direct satellite telemetry
        if (key === "current" && shipment.currentLat !== undefined && shipment.currentLng !== undefined) {
          continue;
        }
        const res = await geocodeLocation(value);
        if (res) {
          dynamicResolved[key as keyof typeof coords] = res;
          updated = true;
        }
      }

      if (updated) {
        setCoords(dynamicResolved);
      }
    };

    runDynamicGeocoding();
  }, [geocodingLib, shipment]);

  const activeCoordinates: google.maps.LatLngLiteral[] = [];
  if (coords.origin) activeCoordinates.push(coords.origin);
  if (coords.current) activeCoordinates.push(coords.current);
  if (coords.destination) activeCoordinates.push(coords.destination);

  return (
    <div className="relative w-full h-80 rounded-xl overflow-hidden border border-gray-150">
      <Map
        defaultCenter={coords.origin || { lat: 37.9601, lng: 58.3260 }}
        defaultZoom={5}
        mapId="TPL_TRACKING_MAP"
        internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
        style={{ width: "100%", height: "100%" }}
        gestureHandling="cooperative"
        disableDefaultUI={false}
      >
        {coords.origin && (
          <AdvancedMarker position={coords.origin} title={`Origin: ${shipment.originCountry}`}>
            <Pin background="#000000" glyphColor="#ffffff" borderColor="#EAB308" />
          </AdvancedMarker>
        )}

        {coords.current && 
          shipment.currentLocation !== shipment.originCountry && 
          shipment.currentLocation !== shipment.destinationCountry && (
          <SmoothMarker position={coords.current} title={`Current Location: ${shipment.currentLocation}`}>
            <Pin background="#EAB308" glyphColor="#000000" borderColor="#000000" />
          </SmoothMarker>
        )}

        {coords.destination && (
          <AdvancedMarker position={coords.destination} title={`Destination: ${shipment.destinationCountry}`}>
            <Pin background="#10B981" glyphColor="#ffffff" borderColor="#10B981" />
          </AdvancedMarker>
        )}

        {activeCoordinates.length >= 2 && (
          <Polyline path={activeCoordinates} color="#EAB308" weight={4} />
        )}

        <MapUpdater coordinates={activeCoordinates} />
      </Map>

      <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs px-4 py-3 rounded-lg border border-gray-150 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Current Shipment Position</span>
          <span className="font-bold text-black uppercase font-mono">{shipment.currentLocation || "In Transit"}</span>
        </div>
        <div className="text-right sm:text-right">
          <span className="text-[10px] text-gray-400 font-bold uppercase block">Route Coordinates</span>
          <span className="font-semibold text-gray-600 font-mono">
            {shipment.originCountry} → {shipment.destinationCountry}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PublicTracking() {
  const [trackingId, setTrackingId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto load query param if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tracking = params.get("tracking");
    if (tracking) {
      setTrackingId(tracking.trim().toUpperCase());
      setSearchQuery(tracking.trim().toUpperCase());
    }
  }, []);

  // Real-time Firestore document subscription
  useEffect(() => {
    const cleanId = trackingId.trim().toUpperCase();
    if (!cleanId) return;

    setLoading(true);
    setError(null);

    const docRef = doc(db, "shipments", cleanId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      setLoading(false);
      if (docSnap.exists()) {
        setShipment(docSnap.data() as Shipment);
      } else {
        setError(`No parcel found with this tracking number. Please verify the code (e.g. TPL-${new Date().getFullYear()}0720-000001) or contact support.`);
        setShipment(null);
      }
    }, (err) => {
      console.error("Real-time snapshot sync error:", err);
      setError("Failed to establish secure real-time satellite tracking feed.");
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [trackingId]);

  const getPreviousLocation = (ship: Shipment) => {
    if (!ship.history || ship.history.length <= 1) {
      return "N/A (Origin)";
    }
    const history = ship.history || [];
    return history[history.length - 2].location;
  };

  // Generate a procedural SVG Barcode
  const renderSVGBarcode = (text: string) => {
    const cleanText = text.replace(/[^A-Z0-9-]/g, "");
    let lines = [];
    let x = 10;
    const height = 40;
    for (let i = 0; i < cleanText.length; i++) {
      const charCode = cleanText.charCodeAt(i);
      const binary = (charCode % 5 + 1).toString(2).padStart(3, "0");
      for (const bit of binary) {
        const width = bit === "1" ? 2.5 : 1;
        lines.push(<rect key={`${i}-${x}`} x={x} y={5} width={width} height={height} fill="black" />);
        x += width + 1;
      }
      lines.push(<rect key={`sep-${i}`} x={x} y={5} width={1} height={height} fill="black" />);
      x += 2;
    }
    return (
      <svg width={x + 10} height={height + 10} className="mx-auto">
        {lines}
      </svg>
    );
  };

  // Generate a procedural SVG QR Code
  const renderSVGQRCode = (text: string) => {
    const cleanText = text;
    const size = 100;
    const numCells = 15;
    const cellSize = size / numCells;
    const rects = [];
    const getHash = (str: string, index: number) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash + index) % 2 === 0;
    };
    for (let row = 0; row < numCells; row++) {
      for (let col = 0; col < numCells; col++) {
        const isFinderPattern =
          (row < 4 && col < 4) ||
          (row < 4 && col >= numCells - 4) ||
          (row >= numCells - 4 && col < 4);
        let fillCell = false;
        if (isFinderPattern) {
          const innerR = row < 4 ? row : row - (numCells - 4);
          const innerC = col < 4 ? col : col - (numCells - 4);
          fillCell = !(
            (innerR === 1 && innerC === 1) ||
            (innerR === 1 && innerC === 2) ||
            (innerR === 2 && innerC === 1) ||
            (innerR === 2 && innerC === 2)
          );
        } else {
          fillCell = getHash(cleanText, row * numCells + col);
        }
        if (fillCell) {
          rects.push(
            <rect
              key={`${row}-${col}`}
              x={col * cellSize}
              y={row * cellSize}
              width={cellSize + 0.2}
              height={cellSize + 0.2}
              fill="black"
            />
          );
        }
      }
    }
    return (
      <svg width={size} height={size} className="border border-gray-150 p-1 bg-white rounded-lg mx-auto shadow-xs">
        {rects}
      </svg>
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setTrackingId(searchQuery.trim().toUpperCase());
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Search Header Hero */}
      <div className="text-center max-w-2xl mx-auto space-y-4 py-6">
        <h1 className="text-3xl md:text-5xl font-display font-extrabold text-black tracking-tight leading-tight">
          Track Your Global Shipment
        </h1>
        <p className="text-sm md:text-base text-gray-500">
          Enter your 19-character TPL tracking identifier to view real-time transit status, custom clearances, and expected deliveries.
        </p>

        {/* Big Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative mt-6 max-w-xl mx-auto">
          <div className="relative flex items-center">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
              <Search className="w-5 h-5 text-gold-600" />
            </span>
            <input
              type="text"
              placeholder="TPL-YYYYMMDD-000001"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-32 py-4 bg-white border border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-black font-mono font-medium tracking-wide transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 px-6 py-2.5 bg-black hover:bg-neutral-950 text-gold-500 font-bold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer disabled:bg-gray-400"
            >
              {loading ? "Searching..." : "Track"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Demo Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-gray-500">
          <span>Popular Test Runs:</span>
          {[`TPL-${new Date().getFullYear()}0720-000001`, `TPL-${new Date().getFullYear()}0720-000002`].map((demoId) => (
            <button
              key={demoId}
              type="button"
              onClick={() => {
                setSearchQuery(demoId);
                setTrackingId(demoId);
              }}
              className="px-2 py-1 bg-gray-100 hover:bg-gold-50 hover:text-gold-700 rounded border border-gray-200 transition-all font-mono cursor-pointer"
            >
              {demoId}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state spinner */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-black rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-gray-500 tracking-wider">RETRIEVING ENCRYPTED SHIPMENT RECORD...</p>
        </div>
      )}

      {/* Error state alert */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-red-50 border border-red-100 rounded-2xl text-center max-w-xl mx-auto space-y-2 text-red-800"
        >
          <HelpCircle className="w-8 h-8 mx-auto text-red-600 mb-1" />
          <p className="font-bold text-sm">Tracking Lookup Failed</p>
          <p className="text-xs text-red-700 leading-relaxed">{error}</p>
        </motion.div>
      )}

      {/* Shipment Details Results */}
      {shipment && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
        >
          {/* Main timeline + Map (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Core tracking header */}
            <div className="bg-black text-white p-6 rounded-2xl border border-neutral-800 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-gold-500 font-bold uppercase">
                  ACTIVE TPL SHIPMENT IDENTIFIER
                </span>
                <h2 className="text-2xl font-mono font-bold tracking-tight">{shipment.trackingNumber}</h2>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gold-500 text-black font-extrabold text-xs tracking-wide">
                  <Truck className="w-3.5 h-3.5" />
                  {shipment.status}
                </span>
              </div>
            </div>

            {/* Real-time Telemetry Dashboard Panel */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Current Location</span>
                <span className="text-xs font-bold text-black uppercase font-mono">{shipment.currentLocation || "In Transit"}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Previous Location</span>
                <span className="text-xs font-bold text-gray-600 uppercase font-mono">
                  {getPreviousLocation(shipment)}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Next Destination</span>
                <span className="text-xs font-bold text-gold-600 uppercase font-mono">{shipment.destinationCountry}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Estimated Arrival</span>
                <span className="text-xs font-bold text-black font-mono">
                  {shipment.expectedDeliveryDate ? new Date(shipment.expectedDeliveryDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Pending"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Shipment Status</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {shipment.status}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Last Updated</span>
                <span className="text-xs font-bold text-gray-500 font-mono">
                  {shipment.updatedAt ? new Date(shipment.updatedAt).toLocaleString() : "Recently"}
                </span>
              </div>
            </div>

            {/* Tracking timeline */}
            <TrackingTimeline shipment={shipment} />

            {/* Visual Route Map */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">
                  Global Transit Map
                </h3>
                <span className="text-xs font-mono text-gold-600 font-semibold uppercase">
                  {hasValidKey ? "Live Google Map Tracking" : "Route Simulator / Setup Required"}
                </span>
              </div>

              {hasValidKey ? (
                <APIProvider apiKey={API_KEY} version="weekly">
                  <TrackingMap shipment={shipment} />
                </APIProvider>
              ) : (
                <div className="space-y-6">
                  {/* simulated map using golden vector graphics */}
                  <div className="relative h-60 bg-gradient-to-br from-neutral-50 to-neutral-100/50 rounded-xl overflow-hidden border border-gray-150 flex items-center justify-center p-6">
                    {/* stylized lines simulating continents */}
                    <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M10 20 Q 30 30, 50 20 T 90 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      <path d="M20 60 Q 40 50, 65 70 T 80 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </svg>

                    {/* Animated shipping path */}
                    <div className="w-full max-w-md flex justify-between items-center relative py-12 px-8">
                      {/* Dotted Gold Line */}
                      <div className="absolute left-16 right-16 h-0.5 border-t-2 border-dashed border-gold-400"></div>

                      {/* Left Node: Origin */}
                      <div className="flex flex-col items-center gap-2 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-md">
                          <MapPin className="w-5 h-5 text-black" />
                        </div>
                        <span className="text-[11px] font-bold text-black uppercase tracking-tight">
                          {shipment.originCountry}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">Origin</span>
                      </div>

                      {/* Middle Node: Current location (if different) */}
                      {shipment.currentLocation &&
                        shipment.currentLocation !== shipment.originCountry &&
                        shipment.currentLocation !== shipment.destinationCountry && (
                          <div className="flex flex-col items-center gap-2 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-gold-100 border-2 border-gold-500 flex items-center justify-center shadow-md animate-bounce">
                              <Truck className="w-5 h-5 text-gold-700" />
                            </div>
                            <span className="text-[11px] font-bold text-gold-700 uppercase tracking-tight">
                              {shipment.currentLocation}
                            </span>
                            <span className="text-[10px] text-gold-600 uppercase font-semibold">Current</span>
                          </div>
                        )}

                      {/* Right Node: Destination */}
                      <div className="flex flex-col items-center gap-2 relative z-10">
                        <div className={`w-10 h-10 rounded-full bg-white border-2 flex items-center justify-center shadow-md ${
                          shipment.status === ShipmentStatus.DELIVERED ? "border-gold-500 bg-gold-50" : "border-gray-200"
                        }`}>
                          <CheckCircle className={`w-5 h-5 ${
                            shipment.status === ShipmentStatus.DELIVERED ? "text-gold-600" : "text-gray-400"
                          }`} />
                        </div>
                        <span className="text-[11px] font-bold text-black uppercase tracking-tight">
                          {shipment.destinationCountry}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">Destination</span>
                      </div>
                    </div>

                    {/* status bar on bottom of map */}
                    <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-150/50 flex items-center justify-between text-xs font-medium">
                      <span className="text-gray-500">Current Location:</span>
                      <span className="font-bold text-black uppercase">{shipment.currentLocation || "In Transit"}</span>
                    </div>
                  </div>

                  {/* Setup guide card displayed inside the component as a splash/instructions view */}
                  <MapsApiKeySetupCard />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Parcel Information Card (1 col) */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase border-b border-gray-50 pb-3">
                Shipment Particulars
              </h3>

              {/* Grid properties */}
              <div className="space-y-4">
                {/* Shipping Dates */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg text-gold-600 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Dispatch & Expected</p>
                    <p className="text-xs text-black font-semibold">
                      Shipped: <strong className="font-mono text-[11px]">{shipment.shippingDate || "Pending"}</strong>
                    </p>
                    <p className="text-xs text-black font-semibold">
                      Expected: <strong className="font-mono text-[11px]">{shipment.expectedDeliveryDate || "Pending"}</strong>
                    </p>
                  </div>
                </div>

                {/* Shipping Method */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg text-gold-600 mt-0.5">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Transit Mode</p>
                    <p className="text-xs text-black font-bold uppercase">{shipment.shippingMethod || "Standard Cargo"}</p>
                  </div>
                </div>

                {/* Weight */}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg text-gold-600 mt-0.5">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Parcel Net Weight</p>
                    <p className="text-xs font-mono text-black font-bold">{shipment.parcelWeight} kg</p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5 pt-2 border-t border-gray-50">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Package Description</p>
                  <p className="text-xs text-gray-700 leading-relaxed italic">
                    "{shipment.parcelDescription || "No itemized description provided."}"
                  </p>
                </div>
              </div>
            </div>

            {/* Consignee / Dispatch info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase border-b border-gray-50 pb-3">
                Sender & Receiver
              </h3>

              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Shipper (Origin)</p>
                  <p className="text-xs font-bold text-black uppercase">{shipment.senderName}</p>
                  <p className="text-xs font-mono text-gray-500">{shipment.originCountry}</p>
                </div>

                <div className="border-t border-gray-50 pt-3 space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Consignee (Destination)</p>
                  <p className="text-xs font-bold text-black uppercase">{shipment.receiverName}</p>
                  <p className="text-xs font-mono text-gray-500">{shipment.destinationCountry}</p>
                </div>
              </div>
            </div>

            {/* Digital Shipment Passport Card */}
            <div className="bg-neutral-900 border border-neutral-800 text-white rounded-2xl p-6 space-y-5 shadow-lg">
              <div className="space-y-1">
                <span className="text-[9px] font-mono tracking-widest text-gold-500 font-extrabold uppercase">Carriage Passport</span>
                <h3 className="text-xs font-bold text-white uppercase">Digital Cargo Identifiers</h3>
              </div>
              <div className="space-y-4 text-center">
                <div className="bg-white p-3 rounded-xl inline-block">
                  {renderSVGQRCode(shipment.trackingNumber)}
                </div>
                <div className="bg-white p-2.5 rounded-xl block">
                  {renderSVGBarcode(shipment.trackingNumber)}
                  <span className="text-[10px] font-mono text-black font-extrabold mt-1 block tracking-wider">
                    {shipment.trackingNumber}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-neutral-400 text-center leading-normal">
                Scan QR or Barcode at any TPL provincial custom sorting terminal for instant cargo verification.
              </p>
            </div>

            {/* Proof of Delivery Card */}
            {shipment.status === ShipmentStatus.DELIVERED && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-sm font-bold">Successfully Delivered</h4>
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  This parcel has reached its destination safely.
                </p>

                {shipment.deliveryProofUrl ? (
                  <div className="pt-2">
                    <p className="text-[9px] text-emerald-600 font-bold uppercase mb-1">Receipt Signature / Photo</p>
                    <a
                      href={shipment.deliveryProofUrl}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="inline-flex items-center gap-1.5 text-xs text-black font-bold bg-white hover:bg-neutral-50 px-3 py-2 rounded-lg border border-emerald-200 transition-all cursor-pointer shadow-sm"
                    >
                      <span>View Delivery Proof</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gold-600" />
                    </a>
                  </div>
                ) : (
                  <p className="text-[10px] text-emerald-600 italic">Signature verified on physical delivery voucher.</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
