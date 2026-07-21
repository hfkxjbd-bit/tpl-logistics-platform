import { Shipment, Notification } from "../../types";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "Courier" | "Handler" | "Operator" | "Customs Broker" | "Branch Manager";
  status: "Active" | "On Leave" | "Suspended";
  branch: string;
  companyEmail?: string;
  companyEmailPassword?: string;
  companyEmailQuota?: number; // GB
  companyEmailStatus?: "Active" | "Disabled";
  permissions?: {
    readShipments: boolean;
    writeShipments: boolean;
    approveBookings: boolean;
    deleteShipments: boolean;
    manageStaff: boolean;
    manageSettings: boolean;
  };
}

export interface CustomerAccount {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  country: string;
  state: string;
  city: string;
  createdAt: string;
}

export interface CustomerEmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  sentAt: string;
  status: "Sent" | "In Transit" | "Delivered" | "Opened";
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
  replied?: boolean;
  replyBody?: string;
}

export interface Branch {
  id: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  features: string;
  capacity: string;
}

export interface FAQ {
  q: string;
  a: string;
  category: string;
}

export interface CalculatorSettings {
  baseFee: number;
  perKgRate: number;
  expressMultiplier: number;
  airPremium: number;
  seaDiscount: number;
}

export interface WebContentSettings {
  heroTitle: string;
  heroSubtitle: string;
  supportPhone: string;
  operatingHours: string;
  announcement: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  operator: string;
  action: string;
  type: "info" | "action" | "warning" | "error";
  category: "Auth" | "Shipment" | "Database" | "Settings" | "System";
}

export interface PricingRule {
  id: string;
  country: string;
  code: string;
  baseMultiplier: number;
  transitDays: number;
}
