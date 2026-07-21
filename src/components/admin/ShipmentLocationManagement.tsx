import React, { useState, useEffect } from "react";
import { Shipment, ShipmentStatus, ShipmentHistory } from "../../types";
import { db } from "../../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { 
  MapPin, Truck, Calendar, History, ArrowRight, CornerDownRight, 
  CheckCircle, Plus, Search, HelpCircle, Activity, Shield, Navigation,
  Globe, AlertTriangle, Compass, RefreshCw
} from "lucide-react";
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

// Read and resolve Google Maps API Key
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";
const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

const LOCATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Ashgabat Airport": { lat: 37.9868, lng: 58.3610 },
  "Ashgabat Cargo Hub": { lat: 37.9550, lng: 58.3300 },
  "Ashgabat Central Sorting": { lat: 37.9620, lng: 58.3400 },
  "Balkanabat Terminal": { lat: 39.5100, lng: 54.3650 },
  "Turkmenbashi Customs": { lat: 40.0100, lng: 52.9800 },
  "Mary Branch Office": { lat: 37.5950, lng: 61.8400 },
  "Turkmenabat Station": { lat: 39.0150, lng: 63.5686 },
  "Dashoguz Depot": { lat: 41.8373, lng: 59.9667 },
  "Istanbul Hub": { lat: 41.2581, lng: 28.7302 },
  "Paris Air Sorting": { lat: 48.8566, lng: 2.3522 },
  "London Heathrow Cargo": { lat: 51.5074, lng: -0.1278 },
  "Frankfurt Freight Terminal": { lat: 50.1109, lng: 8.6821 },
  "Beijing Air Terminal": { lat: 39.9042, lng: 116.4074 },
  "Dubai DWC Cargo Terminal": { lat: 25.2048, lng: 55.2708 },
};

// Map Auto-center Component
function MapCenterer({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.panTo({ lat, lng });
    }
  }, [map, lat, lng]);
  return null;
}

interface ShipmentLocationManagementProps {
  shipments: Shipment[];
  onSaveShipment: (shipment: Shipment, isNew: boolean) => Promise<void>;
  actionLoading: boolean;
}

export default function ShipmentLocationManagement({
  shipments,
  onSaveShipment,
  actionLoading
}: ShipmentLocationManagementProps) {
  const [selectedTracking, setSelectedTracking] = useState<string>("");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Update Form States
  const [newLocation, setNewLocation] = useState("");
  const [newLat, setNewLat] = useState<number>(37.9601);
  const [newLng, setNewLng] = useState<number>(58.3260);
  const [newStatus, setNewStatus] = useState<ShipmentStatus>(ShipmentStatus.PROCESSING);
  const [checkpointDesc, setCheckpointDesc] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sync selected shipment details when selected tracking changes or shipments updates
  useEffect(() => {
    const found = shipments.find(s => s.trackingNumber === selectedTracking);
    if (found) {
      setSelectedShipment(found);
      setNewLocation(found.currentLocation || found.originCountry);
      setNewLat(found.currentLat !== undefined ? found.currentLat : (LOCATION_COORDINATES[found.currentLocation] || { lat: 37.9601, lng: 58.3260 }).lat);
      setNewLng(found.currentLng !== undefined ? found.currentLng : (LOCATION_COORDINATES[found.currentLocation] || { lat: 37.9601, lng: 58.3260 }).lng);
      setNewStatus(found.status);
      setExpectedDate(found.expectedDeliveryDate || "");
      setCheckpointDesc("");
    } else {
      setSelectedShipment(null);
    }
  }, [selectedTracking, shipments]);

  // Handle preset selector
  const handleApplyPreset = (name: string, coords: { lat: number; lng: number }) => {
    setNewLocation(name);
    setNewLat(coords.lat);
    setNewLng(coords.lng);
    setCheckpointDesc(`Cargo manifest successfully routed to physical sorting depot at ${name}.`);
  };

  // Handle map click
  const handleMapClick = (e: any) => {
    let latVal: number | null = null;
    let lngVal: number | null = null;
    
    if (e.detail?.latLng) {
      latVal = e.detail.latLng.lat;
      lngVal = e.detail.latLng.lng;
    } else if (e.latLng) {
      latVal = typeof e.latLng.lat === "function" ? e.latLng.lat() : e.latLng.lat;
      lngVal = typeof e.latLng.lng === "function" ? e.latLng.lng() : e.latLng.lng;
    }
    
    if (latVal !== null && lngVal !== null) {
      setNewLat(Number(latVal.toFixed(6)));
      setNewLng(Number(lngVal.toFixed(6)));
    }
  };

  // Publish update to Firestore
  const handlePublishUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;
    if (!newLocation.trim()) {
      alert("Please provide a valid location depot name.");
      return;
    }

    const nowIso = new Date().toISOString();
    const newHistoryNode: ShipmentHistory = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: newStatus,
      timestamp: nowIso,
      location: newLocation.trim(),
      description: checkpointDesc.trim() || `Live satellite coordinate sequence update logged: ${newLocation.trim()} (${newLat.toFixed(4)}, ${newLng.toFixed(4)}).`,
      lat: newLat,
      lng: newLng
    };

    const updatedShipment: Shipment = {
      ...selectedShipment,
      status: newStatus,
      currentLocation: newLocation.trim(),
      currentLat: newLat,
      currentLng: newLng,
      expectedDeliveryDate: expectedDate,
      updatedAt: nowIso,
      history: [...selectedShipment.history, newHistoryNode]
    };

    try {
      await onSaveShipment(updatedShipment, false);
      setSuccessMsg(`Live telemetry successfully updated! Sequence dispatched to customer tracking timeline.`);
      setCheckpointDesc("");
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      alert("Failed to write coordinates update to Firestore.");
    }
  };

  // Filter shipments
  const filteredShipmentsList = shipments.filter(s => 
    s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.receiverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-xs">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2">
          <Activity className="w-4.5 h-4.5 text-gold-600 animate-pulse" />
          Real-Time Shipment GPS & Status Location Management
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Select any active cargo shipment to override coordinates, update live status, or plot route timeline updates in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Shipment Selection & Quick Status */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
          <h4 className="font-bold text-black border-b border-gray-100 pb-2 uppercase tracking-wide flex items-center gap-1.5">
            <Search className="w-4 h-4 text-gray-500" />
            1. Select active shipment
          </h4>
          
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by Tracking ID or Shipper..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-gray-400 text-[10px]">✕</button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 bg-gray-50/50">
            {filteredShipmentsList.length === 0 ? (
              <p className="p-4 text-center text-gray-400">No active shipments found.</p>
            ) : (
              filteredShipmentsList.map((s) => (
                <button
                  key={s.trackingNumber}
                  onClick={() => setSelectedTracking(s.trackingNumber)}
                  className={`w-full text-left p-3 flex justify-between items-center transition-all ${
                    selectedTracking === s.trackingNumber 
                      ? "bg-black text-gold-500 font-extrabold" 
                      : "hover:bg-gray-100 text-gray-700 font-semibold"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-mono text-xs">{s.trackingNumber}</span>
                    <span className="text-[10px] text-gray-400 block uppercase truncate w-36">
                      To: {s.receiverName} ({s.destinationCountry})
                    </span>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase border font-extrabold ${
                    selectedTracking === s.trackingNumber
                      ? "border-gold-500/30 text-gold-400 bg-neutral-900"
                      : "border-gray-200 text-gray-600 bg-white"
                  }`}>
                    {s.status}
                  </span>
                </button>
              ))
            )}
          </div>

          {selectedShipment && (
            <div className="bg-neutral-50 p-4 rounded-xl border border-gray-150 space-y-3 pt-4">
              <span className="text-[9px] font-mono tracking-widest text-gray-400 font-extrabold block">CURRENT ACTIVE MANIFEST</span>
              <div className="space-y-1.5 text-xs text-black">
                <p><strong>Shipper:</strong> <span className="uppercase">{selectedShipment.senderName} ({selectedShipment.originCountry})</span></p>
                <p><strong>Consignee:</strong> <span className="uppercase">{selectedShipment.receiverName} ({selectedShipment.destinationCountry})</span></p>
                <p><strong>Last Known Location:</strong> <span className="text-gold-600 font-bold uppercase">{selectedShipment.currentLocation}</span></p>
                <p><strong>GPS Latitude:</strong> <span className="font-mono">{selectedShipment.currentLat !== undefined ? selectedShipment.currentLat : "N/A"}</span></p>
                <p><strong>GPS Longitude:</strong> <span className="font-mono">{selectedShipment.currentLng !== undefined ? selectedShipment.currentLng : "N/A"}</span></p>
                <p><strong>Expected Delivery:</strong> <span className="font-mono">{selectedShipment.expectedDeliveryDate}</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Right Columns: Map & Form Details */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedShipment ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-150 shadow-sm text-center text-gray-400 flex flex-col items-center justify-center space-y-3">
              <MapPin className="w-10 h-10 text-gray-300 animate-bounce" />
              <h4 className="font-bold text-sm text-black">Select a Shipment to update GPS location</h4>
              <p className="max-w-xs text-[11px] leading-relaxed">
                Choose any active transport sequence from the left column registry list to override coordinates or update shipment status.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePublishUpdate} className="space-y-6">
              
              {/* Map Canvas Card */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h4 className="font-bold text-black uppercase tracking-wide flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-gold-600" />
                    2. Geographic Satellite Map Visualizer
                  </h4>
                  <span className="text-[10px] text-gray-400 font-mono">
                    Click anywhere on the map to automatically pin new coordinates
                  </span>
                </div>

                {hasValidKey ? (
                  <div className="relative w-full h-72 rounded-xl overflow-hidden border border-gray-150">
                    <APIProvider apiKey={API_KEY} version="weekly">
                      <Map
                        defaultCenter={{ lat: newLat, lng: newLng }}
                        defaultZoom={5}
                        mapId="ADMIN_LOCATION_MANAGEMENT_MAP"
                        internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                        style={{ width: "100%", height: "100%" }}
                        gestureHandling="cooperative"
                        onClick={handleMapClick}
                      >
                        <AdvancedMarker 
                          position={{ lat: newLat, lng: newLng }} 
                          title="Proposed New Position Marker"
                          draggable={true}
                          onDragEnd={(e) => {
                            if (e.latLng) {
                              setNewLat(Number(e.latLng.lat().toFixed(6)));
                              setNewLng(Number(e.latLng.lng().toFixed(6)));
                            }
                          }}
                        >
                          <Pin background="#EAB308" glyphColor="#000000" borderColor="#000000" />
                        </AdvancedMarker>
                        <MapCenterer lat={newLat} lng={newLng} />
                      </Map>
                    </APIProvider>
                  </div>
                ) : (
                  <div className="p-8 bg-amber-50/50 border border-amber-150 rounded-xl text-center text-amber-900 space-y-2">
                    <AlertTriangle className="w-6 h-6 text-amber-600 mx-auto" />
                    <p className="font-bold">Google Maps API key has not been configured yet.</p>
                    <p className="text-[10px] text-gray-500">
                      You can still update coordinates manually using the number fields below. Key configuration is available in <strong>Settings</strong>.
                    </p>
                  </div>
                )}

                {/* Quick Station selection list */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Quick Presets for major TPL customs depots:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(LOCATION_COORDINATES).map(([name, coords]) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleApplyPreset(name, coords)}
                        className="px-2 py-1 bg-gray-50 hover:bg-gold-50 border border-gray-200 hover:border-gold-300 text-gray-600 hover:text-gold-800 rounded font-semibold transition-all transition-colors cursor-pointer"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coordinates Inputs & Forms Card */}
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-6">
                <h4 className="font-bold text-black border-b border-gray-100 pb-3 uppercase tracking-wide flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-gold-600" />
                  3. New Location Details Form
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Location Depot Name *</label>
                    <input
                      type="text"
                      required
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="e.g. Frankfurt Airport Custom Gate"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-black focus:bg-white focus:ring-1 focus:ring-gold-500 transition-all focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Latitude coordinate (GPS) *</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={newLat}
                      onChange={(e) => setNewLat(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-black focus:bg-white focus:ring-1 focus:ring-gold-500 transition-all focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Longitude coordinate (GPS) *</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      value={newLng}
                      onChange={(e) => setNewLng(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-black focus:bg-white focus:ring-1 focus:ring-gold-500 transition-all focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Active Transit Status *</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as ShipmentStatus)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-black focus:bg-white focus:outline-none"
                    >
                      {Object.values(ShipmentStatus).map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">New Estimated Delivery Date</label>
                    <input
                      type="date"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-black focus:bg-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-600">Operational Timeline checkpoint Description Log</label>
                  <textarea
                    value={checkpointDesc}
                    onChange={(e) => setCheckpointDesc(e.target.value)}
                    rows={3}
                    placeholder="e.g. Shipment scanned at Munich air cargo distribution hub, loaded for immediate departure flight connection."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-black focus:bg-white focus:ring-1 focus:ring-gold-500 transition-all focus:outline-none"
                  ></textarea>
                </div>

                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-2 font-bold animate-pulse">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTracking("");
                      setSelectedShipment(null);
                    }}
                    className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-all border border-gray-200 cursor-pointer"
                  >
                    Close Session
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-black hover:bg-neutral-900 text-gold-500 font-extrabold rounded-xl transition-all shadow-md cursor-pointer border border-neutral-800 flex items-center gap-1.5"
                  >
                    {actionLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Broadcasting to Satellite Network...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 text-gold-500" />
                        <span>Publish Live Location Update</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
