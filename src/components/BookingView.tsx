import React, { useState, useEffect } from "react";
import {
  FileText,
  User,
  MapPin,
  Truck,
  DollarSign,
  Download,
  Printer,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Info
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db, generateTrackingNumber } from "../lib/firebase";
import { Shipment, ShipmentStatus } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { ALL_COUNTRIES, getStatesForCountry } from "../lib/locationDb";

export default function BookingView() {
  // Read URL params if redirected from Calculator
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlOrigin = params.get("origin");
    const urlDest = params.get("destination");
    const urlWeight = params.get("weight");
    const urlMethod = params.get("method");
    const urlValue = params.get("declaredValue");

    if (urlOrigin) {
      if (ALL_COUNTRIES.includes(urlOrigin)) {
        handleOriginCountryChange(urlOrigin);
      } else {
        setOriginCountry(urlOrigin);
      }
    }
    if (urlDest) {
      if (ALL_COUNTRIES.includes(urlDest)) {
        handleDestinationCountryChange(urlDest);
      } else {
        setDestinationCountry(urlDest);
      }
    }
    if (urlWeight) setWeight(parseFloat(urlWeight) || 5);
    if (urlMethod) setShippingMethod(urlMethod);
    if (urlValue) setDeclaredValue(parseInt(urlValue) || 100);
  }, []);

  // Form Fields
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverEmail, setReceiverEmail] = useState("");
  
  const [originCountry, setOriginCountry] = useState("Turkmenistan");
  const [originState, setOriginState] = useState("Ashgabat");
  const [originCity, setOriginCity] = useState("Ashgabat City");

  const [destinationCountry, setDestinationCountry] = useState("Turkey");
  const [destinationState, setDestinationState] = useState("Istanbul");
  const [destinationCity, setDestinationCity] = useState("Istanbul Central");

  const [weight, setWeight] = useState(5);
  const [shippingMethod, setShippingMethod] = useState("air");
  const [declaredValue, setDeclaredValue] = useState(100);
  const [parcelDescription, setParcelDescription] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successShipment, setSuccessShipment] = useState<Shipment | null>(null);

  // Dependent location logic
  const originStates = getStatesForCountry(originCountry);
  const originCities = originStates.find(s => s.name === originState)?.cities || (originStates[0]?.cities || []);

  const destinationStates = getStatesForCountry(destinationCountry);
  const destinationCities = destinationStates.find(s => s.name === destinationState)?.cities || (destinationStates[0]?.cities || []);

  const handleOriginCountryChange = (val: string) => {
    setOriginCountry(val);
    const states = getStatesForCountry(val);
    const firstState = states[0]?.name || "";
    setOriginState(firstState);
    const cities = states[0]?.cities || [];
    setOriginCity(cities[0] || "");
  };

  const handleOriginStateChange = (val: string) => {
    setOriginState(val);
    const states = getStatesForCountry(originCountry);
    const cities = states.find(s => s.name === val)?.cities || [];
    setOriginCity(cities[0] || "");
  };

  const handleDestinationCountryChange = (val: string) => {
    setDestinationCountry(val);
    const states = getStatesForCountry(val);
    const firstState = states[0]?.name || "";
    setDestinationState(firstState);
    const cities = states[0]?.cities || [];
    setDestinationCity(cities[0] || "");
  };

  const handleDestinationStateChange = (val: string) => {
    setDestinationState(val);
    const states = getStatesForCountry(destinationCountry);
    const cities = states.find(s => s.name === val)?.cities || [];
    setDestinationCity(cities[0] || "");
  };

  // Generate a procedural SVG Barcode
  const renderSVGBarcode = (text: string) => {
    const cleanText = text.replace(/[^A-Z0-9-]/g, "");
    // Simplistic Code 39 / 1D visual simulation
    let lines = [];
    let x = 10;
    const height = 50;
    
    // Seeded random-like line widths based on text characters to make it look highly authentic
    for (let i = 0; i < cleanText.length; i++) {
      const charCode = cleanText.charCodeAt(i);
      const binary = (charCode % 5 + 1).toString(2).padStart(3, "0");
      for (const bit of binary) {
        const width = bit === "1" ? 3 : 1;
        lines.push(<rect key={`${i}-${x}`} x={x} y={5} width={width} height={height} fill="black" />);
        x += width + 1;
      }
      // Add a separator line
      lines.push(<rect key={`sep-${i}`} x={x} y={5} width={1.5} height={height} fill="black" />);
      x += 2.5;
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
    const size = 120;
    const numCells = 15;
    const cellSize = size / numCells;
    const rects = [];

    // Seeded random-like generation based on text hash to render a deterministic authentic grid
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
        // Render finder patterns at corners
        const isFinderPattern =
          (row < 4 && col < 4) || // Top-left
          (row < 4 && col >= numCells - 4) || // Top-right
          (row >= numCells - 4 && col < 4); // Bottom-left

        let fillCell = false;
        if (isFinderPattern) {
          // Inner/outer finder borders
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
      <svg width={size} height={size} className="border border-gray-150 p-1.5 bg-white rounded-xl mx-auto shadow-xs">
        {rects}
      </svg>
    );
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !senderPhone || !receiverName || !receiverPhone || !parcelDescription) {
      setErrorMessage("Please fill out all required fields marked with *");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // Auto-generate unique tracking number via Firebase transaction
      const trackingNo = await generateTrackingNumber();

      const today = new Date();
      const formatYMD = (d: Date) => d.toISOString().split("T")[0];

      // Estimated expected delivery based on shipping method
      const expectedDays = shippingMethod === "express" ? 2 : shippingMethod === "air" ? 5 : shippingMethod === "road" ? 7 : 20;
      const deliveryDate = new Date();
      deliveryDate.setDate(today.getDate() + expectedDays);

      const payload: Shipment = {
        trackingNumber: trackingNo,
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        senderEmail: senderEmail.trim() || undefined,
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        receiverEmail: receiverEmail.trim() || undefined,
        originCountry: `${originCountry} - ${originState} - ${originCity}`,
        destinationCountry: `${destinationCountry} - ${destinationState} - ${destinationCity}`,
        parcelDescription: parcelDescription.trim(),
        parcelWeight: weight,
        shippingMethod: shippingMethod.toUpperCase() + " FREIGHT",
        shippingDate: formatYMD(today),
        expectedDeliveryDate: formatYMD(deliveryDate),
        currentLocation: "Customer Booked - Scheduled for pickup",
        status: ShipmentStatus.BOOKING_PENDING,
        notes: notes.trim() || undefined,
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
        createdBy: "public-booking-form",
        history: [
          {
            id: `hist-${Date.now()}-1`,
            status: ShipmentStatus.BOOKING_PENDING,
            timestamp: today.toISOString(),
            location: `${originCountry} - ${originState} - ${originCity}`,
            description: "Shipment booking logged online by customer. Awaiting physical drop-off or courier pickup."
          }
        ]
      };

      // Clean up any undefined properties before writing to Firestore
      if (payload.senderEmail === undefined) delete payload.senderEmail;
      if (payload.receiverEmail === undefined) delete payload.receiverEmail;
      if (payload.notes === undefined) delete payload.notes;

      await setDoc(doc(db, "shipments", trackingNo), payload);

      // Simulated outbound emails trigger
      const recipients: Array<{ email: string; name: string; type: "Sender" | "Receiver" }> = [];
      if (payload.senderEmail) {
        recipients.push({
          email: payload.senderEmail,
          name: payload.senderName,
          type: "Sender",
        });
      }
      if (payload.receiverEmail) {
        recipients.push({
          email: payload.receiverEmail,
          name: payload.receiverName,
          type: "Receiver",
        });
      }

      for (const r of recipients) {
        const notifId = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const subject = `[TPL Logistics] Secure Booking Registered: ${payload.trackingNumber}`;
        const body = `Hello ${r.name},\n\nYour online consignment booking has been registered successfully with Turkmenistanyn Poçtasy Limited (TPL).\n\nTracking Number (Booking ID): ${payload.trackingNumber}\nOrigin: ${payload.originCountry}\nDestination: ${payload.destinationCountry}\nParcel: ${payload.parcelDescription}\nWeight: ${payload.parcelWeight} kg\n\nPlease drop off your parcel at your nearest TPL office, or present your Waybill Label to our pickup courier.\n\nThank you for choosing TPL!`;

        const logData = {
          id: notifId,
          trackingNumber: payload.trackingNumber,
          recipientEmail: r.email,
          recipientName: r.name,
          recipientType: r.type,
          subject: subject,
          body: body,
          status: "Sent" as const,
          timestamp: new Date().toISOString(),
        };

        try {
          await setDoc(doc(db, "notifications", notifId), logData);
          console.log(`Booking notification logged: ${notifId}`);
        } catch (err) {
          console.error("Failed to write booking notification: ", err);
        }
      }

      setSuccessShipment(payload);
    } catch (err) {
      console.error("Booking write failed: ", err);
      setErrorMessage("Could not submit booking. Please check database connectivity & try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setSuccessShipment(null);
    setSenderName("");
    setSenderPhone("");
    setSenderEmail("");
    setReceiverName("");
    setReceiverPhone("");
    setReceiverEmail("");
    setParcelDescription("");
    setNotes("");
    setWeight(5);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 font-sans">
      <AnimatePresence mode="wait">
        {!successShipment ? (
          /* SECTION 1: BOOKING FORM */
          <motion.div
            key="booking-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Title */}
            <div className="text-center space-y-2">
              <span className="text-[10px] font-mono font-extrabold text-gold-600 uppercase tracking-widest block">ONLINE SECURE BOOKING</span>
              <h1 className="text-3xl font-display font-extrabold text-black uppercase tracking-tight">
                Book a New Shipment
              </h1>
              <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
                Draft your consignment online. We will generate your official tracking documentation. Drop the package off at any local branch or request a courier.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-150 rounded-2xl text-xs flex items-center gap-3 font-semibold">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
              {/* 1. Sender Coordinates */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-100">
                  <User className="w-4 h-4 text-gold-600" />
                  1. Shipper / Sender Credentials
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Sender Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Batyr Amanov"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Sender Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +993 65 123456"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Sender Email (Alerts)</label>
                    <input
                      type="email"
                      placeholder="e.g. batyr@gmail.com"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Receiver Coordinates */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-100">
                  <User className="w-4 h-4 text-gold-600" />
                  2. Consignee / Receiver Credentials
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Receiver Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cem Yilmaz"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Receiver Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +90 532 1234567"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Receiver Email (Alerts)</label>
                    <input
                      type="email"
                      placeholder="e.g. cem@outlook.com"
                      value={receiverEmail}
                      onChange={(e) => setReceiverEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Freight Specifics */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Truck className="w-4 h-4 text-gold-600" />
                  3. Consignment & Freight Specifics
                </h3>                {/* Dependent Dropdowns for Origin */}
                <div className="bg-neutral-50 p-4 rounded-2xl border border-gray-150 space-y-4">
                  <span className="text-[10px] font-mono font-extrabold text-gold-600 uppercase tracking-widest block">Cargo Origin / Collection Route</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Origin Country *</label>
                      <select
                        required
                        value={originCountry}
                        onChange={(e) => handleOriginCountryChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-gold-500 text-xs text-black font-semibold"
                      >
                        {ALL_COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">State / Province *</label>
                      <select
                        required
                        value={originState}
                        onChange={(e) => handleOriginStateChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-gold-500 text-xs text-black font-semibold"
                      >
                        {originStates.map((s) => (
                          <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">City / Terminal *</label>
                      <select
                        required
                        value={originCity}
                        onChange={(e) => setOriginCity(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-gold-500 text-xs text-black font-semibold"
                      >
                        {originCities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Dependent Dropdowns for Destination */}
                <div className="bg-neutral-50 p-4 rounded-2xl border border-gray-150 space-y-4">
                  <span className="text-[10px] font-mono font-extrabold text-gold-600 uppercase tracking-widest block">Cargo Destination / Delivery Route</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Destination Country *</label>
                      <select
                        required
                        value={destinationCountry}
                        onChange={(e) => handleDestinationCountryChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-gold-500 text-xs text-black font-semibold"
                      >
                        {ALL_COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">State / Province *</label>
                      <select
                        required
                        value={destinationState}
                        onChange={(e) => handleDestinationStateChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-gold-500 text-xs text-black font-semibold"
                      >
                        {destinationStates.map((s) => (
                          <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">City / Terminal *</label>
                      <select
                        required
                        value={destinationCity}
                        onChange={(e) => setDestinationCity(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-gold-500 text-xs text-black font-semibold"
                      >
                        {destinationCities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Preferred Freight Service *</label>
                    <select
                      value={shippingMethod}
                      onChange={(e) => setShippingMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    >
                      <option value="express">Express Delivery</option>
                      <option value="air">Air Freight</option>
                      <option value="road">Road Freight</option>
                      <option value="sea">Sea Freight</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Est. Physical Weight (kg) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={weight}
                      onChange={(e) => setWeight(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Declared Value (USD) *</label>
                    <input
                      type="number"
                      required
                      min="10"
                      value={declaredValue}
                      onChange={(e) => setDeclaredValue(Math.max(10, parseInt(e.target.value) || 10))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Parcel Description *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Leather boots & document folder"
                      value={parcelDescription}
                      onChange={(e) => setParcelDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">Special Carriage Instructions / Handling Notes</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Fragile glassware, do not drop or stack heavy boxes on top."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                  />
                </div>
              </div>

              {/* Submits */}
              <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-2 items-center text-[10px] text-gray-400 font-mono">
                  <Info className="w-4 h-4 text-gold-600" />
                  <span>Submission creates a real-time booking record in Firestore</span>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3.5 bg-black hover:bg-neutral-900 text-gold-500 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <span>Registering Booking...</span>
                  ) : (
                    <>
                      <span>Submit Secure Booking</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* SECTION 2: BOOKING SUCCESS RECEIPT & SHIPPING LABEL */
          <motion.div
            key="booking-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-xl mx-auto space-y-8"
          >
            {/* Visual Header confirmation */}
            <div className="text-center space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-black">Booking Successfully Registered!</h2>
              <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                Your online consignment has been logged directly to the central database. Please print this label or save the Tracking Number below for drop-off.
              </p>
            </div>

            {/* Printable Air Waybill (AWB) card */}
            <div id="tpl-waybill-card" className="bg-white border-2 border-black rounded-3xl p-6 shadow-xl space-y-6 font-mono text-xs text-black relative">
              {/* Receipt Dotted cut line decoration */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-neutral-200 to-transparent"></div>

              {/* Waybill top logo */}
              <div className="flex justify-between items-start pb-4 border-b border-gray-300">
                <div className="space-y-1">
                  <span className="text-xs font-black tracking-widest bg-black text-white px-2 py-0.5 rounded">TPL</span>
                  <span className="text-[9px] font-bold text-gray-500 block">TURKMENISTAN POST</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-black">AIR WAYBILL / CARRIAGE RECEIPT</span>
                  <span className="text-[9px] text-gray-500 block">UPU SECURE TRACKING</span>
                </div>
              </div>

              {/* Barcode representation */}
              <div className="text-center space-y-1.5 py-2">
                {renderSVGBarcode(successShipment.trackingNumber)}
                <span className="text-xs font-black font-mono tracking-widest block text-center">
                  {successShipment.trackingNumber}
                </span>
              </div>

              {/* Coordinates layout split */}
              <div className="grid grid-cols-2 gap-4 border-y border-gray-300 py-4">
                <div className="space-y-1.5 border-r border-gray-200 pr-2">
                  <span className="text-[9px] text-gray-500 font-bold block uppercase">FROM (SHIPPER):</span>
                  <p className="font-black text-black">{successShipment.senderName}</p>
                  <p className="text-gray-500 text-[10px]">{successShipment.senderPhone}</p>
                  <p className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded inline-block font-bold">
                    {successShipment.originCountry}
                  </p>
                </div>
                <div className="space-y-1.5 pl-2">
                  <span className="text-[9px] text-gray-500 font-bold block uppercase">TO (CONSIGNEE):</span>
                  <p className="font-black text-black">{successShipment.receiverName}</p>
                  <p className="text-gray-500 text-[10px]">{successShipment.receiverPhone}</p>
                  <p className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded inline-block font-bold">
                    {successShipment.destinationCountry}
                  </p>
                </div>
              </div>

              {/* Dimensions, values */}
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="bg-gray-50 p-2 rounded-xl">
                  <span className="text-gray-400 block uppercase">Weight</span>
                  <span className="font-bold text-black">{successShipment.parcelWeight} kg</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl">
                  <span className="text-gray-400 block uppercase">Service</span>
                  <span className="font-bold text-black">{successShipment.shippingMethod}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl">
                  <span className="text-gray-400 block uppercase">Declared Value</span>
                  <span className="font-bold text-black">${declaredValue} USD</span>
                </div>
              </div>

              <div className="border-t border-gray-300 pt-4 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-8 space-y-1">
                  <span className="text-[9px] text-gray-500 font-bold uppercase block">Parcel Contents:</span>
                  <p className="text-[10px] font-bold text-gray-800 leading-relaxed">
                    {successShipment.parcelDescription}
                  </p>
                  {successShipment.notes && (
                    <p className="text-[9px] text-gray-500 italic mt-1 leading-normal">
                      * Notes: {successShipment.notes}
                    </p>
                  )}
                </div>
                <div className="col-span-4 text-center">
                  {renderSVGQRCode(successShipment.trackingNumber)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center gap-4">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-3 border border-gray-200 hover:bg-gray-100 text-black text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Waybill Label</span>
              </button>
              <button
                onClick={handleResetForm}
                className="px-5 py-3 bg-black hover:bg-neutral-900 text-gold-500 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <span>Book Another Shipment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
