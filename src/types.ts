export enum ShipmentStatus {
  BOOKING_PENDING = "Booking Pending",
  CREATED = "Shipment Created",
  RECEIVED = "Package Received",
  PROCESSING = "Processing",
  CLEARED_CUSTOMS = "Cleared Customs",
  IN_TRANSIT = "In Transit",
  ARRIVED_DISTRIBUTION = "Arrived at Distribution Center",
  OUT_FOR_DELIVERY = "Out for Delivery",
  DELIVERED = "Delivered",
  FAILED = "Delivery Failed",
  RETURNED = "Returned to Sender",
  HELD_CUSTOMS = "Held at Customs",
}

export interface ShipmentHistory {
  id: string;
  status: ShipmentStatus;
  timestamp: string; // ISO date string
  location: string;
  description: string;
  lat?: number;
  lng?: number;
}

export interface Shipment {
  trackingNumber: string; // Used as the document ID too
  senderName: string;
  senderPhone: string;
  senderEmail?: string;
  receiverName: string;
  receiverPhone: string;
  receiverEmail?: string;
  originCountry: string;
  destinationCountry: string;
  parcelDescription: string;
  parcelWeight: number;
  shippingMethod: string; // e.g., "Standard", "Express Air", "Cargo Express"
  shippingDate: string; // YYYY-MM-DD
  expectedDeliveryDate: string; // YYYY-MM-DD
  currentLocation: string;
  status: ShipmentStatus;
  currentLat?: number;
  currentLng?: number;
  deliveryProofUrl?: string;
  notes?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  createdBy: string; // Admin User ID or "demo-admin"
  history: ShipmentHistory[];
}

export interface AdminUser {
  uid: string;
  email: string | null;
  name: string | null;
  isAdmin: boolean;
}

export interface Notification {
  id: string;
  trackingNumber: string;
  recipientEmail: string;
  recipientName: string;
  recipientType: "Sender" | "Receiver" | "Customer";
  subject: string;
  body: string;
  status: "Sent" | "Failed" | "Pending";
  timestamp: string; // ISO date string
  sentBy?: string;
  type?: string;
}

