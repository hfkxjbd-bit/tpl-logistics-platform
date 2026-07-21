import React, { useState, useEffect } from "react";
import { Shipment, ShipmentStatus, ShipmentHistory } from "../../types";
import { 
  Plus, Search, Edit2, Trash2, ArrowLeft, Upload, Calendar, 
  Truck, CheckCircle, FileText, User, Scale, AlertTriangle, 
  History, Clock, RefreshCw, Mail 
} from "lucide-react";
import CustomDatePicker from "./CustomDatePicker";
import { ALL_COUNTRIES } from "../../lib/locationDb";

interface ShipmentListProps {
  shipments: Shipment[];
  loading: boolean;
  currentUserUid: string;
  onSaveShipment: (shipment: Shipment, isNew: boolean) => Promise<void>;
  onDeleteShipment: (trackingNumber: string) => Promise<void>;
  onSeedDemo: () => Promise<void>;
  actionLoading: boolean;
  activeTab?: string;
}

export default function ShipmentList({
  shipments,
  loading,
  currentUserUid,
  onSaveShipment,
  onDeleteShipment,
  onSeedDemo,
  actionLoading,
  activeTab
}: ShipmentListProps) {
  // Navigation states
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // Listing states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([]);
  
  // Bulk Selection states
  const [selectedTrackingNumbers, setSelectedTrackingNumbers] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<string>("");

  // Form states
  const [formTrackingNumber, setFormTrackingNumber] = useState("");
  const [formSenderName, setFormSenderName] = useState("");
  const [formSenderPhone, setFormSenderPhone] = useState("");
  const [formSenderEmail, setFormSenderEmail] = useState("");
  const [formReceiverName, setFormReceiverName] = useState("");
  const [formReceiverPhone, setFormReceiverPhone] = useState("");
  const [formReceiverEmail, setFormReceiverEmail] = useState("");
  const [formOriginCountry, setFormOriginCountry] = useState("Turkmenistan");
  const [formDestinationCountry, setFormDestinationCountry] = useState("");
  const [formParcelWeight, setFormParcelWeight] = useState(1.0);
  const [formShippingMethod, setFormShippingMethod] = useState("Express Air");
  const [formParcelDescription, setFormParcelDescription] = useState("");
  const [formShippingDate, setFormShippingDate] = useState("");
  const [formExpectedDeliveryDate, setFormExpectedDeliveryDate] = useState("");
  const [formCurrentLocation, setFormCurrentLocation] = useState("Ashgabat Central Sorting Office");
  const [formStatus, setFormStatus] = useState<ShipmentStatus>(ShipmentStatus.CREATED);
  const [formDeliveryProofUrl, setFormDeliveryProofUrl] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Checkpoint Addition states
  const [historyLocation, setHistoryLocation] = useState("");
  const [historyStatus, setHistoryStatus] = useState<ShipmentStatus>(ShipmentStatus.PROCESSING);
  const [historyDescription, setHistoryDescription] = useState("");

  // Reset screen view when tab changes
  useEffect(() => {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedShipment(null);
  }, [activeTab]);

  // Filter effect
  useEffect(() => {
    let result = shipments;
    if (statusFilter !== "all") {
      result = result.filter(s => s.status === statusFilter);
    }
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.trackingNumber.toLowerCase().includes(q) ||
        s.senderName.toLowerCase().includes(q) ||
        s.receiverName.toLowerCase().includes(q) ||
        s.originCountry.toLowerCase().includes(q) ||
        s.destinationCountry.toLowerCase().includes(q)
      );
    }
    setFilteredShipments(result);
  }, [searchQuery, statusFilter, shipments]);

  // Bulk operation
  const handleBulkStatusUpdate = async () => {
    if (selectedTrackingNumbers.length === 0) {
      alert("Please select at least one shipment from the registry checklist.");
      return;
    }
    if (!bulkStatus) {
      alert("Please select a target status to apply.");
      return;
    }

    if (confirm(`Are you sure you want to update ${selectedTrackingNumbers.length} shipment(s) to ${bulkStatus}?`)) {
      try {
        for (const trackingNum of selectedTrackingNumbers) {
          const original = shipments.find(s => s.trackingNumber === trackingNum);
          if (original) {
            const nowIso = new Date().toISOString();
            const newHistoryNode: ShipmentHistory = {
              id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              status: bulkStatus as ShipmentStatus,
              timestamp: nowIso,
              location: original.currentLocation,
              description: `Bulk logistics status update executed by system operator.`
            };

            const updated: Shipment = {
              ...original,
              status: bulkStatus as ShipmentStatus,
              updatedAt: nowIso,
              history: [...original.history, newHistoryNode]
            };

            await onSaveShipment(updated, false);
          }
        }
        alert("Bulk manifest updates successfully deployed!");
        setSelectedTrackingNumbers([]);
        setBulkStatus("");
      } catch (err) {
        alert("Error during bulk updates processing.");
      }
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedTrackingNumbers.length === filteredShipments.length) {
      setSelectedTrackingNumbers([]);
    } else {
      setSelectedTrackingNumbers(filteredShipments.map(s => s.trackingNumber));
    }
  };

  const handleToggleSelect = (num: string) => {
    if (selectedTrackingNumbers.includes(num)) {
      setSelectedTrackingNumbers(selectedTrackingNumbers.filter(id => id !== num));
    } else {
      setSelectedTrackingNumbers([...selectedTrackingNumbers, num]);
    }
  };

  // Generate tracking sequence
  const handleCreateNewClick = () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const trackingNo = `TPL-${dateStr}-${randomSeq}`;

    setFormTrackingNumber(trackingNo);
    setFormSenderName("");
    setFormSenderPhone("");
    setFormSenderEmail("");
    setFormReceiverName("");
    setFormReceiverPhone("");
    setFormReceiverEmail("");
    setFormOriginCountry("Turkmenistan");
    setFormDestinationCountry("");
    setFormParcelWeight(1.5);
    setFormShippingMethod("Express Air");
    setFormParcelDescription("");
    setFormNotes("");
    
    // Default Dates
    const nextWeek = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
    setFormShippingDate(today.toISOString().split("T")[0]);
    setFormExpectedDeliveryDate(nextWeek.toISOString().split("T")[0]);
    setFormCurrentLocation("Ashgabat Central Terminal Hub");
    setFormStatus(ShipmentStatus.CREATED);
    setFormDeliveryProofUrl("");

    setIsCreating(true);
    setIsEditing(false);
  };

  const handleEditClick = (s: Shipment) => {
    setSelectedShipment(s);
    setFormTrackingNumber(s.trackingNumber);
    setFormSenderName(s.senderName);
    setFormSenderPhone(s.senderPhone);
    setFormSenderEmail(s.senderEmail || "");
    setFormReceiverName(s.receiverName);
    setFormReceiverPhone(s.receiverPhone);
    setFormReceiverEmail(s.receiverEmail || "");
    setFormOriginCountry(s.originCountry);
    setFormDestinationCountry(s.destinationCountry);
    setFormParcelWeight(s.parcelWeight);
    setFormShippingMethod(s.shippingMethod);
    setFormParcelDescription(s.parcelDescription);
    setFormShippingDate(s.shippingDate);
    setFormExpectedDeliveryDate(s.expectedDeliveryDate);
    setFormCurrentLocation(s.currentLocation);
    setFormStatus(s.status);
    setFormDeliveryProofUrl(s.deliveryProofUrl || "");
    setFormNotes(s.notes || "");

    // Checkpoint default
    setHistoryLocation(s.currentLocation);
    setHistoryStatus(s.status);
    setHistoryDescription("");

    setIsEditing(true);
    setIsCreating(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 250 * 1024) {
      alert("File is too large! Please choose an image smaller than 250KB for compressed storage.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormDeliveryProofUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDestinationCountry || !formSenderName || !formReceiverName) {
      alert("Please fill in all mandatory fields denoted by *");
      return;
    }

    const nowIso = new Date().toISOString();
    const isNew = isCreating;

    let payload: Shipment;

    if (isNew) {
      const initialHistory: ShipmentHistory[] = [
        {
          id: `hist-${Date.now()}-01`,
          status: formStatus,
          timestamp: nowIso,
          location: formCurrentLocation,
          description: "Shipment manifest formally logged into central database systems."
        }
      ];

      payload = {
        trackingNumber: formTrackingNumber,
        senderName: formSenderName.trim(),
        senderPhone: formSenderPhone.trim(),
        senderEmail: formSenderEmail.trim() || undefined,
        receiverName: formReceiverName.trim(),
        receiverPhone: formReceiverPhone.trim(),
        receiverEmail: formReceiverEmail.trim() || undefined,
        originCountry: formOriginCountry.trim(),
        destinationCountry: formDestinationCountry.trim(),
        parcelWeight: Number(formParcelWeight),
        shippingMethod: formShippingMethod,
        parcelDescription: formParcelDescription.trim(),
        shippingDate: formShippingDate,
        expectedDeliveryDate: formExpectedDeliveryDate,
        currentLocation: formCurrentLocation.trim(),
        status: formStatus,
        deliveryProofUrl: formDeliveryProofUrl || undefined,
        notes: formNotes.trim() || undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
        createdBy: currentUserUid,
        history: initialHistory
      };
    } else {
      payload = {
        ...selectedShipment!,
        senderName: formSenderName.trim(),
        senderPhone: formSenderPhone.trim(),
        senderEmail: formSenderEmail.trim() || undefined,
        receiverName: formReceiverName.trim(),
        receiverPhone: formReceiverPhone.trim(),
        receiverEmail: formReceiverEmail.trim() || undefined,
        originCountry: formOriginCountry.trim(),
        destinationCountry: formDestinationCountry.trim(),
        parcelWeight: Number(formParcelWeight),
        shippingMethod: formShippingMethod,
        parcelDescription: formParcelDescription.trim(),
        shippingDate: formShippingDate,
        expectedDeliveryDate: formExpectedDeliveryDate,
        currentLocation: formCurrentLocation.trim(),
        status: formStatus,
        deliveryProofUrl: formDeliveryProofUrl || undefined,
        notes: formNotes.trim() || undefined,
        updatedAt: nowIso
      };
    }

    // Undefined cleans
    if (payload.senderEmail === "") delete payload.senderEmail;
    if (payload.receiverEmail === "") delete payload.receiverEmail;
    if (payload.deliveryProofUrl === "") delete payload.deliveryProofUrl;
    if (payload.notes === "") delete payload.notes;

    try {
      await onSaveShipment(payload, isNew);
      setIsCreating(false);
      setIsEditing(false);
      setSelectedShipment(null);
    } catch (err) {
      alert("Error writing shipment record to database.");
    }
  };

  const handleAddNewHistoryLog = async () => {
    if (!selectedShipment) return;
    if (!historyDescription.trim()) {
      alert("Please enter a checkpoint description log.");
      return;
    }

    const nowIso = new Date().toISOString();
    const newHistoryNode: ShipmentHistory = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: historyStatus,
      timestamp: nowIso,
      location: historyLocation.trim(),
      description: historyDescription.trim()
    };

    const updatedTimeline = [...selectedShipment.history, newHistoryNode];
    const updatedShipmentRecord: Shipment = {
      ...selectedShipment,
      status: historyStatus,
      currentLocation: historyLocation.trim(),
      updatedAt: nowIso,
      history: updatedTimeline
    };

    try {
      await onSaveShipment(updatedShipmentRecord, false);
      setSelectedShipment(updatedShipmentRecord);
      setHistoryDescription("");
      alert("Checkpoint logged and customer alerts dispatched!");
    } catch (err) {
      alert("Failed to append historical checkpoint.");
    }
  };

  const handleDeleteClick = async (trackingNo: string) => {
    if (confirm(`CRITICAL CRUCIAL ACTION:\nAre you sure you want to permanently delete shipment ${trackingNo}? This action is irreversible.`)) {
      try {
        await onDeleteShipment(trackingNo);
      } catch (err) {
        alert("Delete operation failed.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {!isCreating && !isEditing ? (
        /* SCREEN A: LIST VIEW WITH BULK ACTIONS */
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex-col sm:flex-row gap-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2">
                <Truck className="w-4 h-4 text-gold-600" />
                Active Logistics Cargo Registry
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Add, manage, edit transit checkpoints, or delete physical shipment manifest details system-wide.
              </p>
            </div>
            <button
              onClick={handleCreateNewClick}
              className="px-4 py-2.5 bg-black hover:bg-neutral-900 text-gold-500 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Manifest New Cargo</span>
            </button>
          </div>

          {/* Seed demo card if database empty */}
          {shipments.length === 0 && !loading && (
            <div className="bg-gold-50 border border-gold-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-gold-950">
              <div className="flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-gold-700 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Empty Logistics Records</h4>
                  <p className="text-xs text-gold-800 leading-relaxed">
                    Initialize Turkmenistanyn Poçtasy logistics mock database profiles to test tracking features directly.
                  </p>
                </div>
              </div>
              <button
                onClick={onSeedDemo}
                disabled={actionLoading}
                className="px-4 py-2 bg-black text-gold-500 font-bold rounded-xl text-xs hover:bg-neutral-900 transition-all cursor-pointer whitespace-nowrap shadow-sm"
              >
                {actionLoading ? "Deploying..." : "Seed Mock Shipments"}
              </button>
            </div>
          )}

          {/* Filters, Search, and Bulk updates bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-150 space-y-4 shadow-xs">
            <div className="flex flex-col md:flex-row gap-3 items-center">
              {/* Search input */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Query shipment records by tracking ID, shipper or recipient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-black font-semibold focus:bg-white focus:ring-1 focus:ring-gold-500 transition-all"
                />
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-56">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-black"
                >
                  <option value="all">All Transit Statuses</option>
                  {Object.values(ShipmentStatus).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bulk Status Updater actions */}
            {selectedTrackingNumbers.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-neutral-50 rounded-xl border border-gray-200 gap-3">
                <div className="text-xs font-semibold text-black">
                  Selected <strong className="font-mono text-gold-600 bg-gold-50 border border-gold-200/50 px-1.5 py-0.5 rounded">{selectedTrackingNumbers.length}</strong> cargo manifest(s)
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-bold"
                  >
                    <option value="">Choose Batch Status...</option>
                    {Object.values(ShipmentStatus).map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleBulkStatusUpdate}
                    className="px-3.5 py-1.5 bg-black text-gold-500 font-extrabold text-[10px] rounded-lg hover:bg-neutral-900 shadow-sm border border-neutral-800 cursor-pointer"
                  >
                    Deploy Bulk Update
                  </button>
                  <button
                    onClick={() => setSelectedTrackingNumbers([])}
                    className="px-2.5 py-1.5 text-gray-400 hover:text-black font-bold text-[10px]"
                  >
                    Cancel Selection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table container */}
          <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-150">
                    <th className="py-4 px-6 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={filteredShipments.length > 0 && selectedTrackingNumbers.length === filteredShipments.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-gray-300 text-gold-500 focus:ring-gold-500"
                      />
                    </th>
                    <th className="py-4 px-6 font-mono">TRACKING SEQUENCE</th>
                    <th className="py-4 px-6">SHIPPER (SENDER)</th>
                    <th className="py-4 px-6">CONSIGNEE (RECEIVER)</th>
                    <th className="py-4 px-6">CARGO ROUTE</th>
                    <th className="py-4 px-6">CURRENT STATUS</th>
                    <th className="py-4 px-6 text-right">OPERATIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        <div className="w-6 h-6 border-2 border-gold-500 border-t-black rounded-full animate-spin mx-auto mb-2"></div>
                        <span className="font-mono text-[10px] tracking-wider">PULLING DATABASE MANIFEST RECORDS...</span>
                      </td>
                    </tr>
                  ) : filteredShipments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        <Truck className="w-8 h-8 mx-auto opacity-50 mb-2" />
                        <span>No shipments recorded. Add a cargo manifest or query alternative keywords.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredShipments.map((s) => (
                      <tr key={s.trackingNumber} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-4 px-6 text-center">
                          <input
                            type="checkbox"
                            checked={selectedTrackingNumbers.includes(s.trackingNumber)}
                            onChange={() => handleToggleSelect(s.trackingNumber)}
                            className="rounded border-gray-300 text-gold-500 focus:ring-gold-500"
                          />
                        </td>
                        <td className="py-4.5 px-6 font-mono font-bold text-black text-sm">
                          <span>{s.trackingNumber}</span>
                          <span className="text-[10px] text-gray-400 font-normal block mt-0.5">Method: {s.shippingMethod}</span>
                        </td>
                        <td className="py-4.5 px-6 uppercase">
                          <p className="font-semibold text-black">{s.senderName}</p>
                          <p className="text-[10px] text-gray-400">{s.senderPhone}</p>
                        </td>
                        <td className="py-4.5 px-6 uppercase">
                          <p className="font-semibold text-black">{s.receiverName}</p>
                          <p className="text-[10px] text-gray-400">{s.receiverPhone}</p>
                        </td>
                        <td className="py-4.5 px-6 uppercase font-semibold text-[11px]">
                          <span className="text-gray-500">{s.originCountry}</span>
                          <span className="text-gold-600 px-1 font-bold">→</span>
                          <span className="text-black">{s.destinationCountry}</span>
                          <span className="text-[10px] text-gray-400 font-normal block mt-0.5">Weight: {s.parcelWeight} kg</span>
                        </td>
                        <td className="py-4.5 px-6">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black text-gold-500 font-extrabold text-[10px] uppercase border border-gold-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse"></span>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-4.5 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(s)}
                              className="p-2 bg-gray-50 hover:bg-gold-50 text-gray-700 hover:text-gold-700 rounded-lg border border-gray-200/60 transition-all cursor-pointer"
                              title="Modify details or Append Timeline logs"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(s.trackingNumber)}
                              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200/50 transition-all cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* SCREEN B: ADD OR EDIT FORM */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleSaveSubmit} className="lg:col-span-2 space-y-6">
            {/* Back action bar */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                  setSelectedShipment(null);
                }}
                className="p-2 bg-white hover:bg-neutral-50 text-black border border-gray-200 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5 text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Registry</span>
              </button>
              <div className="h-4 w-[1px] bg-gray-200"></div>
              <h2 className="text-base font-bold text-black">
                {isCreating ? "Manifest New Cargo Record" : "Modify Cargo Particulars"}
              </h2>
            </div>

            {/* Main Form Fields wrapper */}
            <div className="bg-white rounded-2xl border border-gray-150 p-6 md:p-8 space-y-8 shadow-sm">
              <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <span className="text-[9px] font-mono tracking-widest text-gold-600 font-extrabold block">TRACKING ID SEQUENCE</span>
                  <span className="font-mono font-bold text-base text-black">{formTrackingNumber}</span>
                </div>
                {isCreating && (
                  <span className="px-3 py-1 bg-black text-gold-500 font-mono text-[10px] font-bold rounded-lg border border-gold-400/20">
                    Auto-manifest sequence
                  </span>
                )}
              </div>

              {/* 1. Sender Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-gold-600" />
                  Shipper (Sender) Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formSenderName}
                      onChange={(e) => setFormSenderName(e.target.value)}
                      placeholder="e.g. Arslan Gurbanov"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formSenderPhone}
                      onChange={(e) => setFormSenderPhone(e.target.value)}
                      placeholder="e.g. +993 12 380102"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Alert Email</label>
                    <input
                      type="email"
                      value={formSenderEmail}
                      onChange={(e) => setFormSenderEmail(e.target.value)}
                      placeholder="sender@gmail.com"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Receiver Info */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-gold-600" />
                  Consignee (Receiver) Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formReceiverName}
                      onChange={(e) => setFormReceiverName(e.target.value)}
                      placeholder="e.g. Liam Johnson"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      value={formReceiverPhone}
                      onChange={(e) => setFormReceiverPhone(e.target.value)}
                      placeholder="e.g. +44 7700 900077"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Alert Email</label>
                    <input
                      type="email"
                      value={formReceiverEmail}
                      onChange={(e) => setFormReceiverEmail(e.target.value)}
                      placeholder="receiver@gmail.com"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Parcel and Route Details */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gold-600" />
                  Cargo Dimensions & Targets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Origin Country *</label>
                    <select
                      required
                      value={formOriginCountry}
                      onChange={(e) => setFormOriginCountry(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    >
                      {ALL_COUNTRIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Destination Target *</label>
                    <select
                      required
                      value={formDestinationCountry}
                      onChange={(e) => setFormDestinationCountry(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    >
                      <option value="">-- Choose Country --</option>
                      {ALL_COUNTRIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Weight (kg) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formParcelWeight}
                      onChange={(e) => setFormParcelWeight(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Method Selection *</label>
                    <select
                      value={formShippingMethod}
                      onChange={(e) => setFormShippingMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-black font-semibold"
                    >
                      <option value="Express Air">Express Air</option>
                      <option value="Standard Cargo">Standard Cargo</option>
                      <option value="Road Freight">Road Freight</option>
                      <option value="Sea Freight">Sea Freight</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Brief Cargo Description *</label>
                    <input
                      type="text"
                      required
                      value={formParcelDescription}
                      onChange={(e) => setFormParcelDescription(e.target.value)}
                      placeholder="Traditional handwoven carpets, etc."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Timeline details */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gold-600" />
                  Scheduling & Locations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-100 pb-4">
                  <CustomDatePicker
                    label="Dispatch Date"
                    required
                    value={formShippingDate}
                    onChange={(dateStr) => setFormShippingDate(dateStr)}
                  />
                  <CustomDatePicker
                    label="Estimated Delivery"
                    required
                    value={formExpectedDeliveryDate}
                    onChange={(dateStr) => setFormExpectedDeliveryDate(dateStr)}
                  />
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Current Depot *</label>
                    <input
                      type="text"
                      required
                      value={formCurrentLocation}
                      onChange={(e) => setFormCurrentLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-black font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Status Manifest *</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as ShipmentStatus)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-black font-semibold"
                    >
                      {Object.values(ShipmentStatus).map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Operational Notes</label>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Fragile, handle with extreme care"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Attachments / Delivery proof */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gold-600" />
                  Delivery Verification / Signatures
                </h3>
                <div className="flex items-center gap-6">
                  <div className="flex-1 space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Upload Delivery Handover Proof (Image/JPG/PNG)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-900 file:text-gold-500 hover:file:bg-black cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-400">Supported formats: PNG, JPG, PDF. File must be under 250KB.</p>
                  </div>
                  {formDeliveryProofUrl && (
                    <div className="w-16 h-16 border border-gray-200 rounded-xl overflow-hidden shadow-xs flex-shrink-0 bg-gray-50">
                      <img src={formDeliveryProofUrl} alt="Delivery verification file" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                    setSelectedShipment(null);
                  }}
                  className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs transition-all border border-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-black hover:bg-neutral-900 text-gold-500 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer border border-neutral-800"
                >
                  {actionLoading ? "Saving Manifest..." : "Commit Cargo Manifest"}
                </button>
              </div>
            </div>
          </form>

          {/* Right Column: Checkpoint Additions Form (Only visible in edit mode) */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2 border-b border-gray-150 pb-3">
                <History className="w-4 h-4 text-gold-600" />
                Checkpoint Logging
              </h3>

              {!isEditing ? (
                <div className="p-4 bg-amber-50 text-amber-950 text-xs rounded-xl border border-amber-200/50 flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0" />
                  <p>Checkpoint timeline additions are only accessible when editing an existing active cargo manifest record.</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">Transition Status</label>
                    <select
                      value={historyStatus}
                      onChange={(e) => setHistoryStatus(e.target.value as ShipmentStatus)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-black"
                    >
                      {Object.values(ShipmentStatus).map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">Location Depot</label>
                    <input
                      type="text"
                      value={historyLocation}
                      onChange={(e) => setHistoryLocation(e.target.value)}
                      placeholder="e.g. Istanbul Transit Office"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">Checkpoint Description Log</label>
                    <textarea
                      value={historyDescription}
                      onChange={(e) => setHistoryDescription(e.target.value)}
                      rows={3}
                      placeholder="e.g. Cargo received at European hub, prepared for flight connection."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-black focus:bg-white focus:ring-1 focus:ring-gold-500 transition-all focus:outline-none"
                    ></textarea>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddNewHistoryLog}
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-black text-gold-500 hover:bg-neutral-900 border border-neutral-800 font-extrabold rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    Append Checkpoint update
                  </button>
                </div>
              )}
            </div>

            {/* Current Shipment history display */}
            {isEditing && selectedShipment && (
              <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-4">
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-150 pb-2 flex justify-between items-center">
                  <span>Current Transit Logs</span>
                  <span className="font-mono text-xs text-black font-semibold">{selectedShipment.history.length} Nodes</span>
                </h4>
                <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-gray-100 max-h-80 overflow-y-auto pr-1">
                  {selectedShipment.history.map((h, i) => (
                    <div key={h.id || i} className="relative pl-7 text-[11px]">
                      <span className="absolute left-1 top-1 w-4.5 h-4.5 rounded-full bg-neutral-900 border-2 border-gold-400 flex items-center justify-center text-[7px] text-white font-mono font-bold">
                        {selectedShipment.history.length - i}
                      </span>
                      <div className="space-y-0.5">
                        <div className="flex justify-between font-bold text-black text-xs">
                          <span className="text-gold-600 font-extrabold">{h.status}</span>
                          <span className="text-[9px] text-gray-400 font-mono font-normal">
                            {new Date(h.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-700">{h.location}</p>
                        <p className="text-gray-400 leading-relaxed font-normal italic">"{h.description}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
