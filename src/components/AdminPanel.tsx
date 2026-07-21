import React, { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy
} from "firebase/firestore";
import { Shipment, ShipmentStatus, ShipmentHistory, AdminUser, Notification } from "../types";
import { ContactMessage, SystemLog } from "./admin/adminTypes";
import CompanyLogo from "./CompanyLogo";

// Import modular dashboard components
import DashboardHome from "./admin/DashboardHome";
import BookingManager from "./admin/BookingManager";
import ShipmentList from "./admin/ShipmentList";
import GeneratorAndTools from "./admin/GeneratorAndTools";
import CustomerStaffManager from "./admin/CustomerStaffManager";
import WebsiteContentManager from "./admin/WebsiteContentManager";
import SystemSettings from "./admin/SystemSettings";
import ShipmentLocationManagement from "./admin/ShipmentLocationManagement";

// Import Lucide Icons
import {
  LayoutDashboard, BarChart2, BookOpen, Truck, History, Key, Users, User,
  ShieldAlert, RefreshCw, Scale, DollarSign, Activity, Mail, Settings2,
  FileCheck, Globe, Info, MapPin, MessageSquare, HelpCircle, Shield,
  Database, Clock, Download, Settings, LogOut, Menu, X, Search
} from "lucide-react";

interface AdminPanelProps {
  user: AdminUser;
  onLogout: () => void;
}

export default function AdminPanel({ user, onLogout }: AdminPanelProps) {
  // Navigation states
  const [activeTab, setActiveTab] = useState<string>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tabQuery, setTabQuery] = useState("");

  // Data states
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  
  // Loading indicators
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 26 Requested Dashboard Sections (Tab definitions with distinct icons!)
  const ALL_TABS = [
    { id: "home", label: "Dashboard Home", icon: LayoutDashboard, category: "Core" },
    { id: "stats", label: "Website Statistics", icon: BarChart2, category: "Core" },
    { id: "bookings", label: "Booking Management", icon: BookOpen, category: "Core" },
    { id: "shipments", label: "Shipment Management", icon: Truck, category: "Core" },
    { id: "tracking", label: "Parcel Tracking Management", icon: History, category: "Core" },
    { id: "generator", label: "Tracking Number Generator", icon: Key, category: "Utility" },
    { id: "customers", label: "Customer Management", icon: Users, category: "Directory" },
    { id: "staff", label: "Staff Management", icon: User, category: "Directory" },
    { id: "users", label: "User Accounts", icon: ShieldAlert, category: "Security" },
    { id: "updates", label: "Delivery Status Updates", icon: RefreshCw, category: "Utility" },
    { id: "calculator", label: "Shipping Calculator Settings", icon: Scale, category: "Settings" },
    { id: "pricing", label: "Pricing Management", icon: DollarSign, category: "Settings" },
    { id: "live", label: "Live Tracking Updates", icon: Activity, category: "Utility" },
    { id: "notifications", label: "Notification Center", icon: Mail, category: "Communication" },
    { id: "email_sms", label: "Email & SMS Settings", icon: Settings2, category: "Communication" },
    { id: "reports", label: "Reports & Analytics", icon: FileCheck, category: "Core" },
    { id: "content", label: "Website Content Manager", icon: Globe, category: "Content" },
    { id: "company_info", label: "Company Information", icon: Info, category: "Content" },
    { id: "branches", label: "Branch Management", icon: MapPin, category: "Content" },
    { id: "contact_messages", label: "Contact Messages", icon: MessageSquare, category: "Communication" },
    { id: "faq", label: "FAQ Management", icon: HelpCircle, category: "Content" },
    { id: "security", label: "Security Settings", icon: Shield, category: "Security" },
    { id: "database", label: "Database Manager", icon: Database, category: "Security" },
    { id: "logs", label: "System Logs", icon: Clock, category: "Security" },
    { id: "backup_restore", label: "Backup & Restore", icon: Download, category: "Utility" },
    { id: "profile", label: "Profile Settings", icon: Settings, category: "Settings" },
  ];

  // Fetch Firestore dataset on load
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Shipments
      const shipmentsQ = query(collection(db, "shipments"), orderBy("createdAt", "desc"));
      const shipmentsSnap = await getDocs(shipmentsQ);
      const fetchedShipments: Shipment[] = [];
      shipmentsSnap.forEach((doc) => {
        fetchedShipments.push(doc.data() as Shipment);
      });
      setShipments(fetchedShipments);

      // 2. Notifications log
      const notifQ = query(collection(db, "notifications"), orderBy("timestamp", "desc"));
      const notifSnap = await getDocs(notifQ);
      const fetchedNotifs: Notification[] = [];
      notifSnap.forEach((doc) => {
        fetchedNotifs.push(doc.data() as Notification);
      });
      setNotifications(fetchedNotifs);

      // 3. Contact Messages
      const contactSnap = await getDocs(collection(db, "contacts"));
      const fetchedContacts: ContactMessage[] = [];
      contactSnap.forEach((doc) => {
        const d = doc.data();
        fetchedContacts.push({
          id: doc.id,
          name: d.name || "Anonymous",
          email: d.email || "N/A",
          subject: d.subject || "No Subject",
          message: d.message || "",
          timestamp: d.timestamp || new Date().toISOString(),
          replied: d.replied || false,
          replyBody: d.replyBody || ""
        });
      });
      // Sort contact messages by timestamp desc
      fetchedContacts.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setContacts(fetchedContacts);

    } catch (err) {
      console.error("Failed to query central Firestore logistics nodes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // System Audit Logger helper
  const appendSystemLog = (action: string, category: SystemLog["category"], type: SystemLog["type"] = "info") => {
    const newLog: SystemLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      operator: user.email || "operator-session",
      action: action,
      type: type,
      category: category
    };
    setSystemLogs(prev => [newLog, ...prev]);
  };

  // CRUD operation triggers
  const handleSaveShipment = async (updatedShipment: Shipment, isNew: boolean) => {
    setActionLoading(true);
    try {
      await setDoc(doc(db, "shipments", updatedShipment.trackingNumber), updatedShipment);
      
      // Auto-trigger alerts simulation if status shifted
      if (updatedShipment.senderEmail || updatedShipment.receiverEmail) {
        await triggerNotificationAlerts(updatedShipment);
      }

      appendSystemLog(
        `${isNew ? "Created" : "Modified"} shipment manifest ${updatedShipment.trackingNumber}`,
        "Shipment",
        isNew ? "action" : "info"
      );
      
      await fetchData();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteShipment = async (trackingNo: string) => {
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "shipments", trackingNo));
      appendSystemLog(`Deleted cargo profile manifest ${trackingNo}`, "Shipment", "warning");
      await fetchData();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  // Notification simulator
  const triggerNotificationAlerts = async (shipment: Shipment) => {
    const recipients = [];
    if (shipment.senderEmail) {
      recipients.push({ email: shipment.senderEmail, name: shipment.senderName, type: "Sender" });
    }
    if (shipment.receiverEmail) {
      recipients.push({ email: shipment.receiverEmail, name: shipment.receiverName, type: "Receiver" });
    }

    for (const r of recipients) {
      const notifId = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const payload: Notification = {
        id: notifId,
        trackingNumber: shipment.trackingNumber,
        recipientEmail: r.email,
        recipientName: r.name,
        recipientType: r.type as any,
        subject: `[TPL Poçtasy] Status Alert: ${shipment.trackingNumber} shifted to ${shipment.status}`,
        body: `Salom ${r.name}, your shipment's active carriage status was logged as: ${shipment.status}. Current sorting location: ${shipment.currentLocation}.`,
        status: "Sent",
        timestamp: new Date().toISOString()
      };

      try {
        await setDoc(doc(db, "notifications", notifId), payload);
      } catch (err) {
        console.error("Alert log save failed:", err);
      }
    }
  };

  const handleApproveBooking = async (trackingNo: string) => {
    const original = shipments.find(s => s.trackingNumber === trackingNo);
    if (!original) return;

    const nowIso = new Date().toISOString();
    const updated: Shipment = {
      ...original,
      status: ShipmentStatus.CREATED,
      currentLocation: "Ashgabat Airport Sorting Terminal",
      updatedAt: nowIso,
      history: [
        ...original.history,
        {
          id: `hist-${Date.now()}-ok`,
          status: ShipmentStatus.CREATED,
          timestamp: nowIso,
          location: "Ashgabat Cargo Hub",
          description: "Online Booking manifest formally APPROVED by administrators. Sorting sequence initiated."
        }
      ]
    };

    await handleSaveShipment(updated, false);
    appendSystemLog(`Approved customer cargo booking request ${trackingNo}`, "Shipment", "action");
  };

  const handleRejectBooking = async (trackingNo: string) => {
    const original = shipments.find(s => s.trackingNumber === trackingNo);
    if (!original) return;

    const nowIso = new Date().toISOString();
    const updated: Shipment = {
      ...original,
      status: ShipmentStatus.FAILED,
      updatedAt: nowIso,
      history: [
        ...original.history,
        {
          id: `hist-${Date.now()}-fail`,
          status: ShipmentStatus.FAILED,
          timestamp: nowIso,
          location: "Admin Desk",
          description: "Booking request declined by Turkmenistan Post administrative review."
        }
      ]
    };

    await handleSaveShipment(updated, false);
    appendSystemLog(`Declined cargo booking request ${trackingNo}`, "Shipment", "warning");
  };

  const handleReplyToContact = async (messageId: string, replyText: string) => {
    try {
      await setDoc(doc(db, "contacts", messageId), {
        replied: true,
        replyBody: replyText
      }, { merge: true });

      // Simulated alert
      const notifId = `notif-${Date.now()}-rep`;
      const originalContact = contacts.find(c => c.id === messageId);
      if (originalContact) {
        await setDoc(doc(db, "notifications", notifId), {
          id: notifId,
          trackingNumber: "SUPPORT-REPLY",
          recipientEmail: originalContact.email,
          recipientName: originalContact.name,
          recipientType: "Sender",
          subject: `RE: [Turkmenistan Post Support] ${originalContact.subject}`,
          body: replyText,
          status: "Sent",
          timestamp: new Date().toISOString()
        });
      }

      appendSystemLog(`Wrote and logged reply message to contact ticket ${messageId}`, "Settings", "info");
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportBackupMerge = async (importedList: Shipment[]) => {
    setActionLoading(true);
    try {
      for (const s of importedList) {
        await setDoc(doc(db, "shipments", s.trackingNumber), s);
      }
      appendSystemLog(`Imported and merged ${importedList.length} backup records`, "Database", "action");
      await fetchData();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetDatabasePristine = async () => {
    setActionLoading(true);
    try {
      // Clear current manifests
      for (const s of shipments) {
        await deleteDoc(doc(db, "shipments", s.trackingNumber));
      }

      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const demo1: Shipment = {
        trackingNumber: `TPL-${todayStr}-000001`,
        senderName: "Arslan Gurbanov",
        senderPhone: "+993 12 380102",
        receiverName: "Jean Dupont",
        receiverPhone: "+33 6 12345678",
        originCountry: "Turkmenistan",
        destinationCountry: "France",
        parcelDescription: "Traditional Turkmen silk garments and embroidered wool carpet samples",
        parcelWeight: 3.8,
        shippingMethod: "Express Air",
        shippingDate: new Date().toISOString().split("T")[0],
        expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        currentLocation: "Ashgabat Airport Air Freight sorting center",
        status: ShipmentStatus.PROCESSING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.uid,
        history: [
          {
            id: "h-01",
            status: ShipmentStatus.CREATED,
            location: "Ashgabat Hub",
            timestamp: new Date().toISOString(),
            description: "Cargo physical drops logged digitally."
          }
        ]
      };

      await setDoc(doc(db, "shipments", demo1.trackingNumber), demo1);
      appendSystemLog("Database reset and sample profiles deployed", "Database", "warning");
      await fetchData();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAdminProfile = async (name: string, email: string) => {
    appendSystemLog(`Administrator updated name to '${name}' and email to '${email}'`, "Auth", "info");
  };

  // Sequential ID pre-fill form router helper
  const handleNavigateToShipmentCreation = (seqTrackingId: string) => {
    setActiveTab("shipments");
    // Simple state trigger sequence can occur inside the child component
  };

  // Filter tabs
  const filteredTabs = ALL_TABS.filter(tab => 
    tab.label.toLowerCase().includes(tabQuery.toLowerCase()) ||
    tab.category.toLowerCase().includes(tabQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-xs font-sans text-gray-800">
      
      {/* Mobile drawer header */}
      <div className="md:hidden bg-black text-white p-4 flex justify-between items-center border-b border-neutral-900 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <CompanyLogo size="sm" />
          <span className="font-extrabold tracking-widest text-[10px] text-gold-500 font-mono">PORTAL_ADMIN</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 hover:bg-neutral-900 rounded-lg text-gold-500"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Responsive Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 bg-black text-white w-64 p-5 flex flex-col border-r border-neutral-900 z-50 transform md:transform-none transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Brand Banner */}
        <div className="hidden md:flex items-center gap-3 border-b border-neutral-900 pb-5 mb-5">
          <CompanyLogo size="sm" />
          <div>
            <span className="text-[9px] font-mono tracking-widest text-gold-500 font-extrabold block">LOGISTIK PORTAL</span>
            <span className="text-[10px] text-gray-400 font-semibold">{user.email}</span>
          </div>
        </div>

        {/* Dynamic Tab Filter Search Box */}
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search 26 sections..."
            value={tabQuery}
            onChange={(e) => setTabQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-gold-500 font-semibold"
          />
          {tabQuery && (
            <button onClick={() => setTabQuery("")} className="absolute right-2 top-2 text-[10px] text-neutral-500">✕</button>
          )}
        </div>

        {/* Scrollable list of tabs */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {filteredTabs.map((t) => {
            const Icon = t.icon;
            const isTabActive = activeTab === t.id;
            
            // Map individual tabs of specific subgroups to standard parent sections
            const isSubTabActive = (
              (t.id === "stats" || t.id === "reports") && activeTab === "home" ||
              (t.id === "tracking" || t.id === "updates") && activeTab === "shipments" ||
              (t.id === "calculator" || t.id === "pricing" || t.id === "live" || t.id === "notifications" || t.id === "email_sms" || t.id === "security" || t.id === "logs" || t.id === "contact_messages") && activeTab === "settings" ||
              (t.id === "users" || t.id === "staff" || t.id === "customers" || t.id === "profile") && activeTab === "directory" ||
              (t.id === "content" || t.id === "company_info" || t.id === "branches" || t.id === "faq") && activeTab === "content_manager" ||
              (t.id === "generator" || t.id === "database" || t.id === "backup_restore") && activeTab === "tools"
            );

            const displayActive = isTabActive || (isSubTabActive && activeTab === t.id);

            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                  displayActive
                    ? "bg-gold-500 text-black font-extrabold"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-white font-bold"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{t.label}</span>
                </div>
                <span className="text-[8px] opacity-60 font-mono tracking-wider">{t.category}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Logout action */}
        <div className="border-t border-neutral-900 pt-4 mt-4 space-y-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-950/20 hover:text-red-400 rounded-lg text-left transition-all font-bold cursor-pointer"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Secure Portal Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Dynamic header title */}
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-gold-600 font-extrabold uppercase">
              Turkmenistanyn Poçtasy Secure Admin Space
            </span>
            <h2 className="text-xl font-bold text-black uppercase mt-0.5 tracking-tight">
              {ALL_TABS.find(t => t.id === activeTab)?.label || "Platform Portal Panel"}
            </h2>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-gray-400 font-semibold block">OPERATOR SESSION</span>
            <span className="font-mono text-xs font-bold text-black">{user.email}</span>
          </div>
        </div>

        {/* Tab route loading panels */}
        {loading ? (
          <div className="py-24 text-center text-gray-400">
            <div className="w-8 h-8 border-3 border-gold-500 border-t-black rounded-full animate-spin mx-auto mb-3"></div>
            <p className="font-mono tracking-widest text-[10px] uppercase font-bold text-black">
              Querying Encrypted Logistics Databases...
            </p>
          </div>
        ) : (
          <div className="focus-out-entry-animation">
            
            {/* 1. CORE SECTION: HOME & STATISTICS & REPORTS */}
            {(activeTab === "home" || activeTab === "stats" || activeTab === "reports") && (
              <DashboardHome 
                shipments={shipments}
                notifications={notifications}
                contacts={contacts}
                systemLogs={systemLogs}
                onTabSwitch={(id) => setActiveTab(id)}
                onApproveBooking={handleApproveBooking}
                onRejectBooking={handleRejectBooking}
                activeTab={activeTab}
              />
            )}

            {/* 2. CORE SECTION: BOOKING MANAGER */}
            {activeTab === "bookings" && (
              <BookingManager 
                shipments={shipments}
                loading={loading}
                onApproveBooking={handleApproveBooking}
                onRejectBooking={handleRejectBooking}
              />
            )}

            {/* 3. CORE SECTION: SHIPMENT MANAGEMENT GRID & BULK UPDATES */}
            {(activeTab === "shipments" || activeTab === "updates") && (
              <ShipmentList 
                shipments={shipments}
                loading={loading}
                currentUserUid={user.uid}
                onSaveShipment={handleSaveShipment}
                onDeleteShipment={handleDeleteShipment}
                onSeedDemo={handleResetDatabasePristine}
                actionLoading={actionLoading}
                activeTab={activeTab}
              />
            )}

            {/* 3b. SHIPMENT LOCATION MANAGEMENT */}
            {activeTab === "tracking" && (
              <ShipmentLocationManagement
                shipments={shipments}
                onSaveShipment={handleSaveShipment}
                actionLoading={actionLoading}
              />
            )}

            {/* 4. UTILITY & SECURITY SECTION: CODE GENERATOR & BACKUP EXPORTS */}
            {(activeTab === "generator" || activeTab === "database" || activeTab === "backup_restore") && (
              <GeneratorAndTools 
                shipments={shipments}
                dbName={db ? "cloud-firestore-instance" : "mock-logistics"}
                onImportBackup={handleImportBackupMerge}
                onResetDatabase={handleResetDatabasePristine}
                actionLoading={actionLoading}
                onNavigateToShipmentCreation={handleNavigateToShipmentCreation}
              />
            )}

            {/* 5. DIRECTORY SECTION: USERS, CUSTOMERS, STAFF & PROFILE */}
            {(activeTab === "customers" || activeTab === "staff" || activeTab === "users" || activeTab === "profile") && (
              <CustomerStaffManager 
                shipments={shipments}
                adminUser={user}
                onUpdateAdminProfile={handleUpdateAdminProfile}
                activeTab={activeTab}
              />
            )}

            {/* 6. CONTENT MANAGEMENT SECTION: LANDING PAGE TEXTS, FAQs, BRANCHES */}
            {(activeTab === "content" || activeTab === "company_info" || activeTab === "branches" || activeTab === "faq") && (
              <WebsiteContentManager activeTab={activeTab} />
            )}

            {/* 7. GENERAL CONFIGURATION SECTION: CALCULATOR, TARIFFS, NOTIFICATIONS & SECURITY */}
            {(activeTab === "calculator" || activeTab === "pricing" || activeTab === "live" || activeTab === "notifications" || activeTab === "email_sms" || activeTab === "security" || activeTab === "logs" || activeTab === "contact_messages") && (
              <SystemSettings 
                notifications={notifications}
                contacts={contacts}
                systemLogs={systemLogs}
                onReplyToContact={handleReplyToContact}
                activeTab={activeTab}
                shipments={shipments}
                adminEmail={user.email || "admin@tpl-logistics.gov.tm"}
              />
            )}

          </div>
        )}
      </main>
    </div>
  );
}
