import React, { useState } from "react";
import {
  Info,
  MapPin,
  Briefcase,
  PhoneCall,
  Mail,
  Clock,
  Send,
  HelpCircle,
  Search,
  CheckCircle2,
  FileText,
  Compass,
  FileCheck
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";

interface InfoProps {
  initialSubTab?: "about" | "branches" | "careers" | "contact" | "faq";
}

const FAQS = [
  {
    q: "How can I track my shipment online?",
    a: "Simply enter your unique tracking number (e.g., TPL-20260720-000001) in the 'Track Parcel' search bar on our homepage. It will output the complete timeline, current coordinates, and expected carriage delivery date in real-time.",
    category: "tracking"
  },
  {
    q: "What is the difference between physical weight and volumetric weight?",
    a: "Physical weight is the actual weight of the cargo on a scale. Volumetric (dimensional) weight measures the size of the package. Under global IATA regulations, we charge based on the larger of the two values to account for low-density high-volume containers.",
    category: "pricing"
  },
  {
    q: "Do you assist with customs documentation brokerage?",
    a: "Yes! Turkmenistan Post operates professional licensed customs brokers at Ashgabat Air Terminal, Turkmenbashi Seaport, and overland borders. We handle HS code classification, duty prepayments, and regulatory clearing.",
    category: "customs"
  },
  {
    q: "Can I schedule a courier pickup from my business office?",
    a: "Absolutely. When booking a shipment on our portal, you can request office pickup. Our regional couriers will be dispatched to collect, package, and log your parcel.",
    category: "service"
  },
  {
    q: "What items are strictly prohibited from international shipment?",
    a: "In compliance with international Universal Postal Union (UPU) rules, we cannot ship hazardous lithium batteries, flammable aerosols, pressurized canisters, organic perishables, illegal narcotics, or weapons.",
    category: "safety"
  }
];

const BRANCHES = [
  {
    id: "ashgabat-hq",
    city: "Ashgabat (HQ Central Terminal)",
    address: "Mollanepes Street, Building 38, Ashgabat, Turkmenistan",
    phone: "+993 12 38-01-02",
    email: "hq@tpl-logistics.gov.tm",
    hours: "Mon - Sat: 08:00 - 20:00, Sun: 09:00 - 15:00",
    features: "Automated sort belt, custom house, thermal vaults"
  },
  {
    id: "mary-district",
    city: "Mary Regional Terminal",
    address: "Gurbansoltan Eje Street, Mary, Turkmenistan",
    phone: "+993 522 6-12-14",
    email: "mary@tpl-logistics.gov.tm",
    hours: "Mon - Sat: 09:00 - 18:00, Sun: Closed",
    features: "Overland truck transfer, express packet lockers"
  },
  {
    id: "balkan-caspian",
    city: "Turkmenbashi Caspian Gateway",
    address: "Shahyr Street, Turkmenbashi Seaport, Balkan, Turkmenistan",
    phone: "+993 243 4-89-01",
    email: "caspian@tpl-logistics.gov.tm",
    hours: "Mon - Sat: 09:00 - 18:00, Sun: Closed",
    features: "Ocean cargo consolidators, custom clearing house"
  },
  {
    id: "lebap-amudarya",
    city: "Turkmenabat Border Station",
    address: "Bitarap Turkmenistan Avenue, Turkmenabat, Lebap, Turkmenistan",
    phone: "+993 422 3-50-61",
    email: "lebap@tpl-logistics.gov.tm",
    hours: "Mon - Sat: 09:00 - 18:00, Sun: Closed",
    features: "Silk Road rail link cargo transfer station"
  },
  {
    id: "dashoguz-north",
    city: "Dashoguz Regional Branch",
    address: "Al-Khwarizmi Street, Dashoguz, Turkmenistan",
    phone: "+993 322 5-11-20",
    email: "dashoguz@tpl-logistics.gov.tm",
    hours: "Mon - Sat: 09:00 - 18:00, Sun: Closed",
    features: "Agricultural temperature vaults, local dispatch team"
  }
];

const VACANCIES = [
  {
    id: "vac-customs",
    title: "Licensed Customs Clearance Specialist",
    department: "Regulatory Brokerage",
    location: "Ashgabat HQ",
    type: "Full-Time",
    desc: "Coordinate with the State Customs Service to ensure rapid classification, duty valuation, and clearance of international incoming freight cargo."
  },
  {
    id: "vac-logistics",
    title: "Supply Chain Operations Analyst",
    department: "Logistics Optimization",
    location: "Ashgabat HQ",
    type: "Full-Time",
    desc: "Oversee scheduled overland truck routes and air cargo dispatching sequences to optimize transit metrics and reduce terminal dwell."
  },
  {
    id: "vac-courier",
    title: "Regional Logistics Courier (Class B/C)",
    department: "Express Delivery",
    location: "Mary Regional Hub",
    type: "Full-Time",
    desc: "Execute precise door-to-door handoff delivery operations using our corporate electric fleet structures."
  }
];

export default function CompanyInfoViews({ initialSubTab = "about" }: InfoProps) {
  const [subTab, setSubTab] = useState(initialSubTab);

  // Search FAQ state
  const [faqSearch, setFaqSearch] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Active vacancy application target
  const [selectedVacancy, setSelectedVacancy] = useState<typeof VACANCIES[0] | null>(null);
  const [appFormName, setAppFormName] = useState("");
  const [appFormEmail, setAppFormEmail] = useState("");
  const [appFormPhone, setAppFormPhone] = useState("");
  const [appFormLetter, setAppFormLetter] = useState("");
  const [appSuccess, setAppSuccess] = useState(false);
  const [appLoading, setAppLoading] = useState(false);

  // Contact Us state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMessage) return;

    setContactLoading(true);
    const msgId = `contact-${Date.now()}`;
    const payload = {
      id: msgId,
      name: contactName.trim(),
      email: contactEmail.trim(),
      subject: contactSubject.trim() || "General Inquiry",
      message: contactMessage.trim(),
      timestamp: new Date().toISOString(),
      status: "Unread"
    };

    try {
      await setDoc(doc(db, "contacts", msgId), payload);
      setContactSuccess(true);
      setContactName("");
      setContactEmail("");
      setContactSubject("");
      setContactMessage("");
    } catch (err) {
      console.error("Failed to save contact message: ", err);
    } finally {
      setContactLoading(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appFormName || !appFormEmail || !appFormPhone || !selectedVacancy) return;

    setAppLoading(true);
    const appId = `app-${Date.now()}`;
    const payload = {
      id: appId,
      vacancyId: selectedVacancy.id,
      vacancyTitle: selectedVacancy.title,
      name: appFormName.trim(),
      email: appFormEmail.trim(),
      phone: appFormPhone.trim(),
      coverLetter: appFormLetter.trim(),
      timestamp: new Date().toISOString(),
      status: "Submitted"
    };

    try {
      await setDoc(doc(db, "applications", appId), payload);
      setAppSuccess(true);
      setAppFormName("");
      setAppFormEmail("");
      setAppFormPhone("");
      setAppFormLetter("");
    } catch (err) {
      console.error("Failed to save career application: ", err);
    } finally {
      setAppLoading(false);
    }
  };

  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans space-y-8">
      {/* 1. Subnavigation Tab Strip */}
      <div className="flex flex-wrap gap-2 border-b border-gray-150 pb-px">
        {[
          { id: "about", label: "About Us", icon: Info },
          { id: "branches", label: "Branches", icon: MapPin },
          { id: "careers", label: "Careers", icon: Briefcase },
          { id: "contact", label: "Contact Us", icon: PhoneCall },
          { id: "faq", label: "FAQs & Support", icon: HelpCircle }
        ].map((t) => {
          const IconComp = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => {
                setSubTab(t.id as any);
                setAppSuccess(false);
                setSelectedVacancy(null);
                setContactSuccess(false);
              }}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                subTab === t.id
                  ? "border-black text-black font-extrabold"
                  : "border-transparent text-gray-400 hover:text-black"
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Main content area rendering based on subTab */}
      <AnimatePresence mode="wait">
        {subTab === "about" && (
          <motion.div
            key="about"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start py-4"
          >
            {/* Mission Statement & History */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-[10px] font-mono tracking-widest text-gold-600 font-extrabold block">REGULATORY AUTHORITY GATEWAY</span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase text-black">
                Premier Logistics Integrator of Turkmenistan
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Operating under the sovereign frameworks of the State Regulatory Authority and licensed by the Universal Postal Union (UPU Code: TM), Turkmenistanyn Poçtasy Limited serves as the central circulatory pipeline for global air and overland freight crossing Central Asia.
              </p>
              <div className="p-5 bg-gray-50 border border-gray-150 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold uppercase text-black flex items-center gap-2">
                  <Compass className="w-4.5 h-4.5 text-gold-600" />
                  Our Historical Mission
                </h4>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Established with the purpose of reviving the historic commercial routes of the Silk Road, we operate computerized distribution hubs that link China, Central Asia, and Europe. We blend our national postal carriage legacy with modern technology: decentralized databases, live GPS telemetry, and automated custom classifications.
                </p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Whether managing bulk heavy cargo containers in the Turkmenbashi Seaport Caspian Gateway or transporting sensitive medical containers via Express Air freight, TPL guarantees absolute delivery integrity, verified by custom regulatory receipts.
              </p>
            </div>

            {/* Accents, Certificates */}
            <div className="lg:col-span-5 bg-white border border-gray-150 rounded-3xl p-6 shadow-xs space-y-6">
              <span className="text-[9px] font-mono text-gray-400 font-bold block uppercase tracking-wider">Regulatory Standards</span>
              <h4 className="text-xs font-bold text-black uppercase tracking-wide">Standardization Certifications</h4>
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center font-bold text-xs border border-gold-200/40 flex-shrink-0">
                    UPU
                  </div>
                  <div>
                    <span className="text-xs font-bold text-black block">Universal Postal Union (UPU)</span>
                    <span className="text-[10px] text-gray-500 block">Strict alignment with global standard packing regulations & country-level custom clearance matrices.</span>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center font-bold text-xs border border-gold-200/40 flex-shrink-0">
                    ISO
                  </div>
                  <div>
                    <span className="text-xs font-bold text-black block">ISO 9001:2015 Certification</span>
                    <span className="text-[10px] text-gray-500 block">Accredited international standard protocols for logistics storage management, cold chain integrity, and transit timing.</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {subTab === "branches" && (
          <motion.div
            key="branches"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 py-4"
          >
            <div className="space-y-2 max-w-xl">
              <h2 className="text-2xl font-bold tracking-tight uppercase text-black">Active Central Terminal Network</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Find authorized Turkmenistanyn Poçtasy locations across the nation. All branches feature climate-controlled storage vaults, custom document clearances, and public drop-off points.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {BRANCHES.map((b) => (
                <div key={b.id} className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-gold-500 transition-all space-y-4">
                  <div className="space-y-3.5">
                    <span className="text-[10px] font-mono text-gold-600 font-extrabold uppercase bg-gold-50 px-2 py-0.5 rounded border border-gold-200/30">
                      {b.city}
                    </span>
                    <div className="space-y-2 text-xs text-gray-500">
                      <p className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-black flex-shrink-0 mt-0.5" />
                        <span className="font-semibold text-black">{b.address}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <PhoneCall className="w-4 h-4 text-black flex-shrink-0" />
                        <span>{b.phone}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-black flex-shrink-0" />
                        <span>{b.email}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-black flex-shrink-0" />
                        <span>{b.hours}</span>
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100/60 text-[10px] font-mono text-gray-400">
                    <span className="font-bold text-neutral-800">FACILITY Specs:</span> {b.features}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {subTab === "careers" && (
          <motion.div
            key="careers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-4 items-start"
          >
            {/* Vacancy list */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight uppercase text-black">Active Career Vacancies</h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Join our logistics family. We are actively expanding overland truck operations, regulatory brokerage terminals, and digital tracing algorithms.
                </p>
              </div>

              <div className="space-y-4">
                {VACANCIES.map((v) => (
                  <div
                    key={v.id}
                    className={`bg-white border rounded-2xl p-6.5 transition-all space-y-4 shadow-xs ${
                      selectedVacancy?.id === v.id ? "border-black ring-1 ring-black" : "border-gray-150 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold text-gold-600 bg-gold-50 border border-gold-200/50 px-2 py-0.5 rounded uppercase">
                          {v.department} • {v.location}
                        </span>
                        <h4 className="text-sm font-extrabold text-black uppercase tracking-wide mt-1.5">{v.title}</h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 px-2.5 py-0.5 rounded">
                        {v.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{v.desc}</p>
                    <button
                      onClick={() => {
                        setSelectedVacancy(v);
                        setAppSuccess(false);
                      }}
                      className="px-4 py-2 bg-black text-white hover:bg-neutral-900 text-[10px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Briefcase className="w-3.5 h-3.5 text-gold-500" />
                      <span>Apply For This Position</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Application side panel */}
            <div className="lg:col-span-5">
              {selectedVacancy ? (
                <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                  <div>
                    <span className="text-[9px] font-mono text-gray-400 font-bold uppercase block">Secure Application Portal</span>
                    <h3 className="text-xs font-bold text-black uppercase mt-1">Applying: {selectedVacancy.title}</h3>
                  </div>

                  {appSuccess ? (
                    <div className="p-6 bg-green-50 text-green-700 border border-green-150 rounded-2xl space-y-3 text-center">
                      <CheckCircle2 className="w-8 h-8 mx-auto" />
                      <p className="text-xs font-bold uppercase">Application Registered</p>
                      <p className="text-[11px] text-green-600 leading-relaxed">
                        Your professional profile has been saved securely to our Firestore archives. A HR representative will review your coordinates shortly.
                      </p>
                      <button
                        onClick={() => setAppSuccess(false)}
                        className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl text-[10px] uppercase transition-all cursor-pointer mt-2"
                      >
                        Submit another form
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplySubmit} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Your Full Name *</label>
                        <input
                          type="text"
                          required
                          value={appFormName}
                          onChange={(e) => setAppFormName(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Your Email *</label>
                        <input
                          type="email"
                          required
                          value={appFormEmail}
                          onChange={(e) => setAppFormEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Phone Coordinates *</label>
                        <input
                          type="tel"
                          required
                          value={appFormPhone}
                          onChange={(e) => setAppFormPhone(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Short Cover Letter *</label>
                        <textarea
                          required
                          rows={3}
                          value={appFormLetter}
                          onChange={(e) => setAppFormLetter(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={appLoading}
                        className="w-full py-3 bg-black hover:bg-neutral-900 text-gold-500 font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{appLoading ? "Saving Profile..." : "Submit Secure Profile"}</span>
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400 space-y-2 text-xs">
                  <Briefcase className="w-10 h-10 mx-auto text-gray-300" />
                  <p className="font-bold text-black uppercase">No position selected</p>
                  <p>Select an active career vacancy from the list to launch the secure application portal.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {subTab === "contact" && (
          <motion.div
            key="contact"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-4 items-start"
          >
            {/* Coordinate contacts */}
            <div className="lg:col-span-5 space-y-6 text-xs text-gray-500">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight uppercase text-black">Contact Logistics</h2>
                <p className="leading-relaxed">
                  Have an active carriage consignment question or custom clearing inquiry? Speak directly with our dedicated Silk Road support teams.
                </p>
              </div>

              <div className="space-y-4 font-mono">
                <div className="flex gap-3 items-start bg-white p-4 border border-gray-150 rounded-2xl shadow-xs">
                  <PhoneCall className="w-5 h-5 text-gold-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black uppercase block text-[10px]">Logistics Support:</span>
                    <span className="font-bold text-neutral-800 text-xs">+993 12 38-01-02</span>
                  </div>
                </div>
                <div className="flex gap-3 items-start bg-white p-4 border border-gray-150 rounded-2xl shadow-xs">
                  <Mail className="w-5 h-5 text-gold-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black uppercase block text-[10px]">Email Dispatch:</span>
                    <span className="font-bold text-neutral-800 text-xs">support@tpl-logistics.gov.tm</span>
                  </div>
                </div>
                <div className="flex gap-3 items-start bg-white p-4 border border-gray-150 rounded-2xl shadow-xs">
                  <MapPin className="w-5 h-5 text-gold-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-black uppercase block text-[10px]">Central Terminal Node:</span>
                    <span className="font-semibold text-neutral-800 leading-normal">Mollanepes St, Building 38, Ashgabat, TM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-7 bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
                <Compass className="w-5 h-5 text-gold-600" />
                <h3 className="text-xs font-extrabold text-black uppercase tracking-wider">Inquiry Routing Portal</h3>
              </div>

              {contactSuccess ? (
                <div className="p-6 bg-green-50 text-green-700 border border-green-150 rounded-2xl text-center space-y-3">
                  <CheckCircle2 className="w-8 h-8 mx-auto" />
                  <p className="text-xs font-bold uppercase">Consignment Message Sent</p>
                  <p className="text-[11px] text-green-600 leading-relaxed">
                    Your inquiry coordinates have been dispatched directly to our customer support databases. An agent will respond via email shortly.
                  </p>
                  <button
                    onClick={() => setContactSuccess(false)}
                    className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-bold text-[10px] uppercase rounded-xl transition-all cursor-pointer mt-2"
                  >
                    Submit another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Your Email *</label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Inquiry Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Customs Brokerage rates"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Message Details *</label>
                    <textarea
                      required
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs text-black font-semibold"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="px-6 py-3 bg-black hover:bg-neutral-900 text-gold-500 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5 animate-pulse" />
                    <span>{contactLoading ? "Sending inquiry..." : "Dispatched Message"}</span>
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}

        {subTab === "faq" && (
          <motion.div
            key="faq"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 py-4"
          >
            {/* Search FAQ */}
            <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-8 border border-neutral-800 shadow-xl flex flex-col md:flex-row gap-6 justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <HelpCircle className="w-48 h-48 text-gold-400" />
              </div>

              <div className="relative z-10 space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-gold-500 font-extrabold uppercase">SUPPORT PORTAL</span>
                <h3 className="text-lg font-bold text-white mt-1">Frequently Asked Questions</h3>
                <p className="text-xs text-neutral-400 max-w-lg">
                  Search regulatory customs duties, dimensional volumetric weight, or online booking approvals.
                </p>
              </div>

              <div className="relative z-10 w-full md:w-80">
                <div className="bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800 flex items-center gap-2">
                  <div className="pl-2 text-neutral-500">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search FAQ keywords..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className="flex-1 bg-transparent border-none text-white text-xs focus:outline-none placeholder-neutral-500"
                  />
                </div>
              </div>
            </div>

            {/* Search list Accordions */}
            <div className="space-y-3 max-w-4xl mx-auto">
              {filteredFaqs.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-xs font-semibold">
                  No FAQ topics found matching your keywords.
                </div>
              ) : (
                filteredFaqs.map((faq, idx) => (
                  <div key={idx} className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs transition-all">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                      className="w-full p-5 text-left flex justify-between items-center text-xs font-bold text-black uppercase tracking-wide cursor-pointer hover:bg-gray-50/50"
                    >
                      <span>{faq.q}</span>
                      <span className="text-gold-600 font-mono text-base font-extrabold pl-4">
                        {expandedFaq === idx ? "−" : "+"}
                      </span>
                    </button>
                    <AnimatePresence>
                      {expandedFaq === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-100 bg-gray-50/50"
                        >
                          <p className="p-5 text-xs text-gray-500 leading-relaxed font-medium">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
