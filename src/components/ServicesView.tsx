import React, { useState, useEffect } from "react";
import {
  Plane,
  Ship,
  Truck,
  Zap,
  Globe,
  Home,
  ShieldAlert,
  Archive,
  Layers,
  ArrowRight,
  Clock,
  Compass,
  FileText
} from "lucide-react";
import { motion } from "motion/react";

interface ServicesViewProps {
  initialServiceId?: string;
}

export default function ServicesView({ initialServiceId }: ServicesViewProps) {
  const [activeTab, setActiveTab] = useState(initialServiceId || "air");

  useEffect(() => {
    if (initialServiceId) {
      setActiveTab(initialServiceId);
    }
  }, [initialServiceId]);

  const serviceCategories = [
    {
      id: "air",
      name: "Air Freight",
      icon: Plane,
      tagline: "Priority Aviation Network for High-Speed Logistics",
      description: "Our Premium Air Freight services utilize central aviation terminals across Europe, Asia, and North America. We operate scheduled freight cargo lines with fast-track custom priority clearance directly to Ashgabat International Airport.",
      features: [
        "Express priority custom lanes at customs cargo terminals",
        "Fragile & secure electronic cargo safety storage",
        "Temperature-monitored pharmaceutical logistics",
        "Hazardous cargo handling by certified aviation loaders"
      ],
      pricing: "Rates from $4.50 / kg based on chargeable weight",
      transit: "2 - 5 Business Days globally",
      image: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: "sea",
      name: "Sea Freight",
      icon: Ship,
      tagline: "Global Ocean Container Shipping Networks",
      description: "Turkmenistanyn Poçtasy offers full-container load (FCL) and less-than-container load (LCL) consolidation maritime shipping routes. Serving Caspian Sea routes (via Turkmenbashi International Seaport) and global ocean channels.",
      features: [
        "LCL consolidation networks to optimize low-volume budget",
        "Heavy cargo and industrial machine loading support",
        "Global ocean vessel tracing with real-time tracking integration",
        "Port-to-door and door-to-port carriage configurations"
      ],
      pricing: "Rates from $1.20 / kg based on cargo volume",
      transit: "15 - 30 Business Days internationally",
      image: "https://images.unsplash.com/photo-1494412519320-aa613dfb7738?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: "road",
      name: "Road Freight",
      icon: Truck,
      tagline: "Silk Road Overland Freight and Cargo Trucking",
      description: "Our comprehensive road trucking network connects Ashgabat to neighboring Silk Road nations, Central Asia hubs, Turkey, and Europe. We utilize active fleet structures with certified container trucks.",
      features: [
        "FTL (Full Truckload) and LTL (Less-than-Truckload) shipping",
        "Cross-border custom documentation pre-cleared by drivers",
        "Double-driver expediting configurations for rapid transit",
        "GPS-enabled active cargo telemetry trackers on all trucks"
      ],
      pricing: "Rates from $0.80 / kg overland",
      transit: "3 - 7 Business Days regionally",
      image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: "express",
      name: "Express Delivery",
      icon: Zap,
      tagline: "Priority Express Dispatch and Courier Routing",
      description: "For highly urgent documents, letters, or small packets. We operate continuous premium dispatch couriers in major metropolitan regions within Turkmenistan and provide guaranteed next-day regional deliveries.",
      features: [
        "Guaranteed on-time delivery or 100% carriage refund",
        "Secure parcel locker integrations in local branches",
        "Direct hand-to-hand signed courier delivery protocols",
        "Instant SMS and email updates to recipient upon delivery"
      ],
      pricing: "Rates from 25 TMT flat-rate up to 2 kg domestically",
      transit: "Same-Day / Next-Day priority courier",
      image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: "intl",
      name: "International Shipping",
      icon: Globe,
      tagline: "Connecting Turkmenistan to 190+ Countries Globally",
      description: "As the national postal authority and central courier gateway, we provide outbound and inbound air shipping globally in coordination with international postal operators under standard UPU codes.",
      features: [
        "Universal Postal Union compliant shipping standards",
        "Simplified flat-rate packaging categories",
        "Automated digital declaration forms creation",
        "Unified global tracking numbers compatible with national post sites"
      ],
      pricing: "Dynamic based on destination zone and weight tiers",
      transit: "5 - 12 Business Days international standard",
      image: "https://images.unsplash.com/photo-1521791136368-1a46827d041c?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: "domestic",
      name: "Domestic Shipping",
      icon: Home,
      tagline: "Intra-Province Cargo Transport and Distribution",
      description: "We connect Ashgabat with Ahal, Mary, Lebap, Dashoguz, and Balkan provinces. Utilizing centralized overnight truck dispatch pipelines and local branch couriers to service remote districts.",
      features: [
        "Overnight transit between major provincial hubs",
        "Extremely economical postal rates for local commerce",
        "Cash-on-delivery (COD) option available for online shops",
        "Free pickup from local business warehouses"
      ],
      pricing: "Rates from 5 TMT per kg domestically",
      transit: "1 - 3 Business Days nationwide",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: "customs",
      name: "Customs Clearance",
      icon: ShieldAlert,
      tagline: "Licensed Regulatory Brokerage and Document Clearing",
      description: "Navigating complex state borders is simple with our licensed in-house customs brokers. We prepare HS code classification, duty calculations, import/export declarations, and border health certifications.",
      features: [
        "In-depth HS code lookup and cargo classification verification",
        "Direct liaison with State Customs Service of Turkmenistan",
        "Duty and tariff calculations prepared within 1 hour",
        "ATA Carnet processing for temporary event imports"
      ],
      pricing: "Fixed package rates per consignment starting at $85",
      transit: "Processed within 12 - 24 hours at border ports",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: "warehousing",
      name: "Warehousing",
      icon: Archive,
      tagline: "Secured Climatic Warehousing and Fulfillment Nodes",
      description: "Our warehouses feature multi-tier steel sorting racks, active CCTV security, temperature controls, and digital inventory database systems. Perfect for retail storage and local distribution center fulfillment.",
      features: [
        "Temperature and humidity controls for perishable food/medicines",
        "Inventory tracking with real-time API integrations",
        "24/7 armed guard security with automated fire suppression systems",
        "Cross-docking and container destuffing capabilities"
      ],
      pricing: "Flexible monthly storage rates based on pallet footprint",
      transit: "Immediate inventory logging and same-day dispatching",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop"
    },
    {
      id: "packaging",
      name: "Packaging Services",
      icon: Layers,
      tagline: "Professional Industrial Crating and Packing Safeguards",
      description: "We construct custom shock-absorbent wooden crates, heavy-duty cardboard boxes, ESD static shielding layers, and thermal wraps to ensure fragile cargo remains completely undamaged during transit.",
      features: [
        "Custom heavy-duty wooden crates built for heavy machinery",
        "Anti-static ESD packaging for sensitive silicon motherboards",
        "Thermal insulation wraps for climate-sensitive goods",
        "Full transit damage compensation guarantee on packaged parcels"
      ],
      pricing: "Rates start from 10 TMT depending on dimensions and wood used",
      transit: "Packaging prepared on-site in under 20 minutes",
      image: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?q=80&w=800&auto=format&fit=crop"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 font-sans">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <span className="text-[10px] font-mono font-extrabold text-gold-600 uppercase tracking-widest block">TURKMENISTAN POST FREIGHT SERVICES</span>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-black tracking-tight uppercase">
          Shipping & Logistics Capabilities
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Turkmenistanyn Poçtasy Limited provides world-class distribution channels. Toggle the service categories below to view custom features, exact pricing, and transit structures.
        </p>
      </div>

      {/* Main Tabbed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar Selector */}
        <div className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-4 shadow-xs space-y-2.5">
          <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider block px-2.5">Freight Services Registry</span>
          <div className="space-y-1">
            {serviceCategories.map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-black text-gold-500 shadow-sm"
                      : "text-gray-500 hover:text-black hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComp className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </div>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform ${activeTab === tab.id ? "translate-x-1" : "opacity-30"}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Service Content Canvas */}
        <div className="lg:col-span-8">
          {serviceCategories.map((cat) => {
            if (cat.id !== activeTab) return null;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8"
              >
                {/* Visual Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gold-100 text-gold-700 flex items-center justify-center font-bold">
                        <cat.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-gold-600 uppercase tracking-widest">
                        TPL LOGISTICS HUB
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-black uppercase tracking-tight">
                      {cat.name}
                    </h2>
                    <p className="text-xs text-gray-500 font-bold leading-relaxed italic border-l-2 border-gold-500 pl-3">
                      "{cat.tagline}"
                    </p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  {/* Representative Image with referer policy */}
                  <div className="rounded-2xl overflow-hidden border border-gray-150 shadow-xs aspect-video bg-gray-50">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Technical Characteristics & Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 rounded-2xl p-6 border border-gray-150/60">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-wider block">Est. Transit Duration</span>
                    <div className="flex items-center gap-2 text-xs font-bold text-black">
                      <Clock className="w-4.5 h-4.5 text-gold-600" />
                      <span>{cat.transit}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-wider block">Estimated Tariffs</span>
                    <div className="flex items-center gap-2 text-xs font-bold text-black">
                      <FileText className="w-4.5 h-4.5 text-gold-600" />
                      <span>{cat.pricing}</span>
                    </div>
                  </div>
                </div>

                {/* Core Features list */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-black uppercase tracking-wider">
                    Core Operational Specifications
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {cat.features.map((feat, fidx) => (
                      <div key={fidx} className="flex gap-2.5 items-start">
                        <div className="w-4.5 h-4.5 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 border border-green-200/40">
                          ✓
                        </div>
                        <span className="text-xs text-gray-600 leading-relaxed">
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA booking linking */}
                <div className="pt-6 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4 text-xs font-bold">
                  <span className="text-gray-400 text-[10px] font-mono">
                    All operations are UPU-ISO certified
                  </span>
                  <button
                    onClick={() => {
                      // Navigate to Booking Page and pre-fill selected service
                      const url = new URL(window.location.href);
                      url.searchParams.set("service", cat.id);
                      window.history.pushState({}, "", url);
                      const customEvent = new CustomEvent("tpl-navigate", { detail: { tab: "book", service: cat.id } });
                      window.dispatchEvent(customEvent);
                    }}
                    className="px-5 py-3 bg-black hover:bg-neutral-900 text-gold-500 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>Book Shipment under this Service</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
