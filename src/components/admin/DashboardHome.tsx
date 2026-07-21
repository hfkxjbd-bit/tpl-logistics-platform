import React, { useState } from "react";
import { Shipment, ShipmentStatus, Notification } from "../../types";
import { ContactMessage, SystemLog } from "./adminTypes";
import { 
  LayoutDashboard, BarChart2, FileCheck, DollarSign, Search,
  TrendingUp, Package, Clock, ShieldAlert, Download, RefreshCw, Mail
} from "lucide-react";

interface DashboardHomeProps {
  shipments: Shipment[];
  notifications: Notification[];
  contacts: ContactMessage[];
  systemLogs: SystemLog[];
  onTabSwitch: (tabId: string) => void;
  onApproveBooking?: (trackingNumber: string) => void;
  onRejectBooking?: (trackingNumber: string) => void;
  activeTab?: string;
}

export default function DashboardHome({
  shipments,
  notifications,
  contacts,
  systemLogs,
  onTabSwitch,
  onApproveBooking,
  onRejectBooking,
  activeTab = "home"
}: DashboardHomeProps) {
  const [statsPeriod, setStatsPeriod] = useState<"all" | "30" | "7">("all");
  const [reportsSearchQuery, setReportsSearchQuery] = useState("");

  // Dynamic Metrics (Real Calculations!)
  const totalShipments = shipments.length;
  const pendingBookings = shipments.filter(s => s.status === ShipmentStatus.BOOKING_PENDING);
  const activeParcels = shipments.filter(s => 
    ![ShipmentStatus.DELIVERED, ShipmentStatus.FAILED, ShipmentStatus.RETURNED, ShipmentStatus.BOOKING_PENDING].includes(s.status)
  );
  const deliveredParcels = shipments.filter(s => s.status === ShipmentStatus.DELIVERED);

  // Financial Estimation: Base fee $15 + $8 per kg
  const estimatedRevenue = shipments.reduce((sum, s) => {
    if (s.status === ShipmentStatus.FAILED) return sum;
    const base = 15;
    const weightFee = s.parcelWeight * 8;
    return sum + base + weightFee;
  }, 0);

  const averageWeight = totalShipments > 0 
    ? (shipments.reduce((sum, s) => sum + s.parcelWeight, 0) / totalShipments).toFixed(2)
    : "0.00";

  // CSV Exporter (Highly functional!)
  const handleExportCSV = () => {
    if (shipments.length === 0) {
      alert("No database records available to export.");
      return;
    }
    const headers = ["TrackingNumber", "Sender", "Receiver", "Origin", "Destination", "WeightKG", "Status", "ShippingDate", "ExpectedDelivery"];
    const csvRows = [headers.join(",")];
    
    shipments.forEach(s => {
      const row = [
        s.trackingNumber,
        `"${s.senderName.replace(/"/g, '""')}"`,
        `"${s.receiverName.replace(/"/g, '""')}"`,
        s.originCountry,
        s.destinationCountry,
        s.parcelWeight,
        s.status,
        s.shippingDate,
        s.expectedDeliveryDate
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tpl_logistics_report_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Destinations metrics
  const destinationMap: Record<string, number> = {};
  shipments.forEach(s => {
    destinationMap[s.destinationCountry] = (destinationMap[s.destinationCountry] || 0) + 1;
  });
  const topDestinations = Object.entries(destinationMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const filteredReportsShipments = shipments.filter(s => 
    s.trackingNumber.toLowerCase().includes(reportsSearchQuery.toLowerCase()) ||
    s.senderName.toLowerCase().includes(reportsSearchQuery.toLowerCase()) ||
    s.receiverName.toLowerCase().includes(reportsSearchQuery.toLowerCase()) ||
    s.status.toLowerCase().includes(reportsSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8" id="tpl-dashboard-home">
      {/* 1. Common KPI Bento Grid for Stats, Reports, and Home */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-gray-400 font-bold block uppercase">Total Handled Cargo</span>
            <h3 className="text-2xl font-bold text-black mt-1 font-mono">{totalShipments}</h3>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              100% cloud sync
            </span>
          </div>
          <div className="p-3 bg-neutral-900 text-gold-500 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-gray-400 font-bold block uppercase">Active In-Transit</span>
            <h3 className="text-2xl font-bold text-black mt-1 font-mono">{activeParcels.length}</h3>
            <span className="text-[10px] text-gold-600 font-semibold flex items-center gap-1 mt-1">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              Real-time transit
            </span>
          </div>
          <div className="p-3 bg-gold-50 text-gold-700 rounded-xl">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-gray-400 font-bold block uppercase">Pending Bookings</span>
            <h3 className="text-2xl font-bold text-black mt-1 font-mono">{pendingBookings.length}</h3>
            <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
              {pendingBookings.length > 0 ? "⚠️ Requires approval" : "All bookings cleared"}
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono tracking-wider text-gray-400 font-bold block uppercase">Estimated Revenue</span>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1 font-mono">${estimatedRevenue.toFixed(2)}</h3>
            <span className="text-[10px] text-gray-400 font-semibold block mt-1">
              Avg Weight: {averageWeight} kg
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Conditionally render screens depending on activeTab */}

      {/* VIEW A: WEBSITE STATISTICS */}
      {activeTab === "stats" && (
        <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-6 shadow-sm">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-black flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-gold-600" />
              Turkmenistan Post Regional Cargo Distribution Analytics
            </h3>
            <div className="flex gap-1.5 bg-gray-50 p-1 rounded-lg border border-gray-100">
              {(["all", "30", "7"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setStatsPeriod(p)}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                    statsPeriod === p ? "bg-black text-gold-500" : "text-gray-400 hover:text-black"
                  }`}
                >
                  {p === "all" ? "All" : p === "30" ? "30D" : "7D"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            {/* Destination Surcharges / Cargo by Country */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Cargo Volume By Country</h4>
              {topDestinations.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">No cargo routes mapped yet.</p>
              ) : (
                <div className="space-y-4">
                  {topDestinations.map(([country, count]) => {
                    const percentage = totalShipments > 0 ? (count / totalShipments) * 100 : 0;
                    return (
                      <div key={country} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold text-black">
                          <span className="uppercase">{country}</span>
                          <span className="font-mono">{count} parcels ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gold-500 rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Shipping Method Distribution */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Preferred Shipping Method</h4>
              <div className="space-y-4">
                {["Express Air", "Standard Cargo", "Road Freight", "Sea Freight"].map((method) => {
                  const count = shipments.filter(s => s.shippingMethod.toLowerCase().includes(method.toLowerCase().split(" ")[0])).length;
                  const percentage = totalShipments > 0 ? (count / totalShipments) * 100 : 0;
                  return (
                    <div key={method} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-black">
                        <span>{method}</span>
                        <span className="font-mono">{count} parcels ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: REPORTS & ANALYTICS */}
      {activeTab === "reports" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 flex-wrap gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                <FileCheck className="w-4.5 h-4.5 text-gold-600" />
                Global Manifest spreadsheet & Audit logs
              </h3>
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter manifest logs..."
                  value={reportsSearchQuery}
                  onChange={(e) => setReportsSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[10px] text-black font-semibold focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-neutral-50 text-gray-500 font-bold uppercase text-[9px] tracking-wider border-b border-gray-150">
                    <th className="py-2.5 px-4 font-mono">Tracking No</th>
                    <th className="py-2.5 px-4">Shipper</th>
                    <th className="py-2.5 px-4">Receiver</th>
                    <th className="py-2.5 px-4">Route</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {filteredReportsShipments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">No matching manifest files.</td>
                    </tr>
                  ) : (
                    filteredReportsShipments.map((s) => (
                      <tr key={s.trackingNumber} className="hover:bg-neutral-50/50">
                        <td className="py-2.5 px-4 font-mono font-bold text-black">{s.trackingNumber}</td>
                        <td className="py-2.5 px-4 truncate max-w-[120px]">{s.senderName}</td>
                        <td className="py-2.5 px-4 truncate max-w-[120px]">{s.receiverName}</td>
                        <td className="py-2.5 px-4 font-semibold uppercase">{s.originCountry} → {s.destinationCountry}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-extrabold bg-neutral-900 text-gold-500 border border-gold-400/10">
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gradient-to-br from-black to-neutral-900 text-white p-6 rounded-2xl border border-neutral-800 shadow-lg flex flex-col justify-between h-fit gap-6">
            <div className="space-y-4">
              <div className="p-2.5 bg-gold-500 text-black w-fit rounded-xl">
                <FileCheck className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-base tracking-tight text-gold-500">Corporate Export Hub</h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Compile full analytical archives containing active tracking records, client listings, and financial estimates.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-neutral-100 text-black font-extrabold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Generate System CSV Logs</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW C: STANDARD DASHBOARD OVERVIEW */}
      {activeTab === "home" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Columns: statistics and bookings */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Bookings Action Center */}
            <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold-600" />
                  Awaiting Booking Approvals ({pendingBookings.length})
                </h3>
                <button 
                  onClick={() => onTabSwitch("bookings")}
                  className="text-[10px] font-extrabold text-gold-600 hover:underline"
                >
                  View All
                </button>
              </div>

              {pendingBookings.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  No customer bookings currently pending.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto pr-1 space-y-3">
                  {pendingBookings.map((b) => (
                    <div key={b.trackingNumber} className="pt-3 first:pt-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="text-xs">
                        <span className="font-mono font-bold text-black text-sm block">{b.trackingNumber}</span>
                        <span className="text-gray-400 font-semibold block uppercase">
                          {b.senderName} ({b.originCountry} → {b.destinationCountry})
                        </span>
                        <span className="text-gray-500 font-mono text-[10px]">
                          Weight: {b.parcelWeight} kg | {b.shippingMethod}
                        </span>
                      </div>
                      {onApproveBooking && onRejectBooking && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => onRejectBooking(b.trackingNumber)}
                            className="px-2.5 py-1 bg-red-50 text-red-600 font-bold text-[10px] rounded-lg hover:bg-red-100 border border-red-200/40"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => onApproveBooking(b.trackingNumber)}
                            className="px-3 py-1 bg-black text-gold-500 font-bold text-[10px] rounded-lg hover:bg-neutral-900 border border-neutral-800"
                          >
                            Approve Cargo
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Website Statistics visualizations */}
            <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-gold-600" />
                  Logistics Metrics & Cargo Distribution
                </h3>
                <div className="flex gap-1.5 bg-gray-50 p-1 rounded-lg border border-gray-100">
                  {(["all", "30", "7"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setStatsPeriod(p)}
                      className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                        statsPeriod === p ? "bg-black text-gold-500" : "text-gray-400 hover:text-black"
                      }`}
                    >
                      {p === "all" ? "All" : p === "30" ? "30D" : "7D"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Destination Surcharges / Cargo by Country */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Cargo Volume By Country</h4>
                  {topDestinations.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">No cargo routes mapped yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {topDestinations.map(([country, count]) => {
                        const percentage = totalShipments > 0 ? (count / totalShipments) * 100 : 0;
                        return (
                          <div key={country} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-black">
                              <span className="uppercase">{country}</span>
                              <span>{count} parcels ({percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gold-500 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Shipping Method Distribution */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Preferred Shipping Method</h4>
                  <div className="space-y-3">
                    {["Express Air", "Standard Cargo", "Road Freight", "Sea Freight"].map((method) => {
                      const count = shipments.filter(s => s.shippingMethod.toLowerCase().includes(method.toLowerCase().split(" ")[0])).length;
                      const percentage = totalShipments > 0 ? (count / totalShipments) * 100 : 0;
                      return (
                        <div key={method} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-black">
                            <span>{method}</span>
                            <span>{count} parcels ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-black rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Quick stats logs, backup, support messages summary */}
          <div className="space-y-6">
            
            {/* Support Inquiries Preview */}
            <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gold-600" />
                  Visitor Messages ({contacts.length})
                </h3>
                <button 
                  onClick={() => onTabSwitch("contact_messages")}
                  className="text-[10px] font-extrabold text-gold-600 hover:underline"
                >
                  View All
                </button>
              </div>

              {contacts.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-xs">
                  No message logs available.
                </div>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {contacts.slice(0, 3).map((m) => (
                    <div key={m.id} className="p-2.5 bg-gray-50 rounded-xl text-[11px]">
                      <div className="flex justify-between font-bold text-black mb-1">
                        <span>{m.name}</span>
                        <span className="text-[9px] text-gray-400 font-mono">
                          {new Date(m.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gold-600 font-semibold mb-0.5">{m.subject}</p>
                      <p className="text-gray-500 line-clamp-2 italic">"{m.message}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick PDF/CSV Logs Exporter */}
            <div className="bg-gradient-to-br from-black to-neutral-900 text-white p-6 rounded-2xl border border-neutral-800 shadow-lg space-y-4">
              <div className="p-2 bg-gold-500 text-black w-fit rounded-lg">
                <FileCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm tracking-tight text-gold-500">Corporate Export Hub</h4>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Compile full analytical archives containing active tracking records, client listings, and financial estimates.
              </p>
              <button
                onClick={handleExportCSV}
                className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-neutral-100 text-black font-extrabold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Generate System CSV Logs</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
