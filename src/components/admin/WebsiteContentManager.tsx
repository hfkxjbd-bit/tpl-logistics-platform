import React, { useState, useEffect } from "react";
import { FAQ, Branch, WebContentSettings } from "./adminTypes";
import { 
  Globe, HelpCircle, MapPin, Info, Plus, Trash2, 
  CheckCircle, Edit3, Settings2 
} from "lucide-react";

interface WebsiteContentManagerProps {
  activeTab?: string;
}

export default function WebsiteContentManager({ activeTab }: WebsiteContentManagerProps) {
  const [subTab, setSubTab] = useState<"landing" | "faq" | "branches" | "corporate">("landing");

  // Sync subTab with activeTab prop
  useEffect(() => {
    if (activeTab) {
      if (activeTab === "content") setSubTab("landing");
      else if (activeTab === "company_info") setSubTab("corporate");
      else if (activeTab === "branches") setSubTab("branches");
      else if (activeTab === "faq") setSubTab("faq");
    }
  }, [activeTab]);

  // A. Landing Page states
  const [webContent, setWebContent] = useState<WebContentSettings>({
    heroTitle: "Guaranteed Global Carriage & Premium Logistics",
    heroSubtitle: "We provide state-of-the-art Turkmenistanyn Poçtasy express delivery, cargo shipping, and sequential parcel tracking.",
    supportPhone: "+993 12 380102",
    operatingHours: "Monday - Saturday, 09:00 - 18:00",
    announcement: "Pristine Cargo Air Transits cleared weekly to Istanbul, Frankfurt and London sorting points."
  });
  const [saveLandingSuccess, setSaveLandingSuccess] = useState(false);

  // B. FAQ states
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");
  const [newFaqCat, setNewFaqCat] = useState("general");

  // C. Branches states
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchCity, setBranchCity] = useState("");
  const [branchAddr, setBranchAddr] = useState("");
  const [branchPhone, setBranchPhone] = useState("");
  const [branchEmail, setBranchEmail] = useState("");
  const [branchHours, setBranchHours] = useState("Mon - Sat: 09:00 - 18:00");
  const [branchFeatures, setBranchFeatures] = useState("");
  const [branchCap, setBranchCap] = useState("Medium");

  // Initialize all states from localStorage
  useEffect(() => {
    // 1. Web Content
    const localContent = localStorage.getItem("tpl_web_content");
    if (localContent) {
      setWebContent(JSON.parse(localContent));
    } else {
      localStorage.setItem("tpl_web_content", JSON.stringify(webContent));
    }

    // 2. FAQs
    const localFaqs = localStorage.getItem("tpl_faqs");
    if (localFaqs) {
      setFaqs(JSON.parse(localFaqs));
    } else {
      const defaultFaqs: FAQ[] = [
        { q: "How can I track my shipment online?", a: "Simply enter your unique tracking number in the tracking search bar on our homepage.", category: "tracking" },
        { q: "Do you assist with customs documentation brokerage?", a: "Yes! Turkmenistan Post operates professional licensed customs brokers at Ashgabat Airport.", category: "customs" },
        { q: "Can I schedule a courier pickup?", a: "Absolutely. When booking a shipment on our portal, you can request office pickup.", category: "service" }
      ];
      setFaqs(defaultFaqs);
      localStorage.setItem("tpl_faqs", JSON.stringify(defaultFaqs));
    }

    // 3. Branches
    const localBranches = localStorage.getItem("tpl_branches");
    if (localBranches) {
      setBranches(JSON.parse(localBranches));
    } else {
      const defaultBranches: Branch[] = [
        { id: "br-1", city: "Ashgabat (HQ Central Terminal)", address: "Mollanepes Street, Building 38, Ashgabat", phone: "+993 12 38-01-02", email: "hq@tpl-logistics.gov.tm", hours: "Mon - Sat: 08:00 - 20:00", features: "Automated sort belt, thermal vaults", capacity: "High" },
        { id: "br-2", city: "Mary Regional Terminal", address: "Gurbansoltan Eje Street, Mary", phone: "+993 522 6-12-14", email: "mary@tpl-logistics.gov.tm", hours: "Mon - Sat: 09:00 - 18:00", features: "Overland truck transfer, parcel lockers", capacity: "Medium" }
      ];
      setBranches(defaultBranches);
      localStorage.setItem("tpl_branches", JSON.stringify(defaultBranches));
    }
  }, []);

  // Handlers
  const handleSaveLanding = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("tpl_web_content", JSON.stringify(webContent));
    setSaveLandingSuccess(true);
    setTimeout(() => setSaveLandingSuccess(false), 2000);
  };

  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQ || !newFaqA) return;
    const item: FAQ = { q: newFaqQ, a: newFaqA, category: newFaqCat };
    const updated = [...faqs, item];
    setFaqs(updated);
    localStorage.setItem("tpl_faqs", JSON.stringify(updated));
    setNewFaqQ("");
    setNewFaqA("");
  };

  const handleDeleteFaq = (index: number) => {
    if (confirm("Delete this FAQ topic?")) {
      const updated = faqs.filter((_, i) => i !== index);
      setFaqs(updated);
      localStorage.setItem("tpl_faqs", JSON.stringify(updated));
    }
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchCity || !branchAddr) return;
    const b: Branch = {
      id: `br-${Date.now()}`,
      city: branchCity,
      address: branchAddr,
      phone: branchPhone,
      email: branchEmail,
      hours: branchHours,
      features: branchFeatures,
      capacity: branchCap
    };
    const updated = [...branches, b];
    setBranches(updated);
    localStorage.setItem("tpl_branches", JSON.stringify(updated));
    setBranchCity("");
    setBranchAddr("");
    setBranchPhone("");
    setBranchEmail("");
    setBranchFeatures("");
  };

  const handleDeleteBranch = (id: string) => {
    if (confirm("Permanently delete this branch terminal profile?")) {
      const updated = branches.filter(b => b.id !== id);
      setBranches(updated);
      localStorage.setItem("tpl_branches", JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab select */}
      <div className="flex gap-2 border-b border-gray-150 pb-px flex-wrap">
        {[
          { id: "landing", label: "Landing Content Manager", icon: Globe },
          { id: "faq", label: "FAQ Database CRUD", icon: HelpCircle },
          { id: "branches", label: "Regional Branch Terminal CRUD", icon: MapPin },
          { id: "corporate", label: "Corporate Info Settings", icon: Info }
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

      {/* SUB-TAB A: LANDING PAGE COPY */}
      {subTab === "landing" && (
        <form onSubmit={handleSaveLanding} className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm max-w-2xl space-y-6 text-xs">
          <h3 className="font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-3 flex items-center gap-1.5">
            <Globe className="w-4.5 h-4.5 text-gold-600" />
            Home Landing Page Copy overrides
          </h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="font-bold text-gray-600">Hero Header Headline Title</label>
              <input 
                type="text" 
                required
                value={webContent.heroTitle}
                onChange={(e) => setWebContent({ ...webContent, heroTitle: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-600">Hero Subtitle Paragraph text</label>
              <textarea 
                required
                rows={3}
                value={webContent.heroSubtitle}
                onChange={(e) => setWebContent({ ...webContent, heroSubtitle: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white text-xs font-semibold text-black focus:outline-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-gray-600">Public Hotline Hotline Phone</label>
                <input 
                  type="text" 
                  required
                  value={webContent.supportPhone}
                  onChange={(e) => setWebContent({ ...webContent, supportPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-gray-600">Headquarters Hours</label>
                <input 
                  type="text" 
                  required
                  value={webContent.operatingHours}
                  onChange={(e) => setWebContent({ ...webContent, operatingHours: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-600">Global Banner Promos Announcement</label>
              <input 
                type="text" 
                value={webContent.announcement}
                onChange={(e) => setWebContent({ ...webContent, announcement: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
              />
            </div>

            {saveLandingSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-2 font-bold">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Landing page text variables synchronized!</span>
              </div>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 bg-black text-gold-500 hover:bg-neutral-900 border border-neutral-800 rounded-xl font-extrabold transition-all cursor-pointer shadow-sm"
            >
              Commit Text Modifications
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB B: FAQ DATABASE CRUD */}
      {subTab === "faq" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddFaq} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-xs h-fit">
            <h3 className="font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-gold-600" />
              Manifest New FAQ Topic
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-600">Question Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. What is dimensional weight?"
                  value={newFaqQ}
                  onChange={(e) => setNewFaqQ(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Answer Explanation</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Provide precise details..."
                  value={newFaqA}
                  onChange={(e) => setNewFaqA(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                ></textarea>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">FAQ Category</label>
                <select
                  value={newFaqCat}
                  onChange={(e) => setNewFaqCat(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                >
                  <option value="tracking">Parcel Tracking</option>
                  <option value="pricing">Rates & Weights</option>
                  <option value="customs">Customs Clearance</option>
                  <option value="service">Services & Pickups</option>
                  <option value="safety">Prohibitions & Safety</option>
                  <option value="general">General Help</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-black text-gold-500 hover:bg-neutral-900 border border-neutral-800 font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Add Topic
              </button>
            </div>
          </form>

          {/* FAQs List */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-3 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-gold-600" />
              Active Public FAQs ({faqs.length})
            </h3>

            <div className="space-y-4 divide-y divide-gray-100 max-h-[500px] overflow-y-auto pr-1">
              {faqs.map((faq, idx) => (
                <div key={idx} className="pt-4 first:pt-0 flex justify-between items-start gap-4">
                  <div className="text-xs space-y-1">
                    <span className="px-2 py-0.5 bg-gray-150 text-gray-700 font-bold text-[9px] rounded-full uppercase tracking-wider">
                      {faq.category}
                    </span>
                    <h4 className="font-bold text-black text-sm mt-1">{faq.q}</h4>
                    <p className="text-gray-500 italic mt-1 leading-relaxed">"{faq.a}"</p>
                  </div>
                  <button
                    onClick={() => handleDeleteFaq(idx)}
                    className="text-red-500 hover:text-red-600 p-1 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB C: BRANCH TERMINAL CRUD */}
      {subTab === "branches" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddBranch} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 text-xs h-fit">
            <h3 className="font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-gold-600" />
              Manifest Regional Branch Terminal
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-600">City / Terminal Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Turkmenbashi Seaport"
                  value={branchCity}
                  onChange={(e) => setBranchCity(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Physical Location Address</label>
                <input 
                  type="text" 
                  required
                  placeholder="Full physical street location..."
                  value={branchAddr}
                  onChange={(e) => setBranchAddr(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Operational Hours</label>
                  <input 
                    type="text" 
                    required
                    value={branchHours}
                    onChange={(e) => setBranchHours(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Depot Capacity</label>
                  <select
                    value={branchCap}
                    onChange={(e) => setBranchCap(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-semibold"
                  >
                    <option value="High">High Density</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low sorting</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Contact Telephone</label>
                <input 
                  type="text" 
                  placeholder="+993 12 ..."
                  value={branchPhone}
                  onChange={(e) => setBranchPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-600">Terminal Features / Warehouses</label>
                <input 
                  type="text" 
                  placeholder="e.g. thermal vaults, customs house"
                  value={branchFeatures}
                  onChange={(e) => setBranchFeatures(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-black text-gold-500 hover:bg-neutral-900 border border-neutral-800 font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Manifest Branch Terminal
              </button>
            </div>
          </form>

          {/* Branches list */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-gold-600" />
              Active Central Terminal Network ({branches.length})
            </h3>

            <div className="space-y-4 divide-y divide-gray-100 max-h-[500px] overflow-y-auto pr-1">
              {branches.map((b) => (
                <div key={b.id} className="pt-4 first:pt-0 flex justify-between items-start gap-4">
                  <div className="text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-black text-sm uppercase">{b.city}</h4>
                      <span className="px-2 py-0.5 bg-neutral-900 text-gold-400 font-extrabold text-[9px] rounded uppercase">
                        {b.capacity} Capacity
                      </span>
                    </div>
                    <p className="text-gray-500 font-semibold"><strong className="text-black">Address:</strong> {b.address}</p>
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      Hours: {b.hours} | Phone: {b.phone || "N/A"}
                    </p>
                    <p className="text-gold-700 text-[10px] font-bold uppercase tracking-widest bg-gold-50 w-fit px-1.5 py-0.5 rounded border border-gold-200/40">
                      Features: {b.features}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteBranch(b.id)}
                    className="text-red-500 hover:text-red-600 p-1 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB D: CORPORATE GENERAL PROFILE */}
      {subTab === "corporate" && (
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm max-w-xl space-y-6 text-xs">
          <h3 className="font-bold uppercase text-black tracking-wider border-b border-gray-100 pb-3 flex items-center gap-1.5">
            <Info className="w-4.5 h-4.5 text-gold-600" />
            Corporate Information Settings
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-gray-400 block font-bold uppercase">Corporate Entity</span>
              <p className="font-bold text-black text-sm uppercase">Turkmenistanyn Poçtasy State Transport Company</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-[10px] font-mono tracking-widest text-gray-400 block font-bold uppercase">Universal Postal Union registration Code</span>
              <p className="font-mono font-bold text-neutral-800 text-sm">UPU-TKM-{new Date().getFullYear()}</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-[10px] font-mono tracking-widest text-gray-400 block font-bold uppercase">State Logistics Clearance Licensing</span>
              <p className="font-semibold text-gray-600">TKM-MTC-LIC-0089028-A4 (Ministry of Transport & Communications)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
