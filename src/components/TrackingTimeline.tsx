import React from "react";
import { Shipment, ShipmentStatus, ShipmentHistory } from "../types";
import { Check, Clock, AlertTriangle, AlertOctagon, CornerUpLeft, MapPin } from "lucide-react";
import { motion } from "motion/react";

interface TrackingTimelineProps {
  shipment: Shipment;
}

// Healthy chronological progression of delivery statuses for the progress bar
const PROGRESS_STEPS = [
  ShipmentStatus.CREATED,
  ShipmentStatus.RECEIVED,
  ShipmentStatus.PROCESSING,
  ShipmentStatus.CLEARED_CUSTOMS,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.ARRIVED_DISTRIBUTION,
  ShipmentStatus.OUT_FOR_DELIVERY,
  ShipmentStatus.DELIVERED,
];

export default function TrackingTimeline({ shipment }: TrackingTimelineProps) {
  // Get active index for progress bar
  const currentStatus = shipment.status;
  const isExceptionalStatus = [
    ShipmentStatus.FAILED,
    ShipmentStatus.RETURNED,
    ShipmentStatus.HELD_CUSTOMS,
  ].includes(currentStatus);

  // If status is exceptional, find equivalent healthy status index to render progress bar up to that point
  let activeStepIndex = PROGRESS_STEPS.indexOf(currentStatus);
  if (activeStepIndex === -1) {
    if (currentStatus === ShipmentStatus.HELD_CUSTOMS) {
      activeStepIndex = PROGRESS_STEPS.indexOf(ShipmentStatus.CLEARED_CUSTOMS); // before clearance
    } else if (currentStatus === ShipmentStatus.FAILED) {
      activeStepIndex = PROGRESS_STEPS.indexOf(ShipmentStatus.OUT_FOR_DELIVERY); // out for delivery step
    } else if (currentStatus === ShipmentStatus.RETURNED) {
      activeStepIndex = PROGRESS_STEPS.indexOf(ShipmentStatus.IN_TRANSIT); // return phase
    }
  }

  // Calculate progress percent
  const progressPercent = Math.min(
    100,
    Math.max(0, (activeStepIndex / (PROGRESS_STEPS.length - 1)) * 100)
  );

  const getStatusIcon = (status: ShipmentStatus) => {
    switch (status) {
      case ShipmentStatus.DELIVERED:
        return <Check className="w-4 h-4 text-white" />;
      case ShipmentStatus.FAILED:
        return <AlertOctagon className="w-4 h-4 text-white" />;
      case ShipmentStatus.HELD_CUSTOMS:
        return <AlertTriangle className="w-4 h-4 text-white" />;
      case ShipmentStatus.RETURNED:
        return <CornerUpLeft className="w-4 h-4 text-white" />;
      default:
        return <Clock className="w-4 h-4 text-white" />;
    }
  };

  const getStatusColor = (status: ShipmentStatus) => {
    switch (status) {
      case ShipmentStatus.DELIVERED:
        return "bg-black text-gold-500 border-gold-500";
      case ShipmentStatus.FAILED:
        return "bg-red-600 text-white border-red-600";
      case ShipmentStatus.HELD_CUSTOMS:
        return "bg-amber-500 text-black border-amber-500";
      case ShipmentStatus.RETURNED:
        return "bg-gray-800 text-white border-gray-800";
      default:
        return "bg-gold-500 text-black border-gold-500";
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        time: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      };
    } catch {
      return { date: isoString, time: "" };
    }
  };

  return (
    <div id="tracking-timeline-container" className="space-y-8">
      {/* Visual Progress Bar Component */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase mb-8">
          Delivery Progress
        </h3>

        {/* Horizontal Timeline (Desktop) / Vertical (Mobile) */}
        <div className="relative mb-6">
          {/* Progress Track Background */}
          <div className="absolute top-4 left-0 w-full h-1 bg-gray-100 rounded-full hidden md:block"></div>
          {/* Progress Track Active */}
          <div
            className="absolute top-4 left-0 h-1 bg-gradient-to-r from-black via-gold-500 to-gold-400 rounded-full transition-all duration-1000 hidden md:block"
            style={{ width: `${progressPercent}%` }}
          ></div>

          {/* Steps */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative gap-6 md:gap-2">
            {PROGRESS_STEPS.map((step, idx) => {
              const isCompleted = idx <= activeStepIndex && !isExceptionalStatus;
              const isCurrent = step === currentStatus;

              return (
                <div key={step} className="flex md:flex-col items-center gap-4 md:gap-2 md:text-center flex-1">
                  {/* Circle Pin */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-500 ${
                      isCurrent
                        ? getStatusColor(step) + " ring-4 ring-gold-100 scale-110"
                        : isCompleted
                        ? "bg-gold-500 border-gold-500 text-black"
                        : "bg-white border-gray-200 text-gray-400"
                    }`}
                  >
                    {isCurrent ? (
                      getStatusIcon(step)
                    ) : isCompleted ? (
                      <Check className="w-4 h-4 text-black font-bold" />
                    ) : (
                      <span className="text-xs font-mono font-bold">{idx + 1}</span>
                    )}
                  </div>

                  {/* Text labels */}
                  <div className="flex flex-col md:items-center">
                    <span
                      className={`text-xs md:text-[11px] lg:text-xs font-semibold ${
                        isCurrent
                          ? "text-black font-bold"
                          : isCompleted
                          ? "text-gray-700"
                          : "text-gray-400"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error / Warning Alert for Exceptional Statuses */}
        {isExceptionalStatus && (
          <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200 flex gap-3 items-center text-amber-800">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Action / Exception Notice</p>
              <p className="text-xs text-amber-700">
                This parcel is currently in state <strong className="underline">{currentStatus}</strong>.
                Our custom support team is actively tracking this item.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delivery History List */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase mb-6">
          Detailed Shipment History
        </h3>

        {shipment.history && shipment.history.length > 0 ? (
          <div className="relative pl-6 border-l border-gray-200 space-y-8">
            {shipment.history
              .slice()
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Newest first
              .map((item, idx) => {
                const { date, time } = formatDateTime(item.timestamp);
                const isNewest = idx === 0;

                return (
                  <motion.div
                    key={item.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative"
                  >
                    {/* Ring Node */}
                    <div
                      className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 ${
                        isNewest
                          ? "bg-black border-gold-500 ring-4 ring-gold-100 animate-pulse"
                          : "bg-white border-gray-300"
                      }`}
                    ></div>

                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-sm font-bold tracking-tight ${
                              isNewest ? "text-black" : "text-gray-700"
                            }`}
                          >
                            {item.status}
                          </span>
                          {item.location && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              <MapPin className="w-3 h-3 text-gold-600" />
                              {item.location}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                      </div>

                      {/* Timestamp labels */}
                      <div className="text-left sm:text-right font-mono flex-shrink-0">
                        <p className="text-xs text-black font-bold">{date}</p>
                        <p className="text-[10px] text-gray-400">{time}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No historical tracking records logged yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
