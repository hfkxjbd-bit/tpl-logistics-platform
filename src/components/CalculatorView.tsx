import React, { useState, useEffect } from "react";
import {
  Calculator,
  ArrowRight,
  Info,
  DollarSign,
  Calendar,
  Box,
  Globe,
  Settings
} from "lucide-react";
import { motion } from "motion/react";

import { ALL_COUNTRIES, getStatesForCountry } from "../lib/locationDb";

const METHODS = [
  { id: "express", name: "Express Delivery", baseRate: 15, perKg: 5, volMultiplier: 1.5, days: "1-2 Days" },
  { id: "air", name: "Air Freight", baseRate: 10, perKg: 3.5, volMultiplier: 1.2, days: "2-5 Days" },
  { id: "road", name: "Road Freight", baseRate: 6, perKg: 1.8, volMultiplier: 1.0, days: "3-7 Days" },
  { id: "sea", name: "Sea Freight", baseRate: 4, perKg: 1.1, volMultiplier: 0.8, days: "15-30 Days" }
];

export default function CalculatorView() {
  const [originCountry, setOriginCountry] = useState("Turkmenistan");
  const [originState, setOriginState] = useState("Ashgabat");
  const [originCity, setOriginCity] = useState("Ashgabat City");

  const [destinationCountry, setDestinationCountry] = useState("Turkey");
  const [destinationState, setDestinationState] = useState("Istanbul");
  const [destinationCity, setDestinationCity] = useState("Istanbul Central");

  const [weight, setWeight] = useState(5);
  const [length, setLength] = useState(30);
  const [width, setWidth] = useState(25);
  const [height, setHeight] = useState(20);
  const [method, setMethod] = useState("air");
  const [declaredValue, setDeclaredValue] = useState(100);

  // Dependent location lists
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

  // Estimation Results
  const [volWeight, setVolWeight] = useState(0);
  const [chargeableWeight, setChargeableWeight] = useState(0);
  const [baseCostUSD, setBaseCostUSD] = useState(0);
  const [customsFeeUSD, setCustomsFeeUSD] = useState(0);
  const [totalCostUSD, setTotalCostUSD] = useState(0);
  const [totalCostTMT, setTotalCostTMT] = useState(0);
  const [duration, setDuration] = useState("");

  const EXCHANGE_RATE = 3.5; // Official TMT rate fallback or simplified conversion for illustration

  useEffect(() => {
    // Volumetric weight = (L * W * H) / 5000
    const calculatedVolWeight = parseFloat(((length * width * height) / 5000).toFixed(2));
    setVolWeight(calculatedVolWeight);

    // Chargeable weight is maximum of physical and volumetric
    const finalWeight = Math.max(weight, calculatedVolWeight);
    setChargeableWeight(finalWeight);

    // Selected service config
    const service = METHODS.find((m) => m.id === method) || METHODS[1];
    setDuration(service.days);

    // Dynamic zone multiplier
    const isInternational = originCountry !== "Turkmenistan" || destinationCountry !== "Turkmenistan";
    const zoneMultiplier = isInternational ? 2.5 : 0.8;

    // Calculation base: baseRate + (chargeableWeight * perKg) * zoneMultiplier
    let calculatedBase = (service.baseRate + finalWeight * service.perKg) * zoneMultiplier * service.volMultiplier;
    
    // Add insurance/value dynamic buffer
    if (declaredValue > 200) {
      calculatedBase += (declaredValue - 200) * 0.02; // 2% premium insurance
    }

    setBaseCostUSD(parseFloat(calculatedBase.toFixed(2)));

    // Custom duties and regulatory border tax (10% standard for international)
    const dutyVal = isInternational ? declaredValue * 0.12 : 0;
    setCustomsFeeUSD(parseFloat(dutyVal.toFixed(2)));

    const finalUSD = calculatedBase + dutyVal;
    setTotalCostUSD(parseFloat(finalUSD.toFixed(2)));
    setTotalCostTMT(parseFloat((finalUSD * EXCHANGE_RATE).toFixed(2)));
  }, [originCountry, destinationCountry, weight, length, width, height, method, declaredValue]);

  const handleBookRedirect = () => {
    // Build search queries and dispatch event to navigate to Booking page with values!
    const queryParams = new URLSearchParams({
      origin: originCountry,
      destination: destinationCountry,
      weight: weight.toString(),
      length: length.toString(),
      width: width.toString(),
      height: height.toString(),
      method,
      declaredValue: declaredValue.toString()
    });

    window.history.pushState({}, "", `${window.location.pathname}?${queryParams.toString()}`);
    const customEvent = new CustomEvent("tpl-navigate", {
      detail: {
        tab: "book",
        origin: originCountry,
        destination: destinationCountry,
        weight,
        length,
        width,
        height,
        method,
        declaredValue
      }
    });
    window.dispatchEvent(customEvent);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 font-sans">
      {/* View Title */}
      <div className="text-center space-y-3">
        <span className="text-[10px] font-mono font-extrabold text-gold-600 uppercase tracking-widest block">TARIFF INTEGRITY PORTAL</span>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-black tracking-tight uppercase">
          Shipping Pricing & Cargo Calculator
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Estimate live cargo carriage rates, volumetric weight adjustments, and cross-border customs declarations tariffs on the Silk Road network in under 10 seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Calculator Inputs Form */}
        <div className="lg:col-span-7 bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
            <Calculator className="w-5 h-5 text-gold-600" />
            <h3 className="text-xs font-extrabold text-black uppercase tracking-wider">
              Shipment Metrics Configuration
            </h3>
          </div>

          {/* Origin Section */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-gray-150 space-y-3">
            <span className="text-[10px] font-mono font-extrabold text-gold-600 uppercase tracking-widest block">Cargo Origin / Collection Route</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Country *</label>
                <select
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
                <label className="text-[10px] font-bold text-gray-500 uppercase">State/Province *</label>
                <select
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
                <label className="text-[10px] font-bold text-gray-500 uppercase">City *</label>
                <select
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

          {/* Destination Section */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-gray-150 space-y-3">
            <span className="text-[10px] font-mono font-extrabold text-gold-600 uppercase tracking-widest block">Cargo Destination / Delivery Route</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Country *</label>
                <select
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
                <label className="text-[10px] font-bold text-gray-500 uppercase">State/Province *</label>
                <select
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
                <label className="text-[10px] font-bold text-gray-500 uppercase">City *</label>
                <select
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Freight Method */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Freight Method *</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
              >
                {METHODS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Declared Parcel Value */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Declared Cargo Value (USD) *</label>
              <input
                type="number"
                min="10"
                value={declaredValue}
                onChange={(e) => setDeclaredValue(Math.max(10, parseInt(e.target.value) || 10))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
              />
            </div>
          </div>

          {/* Cargo Weights & Dimensions Slider blocks */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-black uppercase tracking-wide">Physical Cargo Weight</span>
              <span className="font-mono font-bold text-gold-600">{weight} kg</span>
            </div>
            <input
              type="range"
              min="1"
              max="150"
              value={weight}
              onChange={(e) => setWeight(parseInt(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />

            <div className="grid grid-cols-3 gap-4 pt-2">
              {/* Length */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Length (cm)</label>
                <input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-black font-semibold text-center"
                />
              </div>

              {/* Width */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Width (cm)</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-black font-semibold text-center"
                />
              </div>

              {/* Height */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase">Height (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-black font-semibold text-center"
                />
              </div>
            </div>
            <span className="text-[9px] text-gray-400 leading-relaxed font-mono block">
              * Volumetric calculations are evaluated as L × W × H / 5000 conforming to global IATA regulations.
            </span>
          </div>
        </div>

        {/* Right Side: Estimated Outputs Bill of Lading */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-900 text-white rounded-3xl p-6.5 border border-neutral-800 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Calculator className="w-40 h-40 text-gold-500" />
            </div>

            <div className="relative z-10 space-y-1">
              <span className="text-[9px] font-mono tracking-widest text-gold-500 font-extrabold uppercase">Outbound Quotation</span>
              <h3 className="text-sm font-bold uppercase text-white">Freight Valuation Summary</h3>
            </div>

            {/* Weights analysis */}
            <div className="relative z-10 grid grid-cols-2 gap-4 border-b border-neutral-800 pb-4 text-xs font-mono">
              <div>
                <span className="text-neutral-500 text-[10px] uppercase block">Volumetric Weight</span>
                <span className="text-white font-bold">{volWeight} kg</span>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] uppercase block">Chargeable Weight</span>
                <span className="text-gold-500 font-bold">{chargeableWeight} kg</span>
              </div>
            </div>

            {/* Calculations breakout */}
            <div className="relative z-10 space-y-3.5 text-xs text-neutral-300">
              <div className="flex justify-between">
                <span>Base Carriage Freight:</span>
                <span className="font-mono text-white">${baseCostUSD} USD</span>
              </div>
              <div className="flex justify-between">
                <span>Customs Duties & Taxes:</span>
                <span className="font-mono text-white">${customsFeeUSD} USD</span>
              </div>
              <div className="flex justify-between">
                <span>Est. Dispatch Delivery:</span>
                <span className="font-bold text-gold-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {duration}
                </span>
              </div>
              <div className="border-t border-neutral-800 pt-4 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white uppercase">Estimated Total Cost</span>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-mono font-extrabold text-gold-500 block">
                    ${totalCostUSD} USD
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
                    ≈ {totalCostTMT} TMT (Turkmen Manat)
                  </span>
                </div>
              </div>
            </div>

            {/* Action button redirect */}
            <div className="relative z-10 pt-4">
              <button
                onClick={handleBookRedirect}
                className="w-full py-3.5 bg-gold-500 hover:bg-gold-600 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <span>Book This Parcel Now</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>

          {/* Legal notes */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-3">
            <div className="flex gap-2 items-start text-[11px] text-gray-500 leading-relaxed">
              <Info className="w-4.5 h-4.5 text-gold-600 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-bold text-black uppercase">Official Valuation Disclaimer</p>
                <p>
                  Prices evaluated above are indicators based on regular postal exchange rates and are subject to real-time validation upon physical measurement in our regional terminal branch sorting hubs. Volumetric parameters will apply.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
