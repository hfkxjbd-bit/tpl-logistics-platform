import React, { useState } from "react";
import {
  Plane,
  Ship,
  Truck,
  Search,
  Globe,
  ShieldCheck,
  Zap,
  ArrowRight,
  Anchor,
  Box,
  MapPin,
  Clock,
  Phone,
  Briefcase,
  Layers,
  FileCheck
} from "lucide-react";
import { motion } from "motion/react";

interface HomeViewProps {
  onNavigate: (tab: string, param?: string) => void;
  onInstantTrack: (num: string) => void;
}

export default function HomeView({ onNavigate, onInstantTrack }: HomeViewProps) {
  const [quickTrackInput, setQuickTrackInput] = useState("");

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickTrackInput.trim()) {
      onInstantTrack(quickTrackInput.trim());
    }
  };

  const services = [
    {
      id: "air",
      title: "Air Freight Forwarding",
      desc: "Fast-tracked global aviation cargo for time-sensitive logistics.",
      icon: Plane,
      time: "2-4 Business Days"
    },
    {
      id: "sea",
      title: "Maritime Sea Freight",
      desc: "Cost-effective containerized deep-sea logistics and cargo solutions.",
      icon: Ship,
      time: "15-30 Business Days"
    },
    {
      id: "road",
      title: "Overland Road Freight",
      desc: "Inter-city cargo trucking networks covering the Silk Road region.",
      icon: Truck,
      time: "3-7 Business Days"
    }
  ];

  const features = [
    {
      title: "Secure Custom Cleared",
      desc: "Seamless regulatory customs document clearance handled by our dedicated licensed brokers.",
      icon: ShieldCheck
    },
    {
      title: "Express Delivery",
      desc: "Priority same-day or next-day courier networks across major national cities.",
      icon: Zap
    },
    {
      title: "Secured Warehousing",
      desc: "Climate-controlled, 24/7 guarded logistic storage & local distribution nodes.",
      icon: Layers
    }
  ];

  return (
    <div className="font-sans space-y-16">
      {/* 1. Brand Hero Section */}
      <section className="relative bg-black text-white py-24 px-4 overflow-hidden border-b border-neutral-900">
        {/* Subtle geometric background grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:16px_16px] opacity-25"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Headline Copy */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-full text-[10px] font-mono uppercase font-bold tracking-widest text-gold-500">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-ping"></span>
              Silk Road Logistics Gateway
            </span>
            <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight leading-[1.1]">
              Connecting <span className="text-gold-500">Turkmenistan</span> <br />
              to Global Logistics.
            </h1>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-xl">
              Turkmenistanyn Poçtasy Limited provides state-of-the-art secure air, ocean, and land freight. Track parcels or book shipments with live regulatory verification protocols instantly.
            </p>

            {/* Quick Tracking Bar */}
            <form onSubmit={handleTrackSubmit} className="pt-2 max-w-lg">
              <div className="bg-neutral-900 p-2 rounded-2xl border border-neutral-800 flex items-center gap-2 shadow-2xl">
                <div className="pl-3 text-neutral-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Enter Tracking Number (e.g. TPL-2026...)"
                  value={quickTrackInput}
                  onChange={(e) => setQuickTrackInput(e.target.value)}
                  className="flex-1 bg-transparent border-none text-white text-xs py-2 px-1 focus:outline-none placeholder-neutral-500 font-mono font-bold"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gold-500 hover:bg-gold-600 text-black text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-lg whitespace-nowrap"
                >
                  Track Parcel
                </button>
              </div>
              <span className="text-[10px] text-neutral-500 font-mono mt-2 block">
                Format: TPL-YYYYMMDD-XXXXXX • Live 2026 tracing active
              </span>
            </form>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate("calculator")}
                className="px-5 py-3 bg-white text-black font-extrabold rounded-xl text-xs hover:bg-gray-100 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Shipping Cost Calculator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate("book")}
                className="px-5 py-3 bg-neutral-900 hover:bg-neutral-800 text-gold-500 font-bold border border-neutral-800 rounded-xl text-xs transition-all cursor-pointer"
              >
                Book a New Shipment
              </button>
            </div>
          </div>

          {/* Graphical Dashboard Panel */}
          <div className="lg:col-span-5 relative">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-[9px] font-mono text-neutral-500">TPL CENTRAL TERMINAL SERVER</span>
              </div>

              {/* Grid with visual metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/50">
                  <span className="text-[9px] font-mono text-neutral-500 block uppercase">Transit Nodes</span>
                  <span className="text-xl font-bold font-mono text-white">45 Active</span>
                  <span className="text-[9px] text-green-500 font-bold block mt-1">● +12% Central Asia</span>
                </div>
                <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/50">
                  <span className="text-[9px] font-mono text-neutral-500 block uppercase">Monthly Cargo</span>
                  <span className="text-xl font-bold font-mono text-gold-500">12,450 T</span>
                  <span className="text-[9px] text-green-500 font-bold block mt-1">● Verified ISO</span>
                </div>
              </div>

              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800/50 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-neutral-400">Ashgabat Hub Outbound</span>
                  <span className="text-gold-500 font-bold">99.8% On-Time</span>
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-gold-500 to-amber-500 h-1.5 rounded-full" style={{ width: "99.8%" }}></div>
                </div>
              </div>

              {/* Live activity simulator lines */}
              <div className="space-y-1.5 font-mono text-[9px] text-neutral-500">
                <p className="flex items-center gap-1.5">
                  <span className="text-green-500">▶</span>
                  <span>[07-20 12:35] TPL-20260718-000003 Cleared Customs • Ashgabat Air Cargo Hub</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="text-green-500">▶</span>
                  <span>[07-20 12:21] TPL-20260719-000001 Dispatched for Transit • Mary District</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. core Freight Services Grid */}
      <section className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono font-extrabold text-gold-600 uppercase tracking-widest block">SERVICES ROADMAP</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-black tracking-tight uppercase">
            Tailored Shipping & Freight Capabilities
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto">
            From heavy-load ocean shipping containers to expedited domestic parcel couriers. Select the solution that drives your cargo on budget.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((s, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-150 rounded-3xl p-6.5 hover:border-gold-500 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="w-11 h-11 bg-gray-50 group-hover:bg-black rounded-2xl flex items-center justify-center text-black group-hover:text-gold-500 border border-gray-150 transition-all shadow-xs">
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-black group-hover:text-gold-600 transition-colors uppercase">
                    {s.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-100/60 mt-6 flex justify-between items-center text-[10px] font-mono font-bold text-gray-400">
                <span>EST: {s.time}</span>
                <button
                  onClick={() => onNavigate("services", s.id)}
                  className="flex items-center gap-1 text-black hover:text-gold-600 transition-colors cursor-pointer"
                >
                  Details <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => onNavigate("services")}
            className="px-6 py-3 bg-black hover:bg-neutral-900 text-gold-500 font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Explore All 9 Freight & Storage Services</span>
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 3. Competitive Advantages (Bento Accent) */}
      <section className="bg-gray-100/60 border-y border-gray-150 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4 space-y-4">
            <span className="text-[10px] font-mono font-extrabold text-gold-600 uppercase tracking-widest block">WHY TURKMENISTAN POST?</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-black tracking-tight leading-tight uppercase">
              Reliable, Certified, Global Carriage
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              We operate strictly under the Universal Postal Union (UPU) frameworks, coordinating security clearance protocols with major global carriers.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate("about")}
                className="text-xs font-bold text-black hover:text-gold-600 underline flex items-center gap-2 cursor-pointer"
              >
                Read our company history & credentials
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {features.map((f, idx) => (
              <div key={idx} className="bg-white border border-gray-150 rounded-2xl p-6.5 space-y-3.5 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center border border-gold-200/40">
                  <f.icon className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-xs font-bold text-black uppercase tracking-wide">{f.title}</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Active Regional Branches Selector Teaser */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="text-[10px] font-mono font-extrabold text-gold-600 uppercase tracking-widest block">REGIONAL SERVICE BRANCHES</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-black tracking-tight uppercase">
            Serving Every Province of Turkmenistan
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            With centralized postal terminals in Ashgabat, Mary, Turkmenabat, Dashoguz, and Balkanabat, we ensure safe parcel dropoffs and expedited dispatching lines across the state.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white border border-gray-150 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono text-gray-400 font-bold block">Central Terminal</span>
              <span className="text-xs font-bold text-black block">Ashgabat HQ Node</span>
              <span className="text-[10px] text-gray-500 leading-relaxed block">Mollanepes St, Ashgabat</span>
            </div>
            <div className="p-4 bg-white border border-gray-150 rounded-2xl space-y-1">
              <span className="text-[10px] font-mono text-gray-400 font-bold block">Caspian Gateway</span>
              <span className="text-xs font-bold text-black block">Balkanabat Branch</span>
              <span className="text-[10px] text-gray-500 leading-relaxed block">Gurbansoltan Eje Ave</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate("branches")}
              className="px-5 py-3 bg-black hover:bg-neutral-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
            >
              <span>View All Branches, Hours, & Maps</span>
              <MapPin className="w-4 h-4 text-gold-500" />
            </button>
          </div>
        </div>

        {/* Dynamic Graphic Mock Illustration with referer policy */}
        <div className="relative rounded-3xl overflow-hidden border border-gray-200 aspect-video lg:aspect-square bg-gray-150">
          <img
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop"
            alt="Logistics Cargo Warehouse Turkmenistan Post"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter grayscale contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
            <div className="space-y-1.5 text-white max-w-sm">
              <span className="text-[9px] font-mono text-gold-500 font-bold tracking-widest block">REGULATORY TRUST</span>
              <h4 className="text-sm font-bold uppercase">Ashgabat Automated Sort Facility</h4>
              <p className="text-[10px] text-neutral-300 leading-relaxed">
                Our main warehouse is certified for fragile item processing, hazardous cargo handling, and high-value secure storage lockers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pricing CTA and Career Teaser Banner */}
      <section className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-gradient-to-r from-neutral-900 to-black text-white rounded-3xl p-8 sm:p-12 border border-neutral-800 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-96 h-96 bg-gold-500/5 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="md:col-span-8 space-y-4">
            <span className="text-[9px] font-mono tracking-widest text-gold-500 font-extrabold block">JOIN THE LEADING LOGISTICS NETWORK</span>
            <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wide">
              Work with us at Turkmenistanyn Poçtasy
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xl">
              We are constantly seeking brilliant customs consultants, supply chain analysts, certified couriers, and cloud infrastructure engineers to build our digital logistics pipelines.
            </p>
          </div>

          <div className="md:col-span-4 flex justify-start md:justify-end">
            <button
              onClick={() => onNavigate("careers")}
              className="px-6 py-3.5 bg-gold-500 hover:bg-gold-600 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg"
            >
              <Briefcase className="w-4 h-4 text-black" />
              <span>Explore Active Careers</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
