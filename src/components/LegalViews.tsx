import React from "react";
import { FileText, Shield, Scale, Info } from "lucide-react";
import { motion } from "motion/react";

interface LegalProps {
  initialTab?: "privacy" | "terms";
}

export default function LegalViews({ initialTab = "privacy" }: LegalProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans space-y-10">
      {/* View Header */}
      <div className="text-center space-y-2">
        <span className="text-[10px] font-mono font-extrabold text-gold-600 uppercase tracking-widest block">REGULATORY DISCLOSURES</span>
        <h1 className="text-3xl font-display font-extrabold text-black uppercase tracking-tight">
          Legal Framework & carriage terms
        </h1>
        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          Turkmenistanyn Poçtasy Limited operates strictly in alignment with international maritime conventions, aviation laws, and sovereign rules.
        </p>
      </div>

      <div className="bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 text-xs text-gray-500 leading-relaxed">
        {/* Section 1: Terms */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-black uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-gray-100">
            <Scale className="w-4.5 h-4.5 text-gold-600" />
            1. Terms of Carriage & Carriage Liability
          </h3>
          <p>
            By booking a shipment with Turkmenistanyn Poçtasy Limited, the shipper agrees to all terms of carriage, standard custom duty declarations, and dimensional volumetric weight billing.
          </p>
          <div className="bg-gray-50 p-4 border border-gray-150 rounded-2xl space-y-2.5">
            <p className="font-bold text-black uppercase">Standard Limitations of Carriage Liability:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 font-medium pl-1">
              <li>Our liability for lost or damaged cargo is limited strictly to the declared value of the parcel up to a maximum threshold of $100 USD unless additional premium cargo insurance is purchased.</li>
              <li>We are not liable for transit delays caused by customs hold-ups, border closures, weather conditions, or regulatory inspection checks (Force Majeure).</li>
              <li>Volumetric dimensional weights apply to all package dimensions exceeding regular standard layouts.</li>
            </ul>
          </div>
        </div>

        {/* Section 2: Privacy */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-black uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-gray-100">
            <Shield className="w-4.5 h-4.5 text-gold-600" />
            2. Privacy & Automated Tracking Tracing Policy
          </h3>
          <p>
            We respect your private data. To provide real-time updates and notifications, we log sender and receiver coordinates (Name, Phone, Email, Address) in our secure Firestore database vaults.
          </p>
          <p>
            Our automated outbound status notification emails are simulated or dispatched using secure servers. We never sell, rent, or lease your personal coordinates to third-party marketing services. Tracking data remains archived in our systems for up to 180 days post-delivery to facilitate regulatory compliance before secure hashing is completed.
          </p>
        </div>

        {/* Section 3: Compliance */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-black uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-gray-100">
            <Info className="w-4.5 h-4.5 text-gold-600" />
            3. Universal Postal Union & Customs Sovereignty
          </h3>
          <p>
            As a licensed national operator, we coordinate operations with the State Customs Service of Turkmenistan and global postal carriers. Shippers are fully responsible for ensuring cargo does not contain prohibited, flammable, explosive, or toxic items. Customs officials hold full authority to seize, hold, or inspect cargo.
          </p>
        </div>
      </div>
    </div>
  );
}
