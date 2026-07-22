import React, { useState, useEffect } from "react";
import { Shipment, AdminUser } from "../../types";
import { StaffMember, CustomerAccount, CustomerEmailLog } from "./adminTypes";
import { 
  Users, User, ShieldAlert, Settings, Mail, Plus, Trash2, Edit2,
  CheckCircle, Key, Shield, MessageSquare, Globe, ToggleLeft, ToggleRight,
  FileText, Check, Clock, AlertCircle, RefreshCw, Send, ShieldCheck
} from "lucide-react";
import { ALL_COUNTRIES, getStatesForCountry } from "../../lib/locationDb";

interface CustomerStaffManagerProps {
  shipments: Shipment[];
  adminUser: AdminUser;
  onUpdateAdminProfile: (name: string, email: string) => Promise<void>;
  activeTab?: string;
}

export default function CustomerStaffManager({
  shipments,
  adminUser,
  onUpdateAdminProfile,
  activeTab
}: CustomerStaffManagerProps) {
  // Navigation: customers, staff, company_email, communication_center, users, profile
  const [subTab, setSubTab] = useState<"customers" | "staff" | "company_email" | "communication_center" | "users" | "profile">("customers");

  // Sync subTab with activeTab prop
  useEffect(() => {
    if (activeTab === "customers" || activeTab === "staff" || activeTab === "users" || activeTab === "profile") {
      setSubTab(activeTab);
    }
  }, [activeTab]);

  // --- 1. STATE INITIALIZATION ---
  const [customersList, setCustomersList] = useState<CustomerAccount[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [customerEmailsList, setCustomerEmailsList] = useState<CustomerEmailLog[]>([]);

  // Customer Form State
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custCountry, setCustCountry] = useState("Turkmenistan");
  const [custState, setCustState] = useState("Ashgabat");
  const [custCity, setCustCity] = useState("Ashgabat City");
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  // Staff Form State
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState<StaffMember["role"]>("Courier");
  const [staffBranch, setStaffBranch] = useState("Ashgabat Central HQ");
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  // Company Email Form State
  const [selectedStaffIdForEmail, setSelectedStaffIdForEmail] = useState("");
  const [companyEmailPrefix, setCompanyEmailPrefix] = useState("");
  const [companyEmailPassword, setCompanyEmailPassword] = useState("");
  const [companyEmailQuota, setCompanyEmailQuota] = useState(15); // GB
  const [emailPermissions, setEmailPermissions] = useState({
    readShipments: true,
    writeShipments: false,
    approveBookings: false,
    deleteShipments: false,
    manageStaff: false,
    manageSettings: false
  });
  const [companyEmailSuccess, setCompanyEmailSuccess] = useState("");

  // Customer Communication State
  const [directEmailName, setDirectEmailName] = useState("");
  const [directEmailRecipient, setDirectEmailRecipient] = useState("");
  const [directEmailSubject, setDirectEmailSubject] = useState("");
  const [directEmailBody, setDirectEmailBody] = useState("");
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [composerSuccess, setComposerSuccess] = useState(false);

  // Profile modifications
  const [profileName, setProfileName] = useState(adminUser.name || "");
  const [profileEmail, setProfileEmail] = useState(adminUser.email || "");
  const [profilePass, setProfilePass] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  // --- 2. EFFECT: LOAD DATA & HYDRATE FROM LOCALSTORAGE/SHIPMENTS ---
  useEffect(() => {
    // A. Customers Load
    const localCust = localStorage.getItem("tpl_customers_db");
    if (localCust) {
      setCustomersList(JSON.parse(localCust));
    } else {
      // Seed customers from active shipments to ensure rich instant data
      const seededCustomers: CustomerAccount[] = [];
      const keysSeen = new Set<string>();

      shipments.forEach(s => {
        const key = s.senderName.trim().toLowerCase();
        if (!keysSeen.has(key)) {
          keysSeen.add(key);
          seededCustomers.push({
            id: `cust-${Date.now()}-${seededCustomers.length}`,
            name: s.senderName,
            phone: s.senderPhone,
            email: s.senderEmail || `${key.replace(/\s+/g, ".")}@gmail.com`,
            country: s.originCountry || "Turkmenistan",
            state: "Ashgabat",
            city: "Ashgabat City",
            address: "Central Metropol",
            createdAt: s.createdAt || new Date().toISOString()
          });
        }
      });

      // Default seed fallback if shipments empty
      if (seededCustomers.length === 0) {
        seededCustomers.push(
          {
            id: "cust-1",
            name: "Arslan Gurbanov",
            phone: "+993 12 380102",
            email: "arslan.g@outlook.com",
            country: "Turkmenistan",
            state: "Ashgabat",
            city: "Ashgabat City",
            address: "Magtymguly Avenue, Apt 41",
            createdAt: new Date().toISOString()
          },
          {
            id: "cust-2",
            name: "Jean Dupont",
            phone: "+33 6 12345678",
            email: "jean.dupont@gmail.com",
            country: "France",
            state: "Capital Territory",
            city: "France Central",
            address: "Rue de Rivoli 75001",
            createdAt: new Date().toISOString()
          }
        );
      }

      setCustomersList(seededCustomers);
      localStorage.setItem("tpl_customers_db", JSON.stringify(seededCustomers));
    }

    // B. Staff Load
    const localStaff = localStorage.getItem("tpl_staff_members");
    if (localStaff) {
      setStaffList(JSON.parse(localStaff));
    } else {
      const defaultStaff: StaffMember[] = [
        { 
          id: "st-1", 
          name: "Serdar Amandurdyev", 
          email: "serdar.courier@tpl.tm", 
          role: "Courier", 
          status: "Active", 
          branch: "Ashgabat Central HQ",
          companyEmail: "serdar.courier@tpl-logistics.tm",
          companyEmailQuota: 15,
          companyEmailStatus: "Active",
          permissions: { readShipments: true, writeShipments: true, approveBookings: false, deleteShipments: false, manageStaff: false, manageSettings: false }
        },
        { 
          id: "st-2", 
          name: "Gozel Atayeva", 
          email: "g.atayeva@tpl.tm", 
          role: "Operator", 
          status: "Active", 
          branch: "Mary Regional Terminal",
          companyEmail: "g.atayeva@tpl-logistics.tm",
          companyEmailQuota: 30,
          companyEmailStatus: "Active",
          permissions: { readShipments: true, writeShipments: true, approveBookings: true, deleteShipments: false, manageStaff: false, manageSettings: false }
        },
        { 
          id: "st-3", 
          name: "Dovlet Kakayev", 
          email: "d.kakayev.customs@tpl.tm", 
          role: "Customs Broker", 
          status: "Active", 
          branch: "Ashgabat Central HQ",
          companyEmail: "d.kakayev@tpl-logistics.tm",
          companyEmailQuota: 15,
          companyEmailStatus: "Active",
          permissions: { readShipments: true, writeShipments: false, approveBookings: false, deleteShipments: false, manageStaff: false, manageSettings: false }
        }
      ];
      setStaffList(defaultStaff);
      localStorage.setItem("tpl_staff_members", JSON.stringify(defaultStaff));
    }

    // C. Emails Load
    const localEmails = localStorage.getItem("tpl_customer_emails");
    if (localEmails) {
      setCustomerEmailsList(JSON.parse(localEmails));
    } else {
      const defaultEmails: CustomerEmailLog[] = [
        {
          id: "em-1",
          recipientName: "Arslan Gurbanov",
          recipientEmail: "arslan.g@outlook.com",
          subject: `Booking Approval Confirmation [TPL-${new Date().getFullYear()}0720-000001]`,
          body: "Salom Arslan, your shipment booking has been approved. Please drop off the package at Ashgabat Central HQ.",
          sentAt: new Date(Date.now() - 3600000).toISOString(),
          status: "Opened"
        },
        {
          id: "em-2",
          recipientName: "Jean Dupont",
          recipientEmail: "jean.dupont@gmail.com",
          subject: "Inbound Customs Clearance Completed",
          body: "Hello Jean, we are pleased to inform you that your parcel has cleared the Ashgabat International Airport customs gate and is in transit.",
          sentAt: new Date(Date.now() - 7200000).toISOString(),
          status: "Delivered"
        }
      ];
      setCustomerEmailsList(defaultEmails);
      localStorage.setItem("tpl_customer_emails", JSON.stringify(defaultEmails));
    }
  }, [shipments]);

  // --- 3. DYNAMIC LOCATION CALCULATIONS ---
  const custStates = getStatesForCountry(custCountry);
  const custCities = custStates.find(s => s.name === custState)?.cities || (custStates[0]?.cities || []);

  const handleCountryChange = (val: string) => {
    setCustCountry(val);
    const states = getStatesForCountry(val);
    const firstState = states[0]?.name || "";
    setCustState(firstState);
    const cities = states[0]?.cities || [];
    setCustCity(cities[0] || "");
  };

  const handleStateChange = (val: string) => {
    setCustState(val);
    const states = getStatesForCountry(custCountry);
    const cities = states.find(s => s.name === val)?.cities || [];
    setCustCity(cities[0] || "");
  };

  // --- 4. CUSTOMER CRUD HANDLERS ---
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPhone || !custEmail) {
      alert("Please enter Name, Contact, and Email.");
      return;
    }

    if (isEditingCustomer && editingCustomerId) {
      const updated = customersList.map(c => {
        if (c.id === editingCustomerId) {
          return {
            ...c,
            name: custName,
            phone: custPhone,
            email: custEmail,
            address: custAddress,
            country: custCountry,
            state: custState,
            city: custCity
          };
        }
        return c;
      });
      setCustomersList(updated);
      localStorage.setItem("tpl_customers_db", JSON.stringify(updated));
      setIsEditingCustomer(false);
      setEditingCustomerId(null);
    } else {
      const newCustomer: CustomerAccount = {
        id: `cust-${Date.now()}`,
        name: custName,
        phone: custPhone,
        email: custEmail,
        address: custAddress,
        country: custCountry,
        state: custState,
        city: custCity,
        createdAt: new Date().toISOString()
      };
      const updated = [newCustomer, ...customersList];
      setCustomersList(updated);
      localStorage.setItem("tpl_customers_db", JSON.stringify(updated));
    }

    // Reset customer form
    setCustName("");
    setCustPhone("");
    setCustEmail("");
    setCustAddress("");
    setCustCountry("Turkmenistan");
    setCustState("Ashgabat");
    setCustCity("Ashgabat City");
  };

  const handleEditCustomerClick = (c: CustomerAccount) => {
    setIsEditingCustomer(true);
    setEditingCustomerId(c.id);
    setCustName(c.name);
    setCustPhone(c.phone);
    setCustEmail(c.email);
    setCustAddress(c.address || "");
    setCustCountry(c.country);
    // Find matching state and city safely
    const states = getStatesForCountry(c.country);
    const matchedState = states.find(s => s.name === c.state) ? c.state : (states[0]?.name || "");
    setCustState(matchedState);
    const cities = states.find(s => s.name === matchedState)?.cities || [];
    setCustCity(cities.includes(c.city) ? c.city : (cities[0] || ""));
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm("Are you sure you want to delete this customer profile from directory files?")) {
      const updated = customersList.filter(c => c.id !== id);
      setCustomersList(updated);
      localStorage.setItem("tpl_customers_db", JSON.stringify(updated));
    }
  };

  // --- 5. STAFF CRUD HANDLERS ---
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail) return;

    if (isEditingStaff && editingStaffId) {
      const updated = staffList.map(s => {
        if (s.id === editingStaffId) {
          return {
            ...s,
            name: staffName,
            email: staffEmail,
            role: staffRole,
            branch: staffBranch
          };
        }
        return s;
      });
      setStaffList(updated);
      localStorage.setItem("tpl_staff_members", JSON.stringify(updated));
      setIsEditingStaff(false);
      setEditingStaffId(null);
    } else {
      const newStaff: StaffMember = {
        id: `st-${Date.now()}`,
        name: staffName,
        email: staffEmail,
        role: staffRole,
        status: "Active",
        branch: staffBranch
      };
      const updated = [...staffList, newStaff];
      setStaffList(updated);
      localStorage.setItem("tpl_staff_members", JSON.stringify(updated));
    }

    // Reset Staff Form
    setStaffName("");
    setStaffEmail("");
    setStaffRole("Courier");
    setStaffBranch("Ashgabat Central HQ");
  };

  const handleEditStaffClick = (s: StaffMember) => {
    setIsEditingStaff(true);
    setEditingStaffId(s.id);
    setStaffName(s.name);
    setStaffEmail(s.email);
    setStaffRole(s.role);
    setStaffBranch(s.branch);
  };

  const handleDeleteStaff = (id: string) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      const updated = staffList.filter(s => s.id !== id);
      setStaffList(updated);
      localStorage.setItem("tpl_staff_members", JSON.stringify(updated));
    }
  };

  const handleToggleStaffStatus = (id: string) => {
    const updated = staffList.map(s => {
      if (s.id === id) {
        const nextStatus: StaffMember["status"] = s.status === "Active" ? "On Leave" : s.status === "On Leave" ? "Suspended" : "Active";
        return { ...s, status: nextStatus };
      }
      return s;
    });
    setStaffList(updated);
    localStorage.setItem("tpl_staff_members", JSON.stringify(updated));
  };

  // --- 6. COMPANY EMAIL HANDLERS ---
  const handleCreateCompanyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffIdForEmail || !companyEmailPrefix || !companyEmailPassword) {
      alert("Please fill all fields to create a corporate email account.");
      return;
    }

    const fullEmailAddress = `${companyEmailPrefix.toLowerCase().trim()}@tpl-logistics.tm`;

    // Check duplicate corporate emails
    if (staffList.some(s => s.companyEmail?.toLowerCase() === fullEmailAddress)) {
      alert("This corporate email address is already allocated.");
      return;
    }

    const updated = staffList.map(s => {
      if (s.id === selectedStaffIdForEmail) {
        return {
          ...s,
          companyEmail: fullEmailAddress,
          companyEmailPassword: companyEmailPassword,
          companyEmailQuota: companyEmailQuota,
          companyEmailStatus: "Active" as const,
          permissions: { ...emailPermissions }
        };
      }
      return s;
    });

    setStaffList(updated);
    localStorage.setItem("tpl_staff_members", JSON.stringify(updated));
    setCompanyEmailSuccess(`Allocated corporate inbox ${fullEmailAddress} successfully!`);

    // Reset Form
    setSelectedStaffIdForEmail("");
    setCompanyEmailPrefix("");
    setCompanyEmailPassword("");
    setCompanyEmailQuota(15);
    setEmailPermissions({
      readShipments: true,
      writeShipments: false,
      approveBookings: false,
      deleteShipments: false,
      manageStaff: false,
      manageSettings: false
    });

    setTimeout(() => setCompanyEmailSuccess(""), 4000);
  };

  const handleToggleCompanyEmailStatus = (id: string) => {
    const updated = staffList.map(s => {
      if (s.id === id) {
        const nextStatus = s.companyEmailStatus === "Active" ? "Disabled" : "Active";
        return { ...s, companyEmailStatus: nextStatus as any };
      }
      return s;
    });
    setStaffList(updated);
    localStorage.setItem("tpl_staff_members", JSON.stringify(updated));
  };

  const handleUpdatePermissions = (id: string, permKey: string, val: boolean) => {
    const updated = staffList.map(s => {
      if (s.id === id) {
        const currentPerms = s.permissions || {
          readShipments: true,
          writeShipments: false,
          approveBookings: false,
          deleteShipments: false,
          manageStaff: false,
          manageSettings: false
        };
        return {
          ...s,
          permissions: {
            ...currentPerms,
            [permKey]: val
          }
        };
      }
      return s;
    });
    setStaffList(updated);
    localStorage.setItem("tpl_staff_members", JSON.stringify(updated));
  };

  // --- 7. CUSTOMER COMMUNICATION CENTER HANDLERS ---
  const handleOpenComposer = (name: string, email: string) => {
    setDirectEmailName(name);
    setDirectEmailRecipient(email);
    setDirectEmailSubject("");
    setDirectEmailBody("");
    setEmailComposerOpen(true);
  };

  const handleSendDirectEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directEmailRecipient || !directEmailSubject || !directEmailBody) {
      alert("All fields are mandatory.");
      return;
    }

    const newEmailLog: CustomerEmailLog = {
      id: `em-${Date.now()}`,
      recipientName: directEmailName || "Direct Recipient",
      recipientEmail: directEmailRecipient,
      subject: directEmailSubject,
      body: directEmailBody,
      sentAt: new Date().toISOString(),
      status: "Sent"
    };

    const updated = [newEmailLog, ...customerEmailsList];
    setCustomerEmailsList(updated);
    localStorage.setItem("tpl_customer_emails", JSON.stringify(updated));
    setComposerSuccess(true);

    // Dynamic state delivery simulation timer
    const sentId = newEmailLog.id;
    setTimeout(() => {
      // Transition to In Transit
      setCustomerEmailsList(prev => prev.map(em => em.id === sentId ? { ...em, status: "In Transit" } : em));
    }, 2500);

    setTimeout(() => {
      // Transition to Delivered
      setCustomerEmailsList(prev => prev.map(em => em.id === sentId ? { ...em, status: "Delivered" } : em));
    }, 6000);

    setTimeout(() => {
      // Transition to Opened
      setCustomerEmailsList(prev => prev.map(em => em.id === sentId ? { ...em, status: "Opened" } : em));
    }, 12000);

    setTimeout(() => {
      setComposerSuccess(false);
      setEmailComposerOpen(false);
      // Reset composer
      setDirectEmailName("");
      setDirectEmailRecipient("");
      setDirectEmailSubject("");
      setDirectEmailBody("");
    }, 2000);
  };

  // --- 8. PROFILE SETTINGS HANDLER ---
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdateAdminProfile(profileName, profileEmail);
      if (profilePass) {
        localStorage.setItem("admin_hashed_pass_key", profilePass);
      }
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch (err) {
      alert("Error updating admin profile settings.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Subtab navigation */}
      <div className="flex gap-2 border-b border-gray-150 pb-px flex-wrap">
        {[
          { id: "customers", label: "Customer Registry", icon: Users },
          { id: "staff", label: "Staff Roster", icon: User },
          { id: "company_email", label: "Company Email Accounts", icon: Key },
          { id: "communication_center", label: "Communication Center", icon: MessageSquare },
          { id: "users", label: "Administrative Clearances", icon: ShieldAlert },
          { id: "profile", label: "Profile Settings", icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                subTab === tab.id
                  ? "border-black text-black"
                  : "border-transparent text-gray-400 hover:text-black"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* VIEW 1: CUSTOMER REGISTRY (CRUD & SELECTORS) */}
      {subTab === "customers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Add/Edit Form */}
          <form onSubmit={handleSaveCustomer} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-xs h-fit">
            <h3 className="font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
              {isEditingCustomer ? <Edit2 className="w-4 h-4 text-gold-600" /> : <Plus className="w-4 h-4 text-gold-600" />}
              {isEditingCustomer ? "Edit Customer Details" : "Register New Customer"}
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-600">Full Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Batyr Amanov"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Contact Phone *</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="+993 65..."
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Email Address *</label>
                  <input 
                    type="email" 
                    required
                    placeholder="name@email.com"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Physical Address</label>
                <input 
                  type="text"
                  placeholder="e.g. Bitarap Turkmen Street, Block 12"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                />
              </div>

              {/* Geographic selectors */}
              <div className="space-y-3 p-3 bg-neutral-50 rounded-xl border border-gray-150">
                <span className="text-[10px] font-mono font-bold text-gold-600 uppercase block">Customer Core Geography</span>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase">Country *</label>
                    <select
                      value={custCountry}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-black font-semibold"
                    >
                      {ALL_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 font-bold uppercase">State/Province *</label>
                      <select
                        value={custState}
                        onChange={(e) => handleStateChange(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-black font-semibold"
                      >
                        {custStates.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 font-bold uppercase">City/Terminal *</label>
                      <select
                        value={custCity}
                        onChange={(e) => setCustCity(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-black font-semibold"
                      >
                        {custCities.map(city => <option key={city} value={city}>{city}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {isEditingCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingCustomer(false);
                      setEditingCustomerId(null);
                      setCustName("");
                      setCustPhone("");
                      setCustEmail("");
                      setCustAddress("");
                      setCustCountry("Turkmenistan");
                      setCustState("Ashgabat");
                      setCustCity("Ashgabat City");
                    }}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-center cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2 bg-black text-gold-500 hover:bg-neutral-900 border border-neutral-800 font-extrabold rounded-xl transition-all cursor-pointer text-center"
                >
                  {isEditingCustomer ? "Update Profile" : "Register Shipper"}
                </button>
              </div>
            </div>
          </form>

          {/* Customer Directory Table */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-gold-600" />
              Registered Logistics Shippers Directory ({customersList.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-150">
                    <th className="py-3 px-4">Shipper Details</th>
                    <th className="py-3 px-4">Contact coordinates</th>
                    <th className="py-3 px-4">Main Core Geography</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {customersList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-400">
                        No active customer profiles logged.
                      </td>
                    </tr>
                  ) : (
                    customersList.map((cust) => (
                      <tr key={cust.id} className="hover:bg-neutral-50/50">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-black uppercase">{cust.name}</p>
                          <p className="text-[10px] text-gray-400">Address: {cust.address || "N/A"}</p>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <p className="text-black font-semibold">{cust.phone}</p>
                          <p className="text-[10px] text-gray-400">{cust.email}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-black uppercase block">{cust.country}</span>
                          <span className="text-[10px] text-gray-400 block">{cust.state}, {cust.city}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenComposer(cust.name, cust.email)}
                              className="p-1.5 bg-black hover:bg-neutral-900 text-gold-500 rounded-lg border border-neutral-800 transition-all cursor-pointer"
                              title="Send customer direct email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEditCustomerClick(cust)}
                              className="p-1.5 bg-gray-50 hover:bg-gold-50 text-gray-700 hover:text-gold-700 rounded-lg border border-gray-200 transition-all cursor-pointer"
                              title="Edit profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(cust.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-200/50 transition-all cursor-pointer"
                              title="Delete customer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* VIEW 2: STAFF ROSTER (CRUD) */}
      {subTab === "staff" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSaveStaff} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-xs h-fit">
            <h3 className="font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
              {isEditingStaff ? <Edit2 className="w-4 h-4 text-gold-600" /> : <Plus className="w-4 h-4 text-gold-600" />}
              {isEditingStaff ? "Edit Logistics Operator" : "Recruit Logistics Operator"}
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-600">Staff Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Gurban Kakayev"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-black font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Secure Personal Email</label>
                <input 
                  type="email" 
                  required
                  placeholder="e.g. gurban.k@gmail.com"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-black font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Designated Role</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-black"
                >
                  <option value="Courier">Courier Logistics</option>
                  <option value="Operator">Sorting Operator</option>
                  <option value="Handler">Depot Handler</option>
                  <option value="Customs Broker">Customs Clearance Broker</option>
                  <option value="Branch Manager">Regional Branch Manager</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Assigned Branch Depot</label>
                <input 
                  type="text" 
                  required
                  value={staffBranch}
                  onChange={(e) => setStaffBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-black font-semibold"
                />
              </div>

              <div className="flex gap-2">
                {isEditingStaff && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingStaff(false);
                      setEditingStaffId(null);
                      setStaffName("");
                      setStaffEmail("");
                      setStaffRole("Courier");
                      setStaffBranch("Ashgabat Central HQ");
                    }}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2 bg-black text-gold-500 hover:bg-neutral-900 border border-neutral-800 font-extrabold rounded-xl transition-all cursor-pointer text-center"
                >
                  {isEditingStaff ? "Update Roster" : "Register Operator"}
                </button>
              </div>
            </div>
          </form>

          {/* Staff listing */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-3 flex items-center gap-1.5">
              <User className="w-4 h-4 text-gold-600" />
              Active Terminal Staff roster ({staffList.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-150">
                    <th className="py-2.5 px-4">Staff Member</th>
                    <th className="py-2.5 px-4">SMTP Email</th>
                    <th className="py-2.5 px-4">Role Clearance</th>
                    <th className="py-2.5 px-4">Primary Branch</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {staffList.map((st) => (
                    <tr key={st.id} className="hover:bg-neutral-50/50">
                      <td className="py-3 px-4 font-bold text-black uppercase">{st.name}</td>
                      <td className="py-3 px-4 font-mono text-gray-500">
                        {st.email}
                        {st.companyEmail && (
                          <span className="block text-[10px] text-gold-600 font-bold">{st.companyEmail}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-neutral-900 text-gold-400 font-extrabold text-[9px] rounded uppercase border border-gold-400/10">
                          {st.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">{st.branch}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStaffStatus(st.id)}
                          className={`px-2 py-0.5 font-bold text-[9px] rounded-full border transition-all cursor-pointer ${
                            st.status === "Active" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : st.status === "On Leave"
                              ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          }`}
                        >
                          {st.status}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEditStaffClick(st)}
                            className="p-1 bg-gray-50 hover:bg-gold-50 text-gray-600 hover:text-gold-600 border border-gray-200 rounded transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(st.id)}
                            className="p-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 rounded transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: COMPANY EMAIL ACCOUNTS (EMAIL ALLOCATION & PERMISSIONS) */}
      {subTab === "company_email" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email creator */}
          <form onSubmit={handleCreateCompanyEmail} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-xs h-fit">
            <h3 className="font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-gold-600" />
              Allocate Staff Corporate Email
            </h3>

            {companyEmailSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{companyEmailSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-600">Select Staff Member *</label>
                <select
                  required
                  value={selectedStaffIdForEmail}
                  onChange={(e) => setSelectedStaffIdForEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-black font-semibold"
                >
                  <option value="">-- Choose Roster Member --</option>
                  {staffList.filter(s => !s.companyEmail).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Email Address Allocation *</label>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl pr-3 overflow-hidden">
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. gurban.k"
                    value={companyEmailPrefix}
                    onChange={(e) => setCompanyEmailPrefix(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border-none text-black font-semibold focus:outline-none"
                  />
                  <span className="font-mono font-bold text-gray-400">@tpl-logistics.tm</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Secure Access Passcode *</label>
                <input 
                  type="password" 
                  required
                  placeholder="Allocate a temporary security pass..."
                  value={companyEmailPassword}
                  onChange={(e) => setCompanyEmailPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-black font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Storage Quota Limit</label>
                <select
                  value={companyEmailQuota}
                  onChange={(e) => setCompanyEmailQuota(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-black"
                >
                  <option value={15}>15 GB (Standard)</option>
                  <option value={30}>30 GB (Business)</option>
                  <option value={50}>50 GB (Manager Extra)</option>
                  <option value={100}>100 GB (Master Administrator)</option>
                </select>
              </div>

              {/* Granular Permissions Selection */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-gray-150 space-y-2">
                <span className="text-[10px] font-mono font-bold text-gold-600 uppercase block">Assign Secure Platform Clearances</span>
                <div className="space-y-1.5">
                  {[
                    { key: "readShipments", label: "Read Cargo Manifests" },
                    { key: "writeShipments", label: "Create/Modify Shipments" },
                    { key: "approveBookings", label: "Approve Booking Requests" },
                    { key: "deleteShipments", label: "Delete Cargo Records" },
                    { key: "manageStaff", label: "Manage Staff Directory" },
                    { key: "manageSettings", label: "Modify System Settings" }
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 font-semibold text-gray-700 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={(emailPermissions as any)[perm.key]}
                        onChange={(e) => setEmailPermissions({ ...emailPermissions, [perm.key]: e.target.checked })}
                        className="rounded text-gold-500 focus:ring-gold-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-black text-gold-500 hover:bg-neutral-900 border border-neutral-800 font-extrabold rounded-xl transition-all cursor-pointer shadow-sm text-center"
              >
                Provision Account Inbox
              </button>
            </div>
          </form>

          {/* Email Roster Manager */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-gold-600" />
              Corporate Email Accounts & Permissions Dashboard
            </h3>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {staffList.filter(s => s.companyEmail).map((st) => {
                const perms = st.permissions || {
                  readShipments: true,
                  writeShipments: false,
                  approveBookings: false,
                  deleteShipments: false,
                  manageStaff: false,
                  manageSettings: false
                };

                return (
                  <div key={st.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3.5">
                    <div className="flex justify-between items-start border-b border-gray-200 pb-2.5">
                      <div>
                        <h4 className="font-bold text-black uppercase text-sm">{st.name}</h4>
                        <p className="text-gray-400 text-[10px] font-mono">{st.role} • {st.branch}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-neutral-800 block">{st.companyEmail}</span>
                        <span className="text-[10px] text-gray-400 block">Quota: {st.companyEmailQuota || 15} GB</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      {/* Active Toggle */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-600 text-[11px]">Email Account Status:</span>
                        <button
                          type="button"
                          onClick={() => handleToggleCompanyEmailStatus(st.id)}
                          className={`flex items-center gap-1 px-3 py-1 text-[10px] font-extrabold rounded-lg border transition-all cursor-pointer ${
                            st.companyEmailStatus !== "Disabled"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          }`}
                        >
                          {st.companyEmailStatus !== "Disabled" ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          <span>{st.companyEmailStatus !== "Disabled" ? "ACTIVE / ASSIGNED" : "DISABLED"}</span>
                        </button>
                      </div>

                      <span className="text-[9px] font-mono text-gray-400 uppercase">Live Permissions Matrix</span>
                    </div>

                    {/* Permissions checklist matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-gray-200">
                      {[
                        { key: "readShipments", label: "Read Cargo" },
                        { key: "writeShipments", label: "Edit Cargo" },
                        { key: "approveBookings", label: "Approve Bookings" },
                        { key: "deleteShipments", label: "Delete Cargo" },
                        { key: "manageStaff", label: "Manage Staff" },
                        { key: "manageSettings", label: "System Configs" }
                      ].map((p) => (
                        <label key={p.key} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={(perms as any)[p.key]}
                            onChange={(e) => handleUpdatePermissions(st.id, p.key, e.target.checked)}
                            className="rounded text-gold-500 focus:ring-gold-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}

              {staffList.filter(s => s.companyEmail).length === 0 && (
                <p className="text-center py-8 text-gray-400 font-medium">
                  No active corporate email accounts created. Use the left form to provision staff emails.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: CUSTOMER COMMUNICATION CENTER (EMAIL LOGS & COMPOSER) */}
      {subTab === "communication_center" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email direct composer */}
          <form onSubmit={handleSendDirectEmail} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-xs h-fit">
            <h3 className="font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Send className="w-4 h-4 text-gold-600" />
              Customer Email Dispatcher
            </h3>

            {composerSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Simulated Email dispatched through SMTP and queued!</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-600">Recipient Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Batyr Amanov (Optional)"
                  value={directEmailName}
                  onChange={(e) => setDirectEmailName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-black font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Recipient Email Address *</label>
                <input 
                  type="email" 
                  required
                  placeholder="e.g. customer@gmail.com"
                  value={directEmailRecipient}
                  onChange={(e) => setDirectEmailRecipient(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-black font-semibold font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Email Subject *</label>
                <input 
                  type="text" 
                  required
                  placeholder={`e.g. Active Customs Hold Alert [TPL-${new Date().getFullYear()}]`}
                  value={directEmailSubject}
                  onChange={(e) => setDirectEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-black font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Email Body Message *</label>
                <textarea 
                  required
                  rows={6}
                  placeholder="Draft transactional/operational details here..."
                  value={directEmailBody}
                  onChange={(e) => setDirectEmailBody(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-medium focus:outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-black text-gold-500 hover:bg-neutral-900 border border-neutral-800 font-extrabold rounded-xl transition-all cursor-pointer shadow-sm text-center flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit Official Email</span>
              </button>
            </div>
          </form>

          {/* Outbound Email tracker logs */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-3 flex items-center gap-1.5">
              <Mail className="w-4.5 h-4.5 text-gold-600" />
              Customer Outbound Correspondence Center (Live Status Trackers)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-150">
                    <th className="py-2.5 px-4">Recipient</th>
                    <th className="py-2.5 px-4">Subject Title</th>
                    <th className="py-2.5 px-4">Sent Timestamp</th>
                    <th className="py-2.5 px-4 text-center">Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {customerEmailsList.map((em) => (
                    <tr key={em.id} className="hover:bg-neutral-50/50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-black block uppercase">{em.recipientName}</span>
                        <span className="font-mono text-gray-400 text-[10px] block">{em.recipientEmail}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-neutral-800">{em.subject}</p>
                        <p className="text-[10px] text-gray-400 line-clamp-1 italic">"{em.body}"</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-gray-500">
                        {new Date(em.sentAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[9px] border uppercase ${
                          em.status === "Opened"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : em.status === "Delivered"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : em.status === "In Transit"
                            ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>{em.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                  {customerEmailsList.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-400">
                        No correspondence logs registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: ADMINISTRATIVE SYSTEM CLEARANCES */}
      {subTab === "users" && (
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-3 flex items-center gap-1.5">
            <ShieldAlert className="w-4.5 h-4.5 text-gold-600" />
            Administrative Platforms Account Profiles
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-150">
                  <th className="py-2.5 px-4">Operator Name</th>
                  <th className="py-2.5 px-4">SMTP Email Address</th>
                  <th className="py-2.5 px-4">Database Auth UID</th>
                  <th className="py-2.5 px-4">Security Role Clearances</th>
                  <th className="py-2.5 px-4">Operator Clearance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-semibold">
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-3.5 px-4 font-bold text-black uppercase">{adminUser.name || "Default Master Administrator"}</td>
                  <td className="py-3.5 px-4 font-mono text-gray-500">{adminUser.email}</td>
                  <td className="py-3.5 px-4 font-mono text-[10px] text-gray-400 select-all">{adminUser.uid}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-black text-gold-500 border border-gold-500/20 font-extrabold text-[9px]">
                      <Shield className="w-3.5 h-3.5 text-gold-400" />
                      MASTER_ADMINISTRATOR
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    ACTIVE_SESSION
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 6: ADMIN PROFILE EDIT */}
      {subTab === "profile" && (
        <form onSubmit={handleProfileSubmit} className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm max-w-xl space-y-6 text-xs">
          <h3 className="font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-3 flex items-center gap-1.5">
            <Settings className="w-4.5 h-4.5 text-gold-600" />
            Modify Administrative Account Particulars
          </h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="font-bold text-gray-600">Screen Identity Name</label>
              <input 
                type="text" 
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-600">Administrative Registered Email</label>
              <input 
                type="email" 
                required
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-600">Update Secure Passcode (Optional - Hash update)</label>
              <input 
                type="password" 
                placeholder="Enter new administrative credentials code..."
                value={profilePass}
                onChange={(e) => setProfilePass(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black"
              />
            </div>

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-2 font-bold">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Profile credentials synchronized successfully!</span>
              </div>
            )}

            <button
              type="submit"
              className="px-6 py-2 bg-black text-gold-500 hover:bg-neutral-900 font-bold border border-neutral-800 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Update Credentials Profile
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
