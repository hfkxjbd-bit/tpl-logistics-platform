import React, { useState } from "react";
import { Shipment, ShipmentStatus } from "../../types";
import { Clock, Check, X, Search, Info, Mail, AlertTriangle } from "lucide-react";

interface BookingManagerProps {
  shipments: Shipment[];
  loading: boolean;
  onApproveBooking: (trackingNumber: string) => Promise<void>;
  onRejectBooking: (trackingNumber: string) => Promise<void>;
}

export default function BookingManager({
  shipments,
  loading,
  onApproveBooking,
  onRejectBooking
}: BookingManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const bookings = shipments.filter(s => s.status === ShipmentStatus.BOOKING_PENDING);

  const filteredBookings = bookings.filter(b => 
    b.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.receiverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAction = async (id: string, approve: boolean) => {
    setActionLoadingId(id);
    try {
      if (approve) {
        await onApproveBooking(id);
      } else {
        if (confirm("Are you sure you want to decline this booking request? This will mark the shipment as Failed/Cancelled.")) {
          await onRejectBooking(id);
        }
      }
    } catch (err) {
      console.error("Booking Action Failed:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Informative Header card */}
      <div className="bg-neutral-900 text-white rounded-2xl p-6 border border-neutral-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Clock className="w-48 h-48 text-gold-400" />
        </div>
        <div className="relative z-10">
          <span className="text-[10px] font-mono tracking-widest text-gold-500 font-extrabold block">LOGISTICS OPERATIONS</span>
          <h3 className="text-lg font-bold text-white mt-1">Customer Booking Requests</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            These parcel shipments have been registered digitally by visitors using the online booking form. 
            Once approved, the parcel enters active sorting and is expected for physical drop-off or courier pickup. An automated confirmation email is dispatched to the client instantly.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-150 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search booking requests by sequence ID, client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-black font-semibold focus:bg-white focus:ring-1 focus:ring-gold-500 transition-all"
          />
        </div>
        <div className="flex-shrink-0 text-xs font-mono text-gray-400">
          Found {filteredBookings.length} booking records
        </div>
      </div>

      {/* Bookings Table list */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-150">
                <th className="py-4 px-6 font-mono">BOOKING ID</th>
                <th className="py-4 px-6">SHIPPER (SENDER)</th>
                <th className="py-4 px-6">CONSIGNEE (RECEIVER)</th>
                <th className="py-4 px-6">PARCEL DETAILS</th>
                <th className="py-4 px-6">ROUTE (EST. ARRIVAL)</th>
                <th className="py-4 px-6 text-right">OPERATIONAL DECISION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <div className="w-6 h-6 border-2 border-gold-500 border-t-black rounded-full animate-spin mx-auto mb-2"></div>
                    <span className="font-mono text-[10px] tracking-wider">RETRIEVING CLIENT BOOKING STREAM...</span>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <Info className="w-8 h-8 mx-auto opacity-50 mb-2" />
                    <span>No pending customer booking records found.</span>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.trackingNumber} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-4.5 px-6 font-mono font-bold text-black text-sm">
                      <span>{b.trackingNumber}</span>
                      <span className="text-[10px] text-gray-400 font-normal block mt-0.5">
                        Log date: {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : "N/A"}
                      </span>
                    </td>
                    <td className="py-4.5 px-6">
                      <p className="font-semibold text-black uppercase">{b.senderName}</p>
                      <p className="text-[10px] text-gray-400">{b.senderPhone}</p>
                      {b.senderEmail && (
                        <p className="text-[10px] text-gold-600 flex items-center gap-1 mt-0.5 font-semibold">
                          <Mail className="w-3 h-3" />
                          {b.senderEmail}
                        </p>
                      )}
                    </td>
                    <td className="py-4.5 px-6">
                      <p className="font-semibold text-black uppercase">{b.receiverName}</p>
                      <p className="text-[10px] text-gray-400">{b.receiverPhone}</p>
                    </td>
                    <td className="py-4.5 px-6">
                      <p className="font-semibold text-black line-clamp-1">{b.parcelDescription}</p>
                      <p className="text-[10px] text-gray-400">
                        Weight: <strong className="text-black">{b.parcelWeight} kg</strong> | Method: {b.shippingMethod}
                      </p>
                    </td>
                    <td className="py-4.5 px-6 uppercase font-semibold text-[11px]">
                      <span className="text-gray-500">{b.originCountry}</span>
                      <span className="text-gold-600 px-1 font-bold">→</span>
                      <span className="text-black">{b.destinationCountry}</span>
                      <span className="text-[10px] text-gray-400 font-mono font-normal block mt-1 uppercase">
                        Expected Delivery: {b.expectedDeliveryDate}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleAction(b.trackingNumber, false)}
                          disabled={actionLoadingId !== null}
                          className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold px-3 py-2 rounded-xl border border-red-200/50 transition-all cursor-pointer text-[10px]"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline Request</span>
                        </button>
                        <button
                          onClick={() => handleAction(b.trackingNumber, true)}
                          disabled={actionLoadingId !== null}
                          className="flex items-center gap-1 bg-black text-gold-500 hover:bg-neutral-900 font-extrabold px-3.5 py-2 rounded-xl border border-neutral-800 transition-all cursor-pointer text-[10px]"
                        >
                          <Check className="w-3.5 h-3.5 text-gold-400" />
                          <span>Approve & Manifest</span>
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
  );
}
