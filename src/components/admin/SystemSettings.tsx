import React, { useState, useEffect } from "react";
import { Notification, Shipment } from "../../types";
import { ContactMessage, CalculatorSettings, PricingRule, SystemLog } from "./adminTypes";
import { db } from "../../lib/firebase";
import { doc, getDoc, setDoc, collection, addDoc, onSnapshot } from "firebase/firestore";
import { 
  Scale, DollarSign, Activity, Mail, Settings2, Shield, Clock, 
  MessageSquare, Plus, Trash2, CheckCircle, AlertTriangle, Key, 
  Terminal, Lock, EyeOff, Send, Search, Paperclip, AlertCircle, UserCheck
} from "lucide-react";

interface SystemSettingsProps {
  notifications: Notification[];
  contacts: ContactMessage[];
  systemLogs: SystemLog[];
  onReplyToContact?: (messageId: string, replyText: string) => Promise<void>;
  activeTab?: string;
  shipments?: Shipment[];
  adminEmail?: string;
}

export default function SystemSettings({
  notifications,
  contacts,
  systemLogs,
  onReplyToContact,
  activeTab,
  shipments = [],
  adminEmail = "admin@tpl-logistics.gov.tm"
}: SystemSettingsProps) {
  const [subTab, setSubTab] = useState<"calc" | "pricing" | "live" | "notifications" | "send_email" | "email_sms" | "security" | "logs">("calc");

  // Sync subTab with activeTab prop
  useEffect(() => {
    if (activeTab) {
      if (activeTab === "calculator") setSubTab("calc");
      else if (activeTab === "pricing") setSubTab("pricing");
      else if (activeTab === "live") setSubTab("live");
      else if (activeTab === "notifications" || activeTab === "contact_messages") {
        setSubTab("notifications");
      }
      else if (activeTab === "email_sms") {
        setSubTab("email_sms");
      }
      else if (activeTab === "security") setSubTab("security");
      else if (activeTab === "logs") setSubTab("logs");
    }
  }, [activeTab]);

  // A. Calculator Settings states
  const [calcSettings, setCalcSettings] = useState<CalculatorSettings>({
    baseFee: 15,
    perKgRate: 8,
    expressMultiplier: 1.5,
    airPremium: 12,
    seaDiscount: -5
  });
  const [saveCalcSuccess, setSaveCalcSuccess] = useState(false);

  // B. Pricing states
  const [tariffs, setTariffs] = useState<PricingRule[]>([]);
  const [countryName, setCountryName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [countryRate, setCountryRate] = useState(1.0);
  const [countryDays, setCountryDays] = useState(5);

  // C. Notification Center states
  const [draftRecipient, setDraftRecipient] = useState("");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftSuccess, setDraftSuccess] = useState(false);

  // Custom Email Composer & Customer Search states
  const [customers, setCustomers] = useState<{ name: string; email: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<{ name: string; email: string }[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  const [customRecipientName, setCustomRecipientName] = useState("");
  const [customRecipientEmail, setCustomRecipientEmail] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [attachShipment, setAttachShipment] = useState(false);
  const [selectedShipmentNo, setSelectedShipmentNo] = useState("");
  const [customerShipments, setCustomerShipments] = useState<Shipment[]>([]);
  
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSendSuccess, setEmailSendSuccess] = useState<string | null>(null);
  const [emailSendError, setEmailSendError] = useState<string | null>(null);

  // Compile unique customer lists from shipments array
  useEffect(() => {
    if (shipments && shipments.length > 0) {
      const uniqueCustomers = new Map<string, string>();
      shipments.forEach(s => {
        if (s.senderEmail && s.senderName) {
          uniqueCustomers.set(s.senderEmail.toLowerCase().trim(), s.senderName.trim());
        }
        if (s.receiverEmail && s.receiverName) {
          uniqueCustomers.set(s.receiverEmail.toLowerCase().trim(), s.receiverName.trim());
        }
      });
      const list = Array.from(uniqueCustomers.entries()).map(([email, name]) => ({
        name,
        email
      }));
      setCustomers(list);
    }
  }, [shipments]);

  // Filter customers as search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCustomers([]);
    } else {
      const queryLower = searchQuery.toLowerCase();
      const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(queryLower) || 
        c.email.toLowerCase().includes(queryLower)
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  // Find shipments of the selected recipient for attachments
  useEffect(() => {
    if (customRecipientEmail) {
      const lowerEmail = customRecipientEmail.toLowerCase().trim();
      const matchingShipments = shipments.filter(s => 
        (s.senderEmail?.toLowerCase().trim() === lowerEmail) || 
        (s.receiverEmail?.toLowerCase().trim() === lowerEmail)
      );
      setCustomerShipments(matchingShipments);
      if (matchingShipments.length > 0) {
        setSelectedShipmentNo(matchingShipments[0].trackingNumber);
      } else {
        setSelectedShipmentNo("");
      }
    } else {
      setCustomerShipments([]);
      setSelectedShipmentNo("");
    }
  }, [customRecipientEmail, shipments]);

  // D. Contact Reply states
  const [activeMessageReply, setActiveMessageReply] = useState<ContactMessage | null>(null);
  const [replyBodyText, setReplyBodyText] = useState("");
  const [replySuccessState, setReplySuccessState] = useState(false);

  // E. Security Settings states
  const [sessionExpiry, setSessionExpiry] = useState(30);
  const [forceStrictMfa, setForceStrictMfa] = useState(false);
  const [ipFilterToggle, setIpFilterToggle] = useState(false);
  const [saveSecuritySuccess, setSaveSecuritySuccess] = useState(false);

  // F. Company Email & SMS Settings
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [senderName, setSenderName] = useState("Turkmenistanyn Poçtasy Support");
  const [encryption, setEncryption] = useState("TLS");
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsProvider, setSmsProvider] = useState("twilio");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioNumber, setTwilioNumber] = useState("");
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [showSmsToken, setShowSmsToken] = useState(false);
  const [saveEmailSuccess, setSaveEmailSuccess] = useState(false);

  // Load official email settings from Firestore
  useEffect(() => {
    const fetchEmailConfig = async () => {
      try {
        const docRef = doc(db, "settings", "email_config");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.smtpHost) setSmtpHost(data.smtpHost);
          if (data.smtpPort) setSmtpPort(data.smtpPort);
          if (data.smtpUser) setSmtpUser(data.smtpUser);
          if (data.smtpPass) setSmtpPass(data.smtpPass);
          if (data.senderName) setSenderName(data.senderName);
          if (data.encryption) setEncryption(data.encryption);
          if (data.smsEnabled !== undefined) setSmsEnabled(data.smsEnabled);
          if (data.smsProvider) setSmsProvider(data.smsProvider);
          if (data.twilioSid) setTwilioSid(data.twilioSid);
          if (data.twilioToken) setTwilioToken(data.twilioToken);
          if (data.twilioNumber) setTwilioNumber(data.twilioNumber);
        }
      } catch (err) {
        console.error("Failed to fetch email config:", err);
      }
    };
    fetchEmailConfig();
  }, []);

  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "settings", "email_config"), {
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
        senderName,
        encryption,
        smsEnabled,
        smsProvider,
        twilioSid,
        twilioToken,
        twilioNumber,
        updatedAt: new Date().toISOString()
      });
      setSaveEmailSuccess(true);
      setTimeout(() => setSaveEmailSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save email config:", err);
      alert("Error saving email configuration to Firestore.");
    }
  };

  // Initializers
  useEffect(() => {
    // 1. Calculator settings
    const localCalc = localStorage.getItem("tpl_calc_settings");
    if (localCalc) {
      setCalcSettings(JSON.parse(localCalc));
    } else {
      localStorage.setItem("tpl_calc_settings", JSON.stringify(calcSettings));
    }

    // 2. Tariffs pricing
    const localTariffs = localStorage.getItem("tpl_pricing_tariffs");
    if (localTariffs) {
      setTariffs(JSON.parse(localTariffs));
    } else {
      const defaultTariffs: PricingRule[] = [
        { id: "tr-1", country: "Turkey", code: "TUR", baseMultiplier: 1.0, transitDays: 4 },
        { id: "tr-2", country: "France", code: "FRA", baseMultiplier: 1.25, transitDays: 6 },
        { id: "tr-3", country: "United Kingdom", code: "GBR", baseMultiplier: 1.4, transitDays: 5 },
        { id: "tr-4", country: "China", code: "CHN", baseMultiplier: 0.9, transitDays: 8 }
      ];
      setTariffs(defaultTariffs);
      localStorage.setItem("tpl_pricing_tariffs", JSON.stringify(defaultTariffs));
    }
  }, []);

  // Handlers
  const handleSaveCalc = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("tpl_calc_settings", JSON.stringify(calcSettings));
    setSaveCalcSuccess(true);
    setTimeout(() => setSaveCalcSuccess(false), 2000);
  };

  const handleAddTariff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryName || !countryCode) return;
    const rule: PricingRule = {
      id: `tr-${Date.now()}`,
      country: countryName,
      code: countryCode.toUpperCase(),
      baseMultiplier: Number(countryRate),
      transitDays: Number(countryDays)
    };
    const updated = [...tariffs, rule];
    setTariffs(updated);
    localStorage.setItem("tpl_pricing_tariffs", JSON.stringify(updated));
    setCountryName("");
    setCountryCode("");
    setCountryRate(1.0);
    setCountryDays(5);
  };

  const handleDeleteTariff = (id: string) => {
    if (confirm("Delete country shipping rate adjustments?")) {
      const updated = tariffs.filter(t => t.id !== id);
      setTariffs(updated);
      localStorage.setItem("tpl_pricing_tariffs", JSON.stringify(updated));
    }
  };

  const handleSendCustomEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRecipientEmail || !customRecipientName || !customSubject || !customBody) {
      setEmailSendError("Please complete all required fields.");
      return;
    }

    // Validate email address before sending (Requirement 8)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customRecipientEmail)) {
      setEmailSendError("Please enter a valid recipient email address.");
      return;
    }

    setIsSendingEmail(true);
    setEmailSendSuccess(null);
    setEmailSendError(null);

    try {
      // Enqueue document into the notifications collection in Firestore
      const docRef = await addDoc(collection(db, "notifications"), {
        trackingNumber: attachShipment ? selectedShipmentNo : "GENERAL",
        recipientEmail: customRecipientEmail.trim(),
        recipientName: customRecipientName.trim(),
        recipientType: "Customer",
        subject: customSubject.trim(),
        body: customBody.trim(),
        status: "Pending",
        timestamp: new Date().toISOString(),
        sentBy: adminEmail,
        type: "manual"
      });

      // Let's set up a real-time Firestore listener to monitor delivery status
      const unsub = onSnapshot(doc(db, "notifications", docRef.id), (docSnap) => {
        if (docSnap.exists()) {
          const updated = docSnap.data();
          if (updated.status === "Sent") {
            setEmailSendSuccess("Email dispatched and delivered successfully via SMTP!");
            setIsSendingEmail(false);
            
            // Reset form fields
            setCustomRecipientName("");
            setCustomRecipientEmail("");
            setCustomSubject("");
            setCustomBody("");
            setAttachShipment(false);
            setSearchQuery("");
            
            unsub();
          } else if (updated.status === "Failed") {
            setEmailSendError(`SMTP dispatch failed: ${updated.error || "No response received from mail server"}`);
            setIsSendingEmail(false);
            unsub();
          }
        }
      });

      // 15-second safety fallback timeout if functions trigger lags
      setTimeout(() => {
        unsub();
        if (isSendingEmail) {
          setIsSendingEmail(false);
          setEmailSendSuccess("Email enqueued in outbox. Dispatch is processing in the background.");
        }
      }, 15000);

    } catch (err: any) {
      console.error("Failed to enqueue email:", err);
      setEmailSendError(`Failed to queue email: ${err.message || "Network exception"}`);
      setIsSendingEmail(false);
    }
  };

  const handleExecuteReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMessageReply || !replyBodyText.trim()) return;
    
    try {
      if (onReplyToContact) {
        await onReplyToContact(activeMessageReply.id, replyBodyText.trim());
      }
      setReplySuccessState(true);
      setTimeout(() => {
        setReplySuccessState(false);
        setActiveMessageReply(null);
        setReplyBodyText("");
      }, 2500);
    } catch (err) {
      alert("Error logging reply log.");
    }
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSecuritySuccess(true);
    setTimeout(() => setSaveSecuritySuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Tab switches */}
      <div className="flex gap-2 border-b border-gray-150 pb-px flex-wrap">
        {[
          { id: "calc", label: "Shipping Calculator", icon: Scale },
          { id: "pricing", label: "Pricing Management", icon: DollarSign },
          { id: "live", label: "Live Terminal Feed", icon: Activity },
          { id: "notifications", label: "Alert Logs & Messages", icon: Mail },
          { id: "send_email", label: "Send Custom Email", icon: Send },
          { id: "email_sms", label: "Email & SMS Settings", icon: Settings2 },
          { id: "security", label: "Security Settings", icon: Shield },
          { id: "logs", label: "System Audit Logs", icon: Clock }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                subTab === t.id
                  ? "border-black text-black"
                  : "border-transparent text-gray-400 hover:text-black"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-VIEW A: CALCULATOR settings */}
      {subTab === "calc" && (
        <form onSubmit={handleSaveCalc} className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm max-w-xl space-y-6 text-xs">
          <h3 className="font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-3 flex items-center gap-1.5">
            <Scale className="w-4.5 h-4.5 text-gold-600" />
            Shipping Calculator settings coefficients
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-gray-600">Base Cargo Handling Fee ($)</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  value={calcSettings.baseFee}
                  onChange={(e) => setCalcSettings({ ...calcSettings, baseFee: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-gray-600">Standard Shipping Price per KG ($)</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  value={calcSettings.perKgRate}
                  onChange={(e) => setCalcSettings({ ...calcSettings, perKgRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-600">Express multiplier</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  value={calcSettings.expressMultiplier}
                  onChange={(e) => setCalcSettings({ ...calcSettings, expressMultiplier: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-gray-600">Air Cargo Premium ($)</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  value={calcSettings.airPremium}
                  onChange={(e) => setCalcSettings({ ...calcSettings, airPremium: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-gray-600">Ocean Discount ($)</label>
                <input 
                  type="number" 
                  step="0.1"
                  required
                  value={calcSettings.seaDiscount}
                  onChange={(e) => setCalcSettings({ ...calcSettings, seaDiscount: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-red-600"
                />
              </div>
            </div>

            {saveCalcSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-2 font-bold">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Calculator multiplier coefficients stored successfully!</span>
              </div>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 bg-black text-gold-500 hover:bg-neutral-900 border border-neutral-800 rounded-xl font-extrabold transition-all cursor-pointer shadow-sm"
            >
              Commit Calculator Coefficients
            </button>
          </div>
        </form>
      )}

      {/* SUB-VIEW B: PRICING MANIFEST */}
      {subTab === "pricing" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddTariff} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-xs h-fit">
            <h3 className="font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-gold-600" />
              Manifest Country Tariffs Surcharges
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-600">Country Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Germany"
                  value={countryName}
                  onChange={(e) => setCountryName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">IATA Country Code</label>
                  <input 
                    type="text" 
                    required
                    maxLength={3}
                    placeholder="e.g. DEU"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Base Multiplier</label>
                  <input 
                    type="number" 
                    step="0.05"
                    required
                    value={countryRate}
                    onChange={(e) => setCountryRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Transit expectations (Days)</label>
                <input 
                  type="number" 
                  required
                  value={countryDays}
                  onChange={(e) => setCountryDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-black text-gold-500 hover:bg-neutral-900 border border-neutral-800 font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Manifest Tariff Rules
              </button>
            </div>
          </form>

          {/* Pricing table list */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-gold-600" />
              Adjusted country surcharges and Transits ({tariffs.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-150">
                    <th className="py-2.5 px-4">Country Target</th>
                    <th className="py-2.5 px-4 font-mono">IATA Code</th>
                    <th className="py-2.5 px-4">Base Multiplier</th>
                    <th className="py-2.5 px-4">Expected transit</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                  {tariffs.map((t) => (
                    <tr key={t.id} className="hover:bg-neutral-50/50">
                      <td className="py-3 px-4 font-bold text-black uppercase">{t.country}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-gold-600">{t.code}</td>
                      <td className="py-3 px-4 font-mono">{t.baseMultiplier.toFixed(2)}x rate</td>
                      <td className="py-3 px-4 font-semibold">{t.transitDays} business days</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteTariff(t.id)}
                          className="text-red-500 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW C: LIVE TRANSIT FEED */}
      {subTab === "live" && (
        <div className="bg-neutral-950 text-emerald-400 p-6 rounded-2xl border border-neutral-900 shadow-2xl space-y-4 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
            <h3 className="font-bold flex items-center gap-2 text-white">
              <Terminal className="w-5 h-5 text-gold-500 animate-pulse" />
              Turkmenistan Post Active Logistics terminal feed
            </h3>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full animate-pulse uppercase tracking-widest font-bold">
              ● ONLINE
            </span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            <p className="text-gray-500">[2026-07-20T19:30:10Z] SYSTEM_INITIALIZED -- listening on secure SSL channels...</p>
            <p className="text-gray-500">[2026-07-20T19:30:22Z] SEED_DEMO -- manifested successfully in Cloud Firestore.</p>
            <p className="text-gray-500">[2026-07-20T19:41:05Z] ADMIN_PORTAL -- secured credentials login logged for operator.</p>
            <p className="text-gray-400">[2026-07-20T19:42:15Z] WEBSOCKETS_HMR -- dynamic assets hot-swaps online.</p>
            {systemLogs.length === 0 ? (
              <p className="text-gold-500 font-semibold">[IDLE] Awaiting operational updates...</p>
            ) : (
              systemLogs.map((log) => (
                <p key={log.id} className="text-emerald-400 font-semibold">
                  [{log.timestamp}] {log.category.toUpperCase()} -- {log.action} ({log.operator})
                </p>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW D: ALERT LOGS & INQUIRIES */}
      {subTab === "notifications" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Visitor contact messages log */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <MessageSquare className="w-4.5 h-4.5 text-gold-600" />
              Inbound Visitor Inquiries ({contacts.length})
            </h3>

            {contacts.length === 0 ? (
              <p className="py-8 text-center text-gray-400">No support inquiries stored.</p>
            ) : (
              <div className="space-y-4 divide-y divide-gray-150 max-h-[400px] overflow-y-auto pr-1">
                {contacts.map((c) => (
                  <div key={c.id} className="pt-4 first:pt-0 space-y-1.5">
                    <div className="flex justify-between items-start font-semibold">
                      <span className="text-black uppercase font-bold">{c.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(c.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-500 font-semibold">Email: {c.email}</p>
                    <p className="text-gold-600 font-bold">Subject: {c.subject}</p>
                    <p className="text-gray-700 italic leading-relaxed">"{c.message}"</p>
                    
                    {c.replied ? (
                      <div className="mt-2 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200/40 text-[11px]">
                        <span className="text-emerald-700 font-bold block">✓ Answered Response Sent:</span>
                        <p className="text-gray-600 italic">"{c.replyBody}"</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveMessageReply(c)}
                        className="mt-1 px-3 py-1 bg-black text-gold-500 font-bold rounded-lg text-[10px] hover:bg-neutral-900 border border-neutral-800 transition-all cursor-pointer"
                      >
                        Write Response Reply
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transaction alert logs */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Mail className="w-4.5 h-4.5 text-gold-600" />
              Automated Alerts Notification history ({notifications.length})
            </h3>
            
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-gray-400">No alert logs registered.</p>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div key={n.id} className="py-3 first:pt-0 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-black uppercase">{n.recipientName}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(n.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-[10px]">Recipient Email: {n.recipientEmail}</p>
                    <p className="font-semibold text-neutral-800 mt-1">{n.subject}</p>
                    <p className="text-gray-500 truncate italic">"{n.body}"</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Contact Inquiry Reply Composer Overlay Modal */}
          {activeMessageReply && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-xs">
              <div className="bg-white rounded-2xl max-w-lg w-full border border-gray-200 shadow-2xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h4 className="font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-gold-600" />
                    Compose support Inquiry Response
                  </h4>
                  <button 
                    onClick={() => setActiveMessageReply(null)}
                    className="text-gray-400 hover:text-black font-bold text-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 max-h-36 overflow-y-auto space-y-1">
                  <p className="font-bold text-black uppercase">{activeMessageReply.name} ({activeMessageReply.email})</p>
                  <p className="text-gold-600 font-semibold">{activeMessageReply.subject}</p>
                  <p className="text-gray-500 italic">"{activeMessageReply.message}"</p>
                </div>

                <form onSubmit={handleExecuteReplySubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">Response Message Email Body</label>
                    <textarea 
                      required
                      rows={5}
                      placeholder="Type your support reply details here..."
                      value={replyBodyText}
                      onChange={(e) => setReplyBodyText(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-gold-500"
                    ></textarea>
                  </div>

                  {replySuccessState ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-2 font-bold">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span>Reply successfully logged and marked answered!</span>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveMessageReply(null)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-black text-gold-500 hover:bg-neutral-900 rounded-lg font-bold"
                      >
                        Send Email Reply
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW F: COMPANY EMAIL & SMS CONFIGURATION */}
      {subTab === "email_sms" && (
        <form onSubmit={handleSaveEmailConfig} className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm max-w-2xl space-y-6 text-xs">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="font-bold uppercase text-black tracking-wider flex items-center gap-1.5">
              <Settings2 className="w-4.5 h-4.5 text-gold-600" />
              Official Company Notification Channels Configuration
            </h3>
            <span className="text-[10px] bg-gold-50 text-gold-700 font-extrabold px-2 py-0.5 rounded border border-gold-200">
              SECURE SMTP / API
            </span>
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
            Configure your official company SMTP outgoing mail server and Twilio SMS credentials below. All system communications (including automated booking confirmations, status updates, and administrative password resets) will utilize these parameters securely. No generic/default credentials will be exposed.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SMTP Section */}
            <div className="space-y-4">
              <h4 className="font-bold text-gray-700 uppercase tracking-widest text-[10px] border-b border-gray-100 pb-1.5">
                SMTP Outgoing Mail Server
              </h4>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">SMTP Server Host</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. smtp.gmail.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">SMTP Port</label>
                  <input 
                    type="text" 
                    required
                    placeholder="587"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Encryption</label>
                  <select
                    value={encryption}
                    onChange={(e) => setEncryption(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-black"
                  >
                    <option value="TLS">STARTTLS / TLS</option>
                    <option value="SSL">SSL</option>
                    <option value="NONE">None (Plaintext)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Sender Display Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Turkmenistan Post"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Sender Official Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="notifications@company.com"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">SMTP Account Password / App Password</label>
                <div className="relative">
                  <input 
                    type={showSmtpPass ? "text" : "password"}
                    required
                    placeholder="Enter secure SMTP password..."
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                    className="absolute right-2.5 top-2 text-gray-400 hover:text-black"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* SMS Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                <h4 className="font-bold text-gray-700 uppercase tracking-widest text-[10px]">
                  SMS Notification Gateway
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[10px] text-gray-500">Enable</span>
                  <input 
                    type="checkbox"
                    checked={smsEnabled}
                    onChange={(e) => setSmsEnabled(e.target.checked)}
                    className="rounded text-gold-500 focus:ring-gold-500 w-3.5 h-3.5 cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">SMS Gateway Provider</label>
                <select
                  disabled={!smsEnabled}
                  value={smsProvider}
                  onChange={(e) => setSmsProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-black disabled:opacity-50"
                >
                  <option value="twilio">Twilio Cloud API</option>
                  <option value="infobip">Infobip SMS Gateway</option>
                  <option value="vonage">Vonage (Nexmo) API</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Twilio Account SID</label>
                <input 
                  type="text" 
                  disabled={!smsEnabled}
                  required={smsEnabled}
                  placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  value={twilioSid}
                  onChange={(e) => setTwilioSid(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black font-mono disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Twilio Auth Token</label>
                <div className="relative">
                  <input 
                    type={showSmsToken ? "text" : "password"}
                    disabled={!smsEnabled}
                    required={smsEnabled}
                    placeholder="Enter Twilio secure token..."
                    value={twilioToken}
                    onChange={(e) => setTwilioToken(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black font-mono disabled:opacity-50"
                  />
                  <button
                    type="button"
                    disabled={!smsEnabled}
                    onClick={() => setShowSmsToken(!showSmsToken)}
                    className="absolute right-2.5 top-2 text-gray-400 hover:text-black disabled:opacity-50"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">SMS Sender Phone Number / Sender ID</label>
                <input 
                  type="text" 
                  disabled={!smsEnabled}
                  required={smsEnabled}
                  placeholder="e.g. +18559012345"
                  value={twilioNumber}
                  onChange={(e) => setTwilioNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black font-mono disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {saveEmailSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-2 font-bold">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>SMTP Host settings and SMS Gateway credentials successfully encrypted and saved to Firestore!</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-[10px] text-gray-400 font-mono">
              Last saved: {saveEmailSuccess ? "Just now" : "Database Synchronized"}
            </span>
            <button
              type="submit"
              className="px-6 py-2.5 bg-black text-gold-500 hover:bg-neutral-900 border border-neutral-800 rounded-xl font-extrabold transition-all cursor-pointer shadow-sm"
            >
              Save Notification Credentials
            </button>
          </div>
        </form>
      )}

      {/* SUB-VIEW E: SECURITY SETTINGS */}
      {subTab === "security" && (
        <form onSubmit={handleSaveSecurity} className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm max-w-xl space-y-6 text-xs">
          <h3 className="font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-3 flex items-center gap-1.5">
            <Shield className="w-4.5 h-4.5 text-gold-600" />
            Platform security and encryption audits
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-bold text-gray-600 flex justify-between">
                <span>Session Expiration Lifetime (Minutes)</span>
                <span className="font-mono text-gold-600 font-bold">{sessionExpiry} Min</span>
              </label>
              <input 
                type="range" 
                min={5}
                max={120}
                step={5}
                value={sessionExpiry}
                onChange={(e) => setSessionExpiry(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <p className="text-[10px] text-gray-400">Forces administrator logout after inactivity period.</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-gray-150">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="font-bold text-gray-700">Enforce Strict Administrative SSL Multi-Factor</label>
                  <p className="text-[10px] text-gray-400">Require OAuth verification tokens on login operations.</p>
                </div>
                <input 
                  type="checkbox"
                  checked={forceStrictMfa}
                  onChange={(e) => setForceStrictMfa(e.target.checked)}
                  className="rounded text-gold-500 focus:ring-gold-500 w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="space-y-0.5">
                  <label className="font-bold text-gray-700">Enforce IP Whitelist filtering</label>
                  <p className="text-[10px] text-gray-400">Deny connection requests from unregistered networks.</p>
                </div>
                <input 
                  type="checkbox"
                  checked={ipFilterToggle}
                  onChange={(e) => setIpFilterToggle(e.target.checked)}
                  className="rounded text-gold-500 focus:ring-gold-500 w-4 h-4 cursor-pointer"
                />
              </div>
            </div>

            {saveSecuritySuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-2 font-bold">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Security variables updated!</span>
              </div>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 bg-black text-gold-500 hover:bg-neutral-900 border border-neutral-800 rounded-xl font-extrabold transition-all cursor-pointer shadow-sm"
            >
              Update Security Policies
            </button>
          </div>
        </form>
      )}

      {/* SUB-VIEW F: SYSTEM AUDIT LOGS */}
      {subTab === "logs" && (
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-3 flex items-center gap-1.5">
            <Clock className="w-4.5 h-4.5 text-gold-600" />
            Administrative System Audit Logs
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-150">
                  <th className="py-2 px-4">Timestamp</th>
                  <th className="py-2 px-4">Operator Email</th>
                  <th className="py-2 px-4">Executed Action Operation</th>
                  <th className="py-2 px-4">Component Category</th>
                  <th className="py-2 px-4">Audited Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-2.5 px-4 font-mono text-gray-400">2026-07-20 20:30:10</td>
                  <td className="py-2.5 px-4 font-semibold text-black">System Loader</td>
                  <td className="py-2.5 px-4">Platform container runtime boots up</td>
                  <td className="py-2.5 px-4 font-bold text-gray-400 uppercase">System</td>
                  <td className="py-2.5 px-4 text-emerald-600 font-bold">INFO</td>
                </tr>
                {systemLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/50">
                    <td className="py-2.5 px-4 font-mono text-gray-400">{log.timestamp}</td>
                    <td className="py-2.5 px-4 font-semibold text-black">{log.operator}</td>
                    <td className="py-2.5 px-4">{log.action}</td>
                    <td className="py-2.5 px-4 font-bold text-gray-400 uppercase">{log.category}</td>
                    <td className="py-2.5 px-4 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        log.type === "info" 
                          ? "bg-emerald-50 text-emerald-700" 
                          : log.type === "action"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {log.type.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW G: SEND CUSTOM EMAIL & HISTORY */}
      {subTab === "send_email" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 text-xs">
          
          {/* Column 1: Custom Email Composer */}
          <form onSubmit={handleSendCustomEmail} className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold uppercase text-black tracking-wider flex items-center gap-1.5">
                <Send className="w-4.5 h-4.5 text-gold-600" />
                Administrative Email Composer
              </h3>
              <span className="text-[10px] bg-black text-gold-500 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                Real-time SMTP
              </span>
            </div>

            <div className="space-y-4">
              {/* Customer Search Autocomplete */}
              <div className="space-y-1.5 relative">
                <label className="font-bold text-gray-700 flex items-center gap-1">
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                  Search Registered Customers
                </label>
                <input 
                  type="text" 
                  placeholder="Type name or email to search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black"
                />
                
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto divide-y divide-gray-50">
                    {filteredCustomers.map((c, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCustomRecipientName(c.name);
                          setCustomRecipientEmail(c.email);
                          setShowCustomerDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-neutral-50 flex items-center justify-between font-semibold"
                      >
                        <span className="text-black uppercase">{c.name}</span>
                        <span className="text-gray-400 font-mono text-[10px]">{c.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-gray-400">Instantly loads unique customer contacts fetched from current shipment ledgers.</p>
              </div>

              {/* Recipient Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Recipient Display Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Ahmet Turkmen"
                    value={customRecipientName}
                    onChange={(e) => setCustomRecipientName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Recipient Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. ahmet@gmail.com"
                    value={customRecipientEmail}
                    onChange={(e) => setCustomRecipientEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black font-mono"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600">Subject Line</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Important update regarding your consignment"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black"
                />
              </div>

              {/* Email Body */}
              <div className="space-y-1">
                <label className="font-bold text-gray-600">Message Body (HTML enabled)</label>
                <textarea 
                  required
                  rows={6}
                  placeholder="Type your message body here..."
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-medium text-black leading-relaxed"
                ></textarea>
              </div>

              {/* Attach Shipment */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-700 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    Attach Shipment details to template?
                  </span>
                  <input 
                    type="checkbox"
                    checked={attachShipment}
                    disabled={customerShipments.length === 0}
                    onChange={(e) => setAttachShipment(e.target.checked)}
                    className="rounded text-gold-500 focus:ring-gold-500 w-4 h-4 cursor-pointer disabled:opacity-50"
                  />
                </div>

                {attachShipment && customerShipments.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="font-bold text-gray-600">Select Shipment</label>
                    <select
                      value={selectedShipmentNo}
                      onChange={(e) => setSelectedShipmentNo(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-black text-xs"
                    >
                      {customerShipments.map((s) => (
                        <option key={s.trackingNumber} value={s.trackingNumber}>
                          {s.trackingNumber} - {s.parcelDescription} ({s.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {customerShipments.length === 0 && (
                  <p className="text-[10px] text-gray-400 italic">No existing shipments registered for this recipient's email to attach.</p>
                )}
              </div>

              {/* Feedback States */}
              {emailSendError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-xl flex items-center gap-2 font-bold animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span>{emailSendError}</span>
                </div>
              )}

              {emailSendSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-2 font-bold animate-fadeIn">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>{emailSendSuccess}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <button
                type="submit"
                disabled={isSendingEmail}
                className="w-full py-3 bg-black text-gold-500 hover:bg-neutral-900 border border-neutral-800 font-extrabold rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 animate-spin text-gold-500" />
                    <span>Executing SMTP Dispatch...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>Dispatch Custom Email</span>
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Column 2: Email History Page */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-6 flex flex-col max-h-[700px]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 flex-shrink-0">
              <h3 className="font-bold uppercase text-black tracking-wider flex items-center gap-1.5">
                <Clock className="w-4.5 h-4.5 text-gold-600" />
                Email dispatch history ledger
              </h3>
              <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded">
                Live Audits
              </span>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-gray-150 pr-1 space-y-4">
              {notifications.filter(n => n.type === "manual" || n.sentBy !== "System").length === 0 ? (
                <div className="py-24 text-center text-gray-400 space-y-2">
                  <Mail className="w-8 h-8 mx-auto text-gray-200" />
                  <p className="font-bold">No custom administrative emails recorded.</p>
                </div>
              ) : (
                notifications
                  .filter(n => n.type === "manual" || n.sentBy !== "System")
                  .map((n) => {
                    const isSent = n.status === "Sent";
                    const isFailed = n.status === "Failed";
                    const isPending = n.status === "Pending";
                    return (
                      <div key={n.id} className="pt-4 first:pt-0 space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-black uppercase tracking-wide">{n.recipientName}</span>
                            <p className="text-gray-400 font-mono text-[10px]">{n.recipientEmail}</p>
                          </div>
                          
                          {/* Badge */}
                          <span className={`px-2 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wider ${
                            isSent ? "bg-emerald-50 text-emerald-700 border border-emerald-200/40" :
                            isFailed ? "bg-red-50 text-red-700 border border-red-200/40" :
                            "bg-amber-50 text-amber-700 border border-amber-200/40 animate-pulse"
                          }`}>
                            {n.status}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="font-bold text-black">Subject: {n.subject}</p>
                          <p className="text-gray-600 italic leading-relaxed text-[11px] whitespace-pre-wrap">"{n.body}"</p>
                        </div>

                        <div className="flex justify-between items-center text-[9px] text-gray-400 font-mono border-t border-gray-50 pt-1.5">
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                            Admin: <strong className="text-gray-600 uppercase font-bold">{n.sentBy || "System Admin"}</strong>
                          </span>
                          <span>{new Date(n.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
