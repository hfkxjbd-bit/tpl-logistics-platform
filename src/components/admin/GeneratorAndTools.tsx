import React, { useState } from "react";
import { Shipment, ShipmentStatus } from "../../types";
import { 
  Key, Database, Download, Upload, Copy, 
  CheckCircle, RefreshCw, AlertTriangle, FileText, Info 
} from "lucide-react";

interface GeneratorAndToolsProps {
  shipments: Shipment[];
  dbName: string;
  onImportBackup: (importedShipments: Shipment[]) => Promise<void>;
  onResetDatabase: () => Promise<void>;
  actionLoading: boolean;
  onNavigateToShipmentCreation?: (trackingNumber: string) => void;
}

export default function GeneratorAndTools({
  shipments,
  dbName,
  onImportBackup,
  onResetDatabase,
  actionLoading,
  onNavigateToShipmentCreation
}: GeneratorAndToolsProps) {
  // Generator states
  const [seqYear, setSeqYear] = useState(new Date().getFullYear().toString());
  const [seqMonth, setSeqMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, "0"));
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Backup file states
  const [backupFileContent, setBackupFileContent] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");

  // Code generator
  const handleGenerateCode = () => {
    const today = new Date();
    const dateStr = `${seqYear}${seqMonth}${today.getDate().toString().padStart(2, "0")}`;
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const code = `TPL-${dateStr}-${randomSeq}`;
    setGeneratedCodes([code, ...generatedCodes]);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopySuccess(code);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  // Export JSON Database Backup
  const handleDownloadBackup = () => {
    if (shipments.length === 0) {
      alert("No database records exist to back up.");
      return;
    }
    const backupObj = {
      version: `${new Date().getFullYear()}.1`,
      exportedAt: new Date().toISOString(),
      shipments: shipments
    };
    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tpl_logistics_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Restore JSON Database Backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === "string") {
        setBackupFileContent(reader.result);
        setImportStatus("idle");
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async () => {
    if (!backupFileContent) {
      alert("Please upload a valid JSON backup file first.");
      return;
    }
    try {
      const parsed = JSON.parse(backupFileContent);
      if (!parsed.shipments || !Array.isArray(parsed.shipments)) {
        alert("Invalid backup schema. 'shipments' array not found.");
        setImportStatus("error");
        return;
      }
      
      if (confirm(`Are you sure you want to merge ${parsed.shipments.length} shipment record(s) into your current Firestore database?`)) {
        await onImportBackup(parsed.shipments as Shipment[]);
        setImportStatus("success");
        setBackupFileContent(null);
        alert("Database successfully restored and synchronized!");
      }
    } catch (err) {
      console.error(err);
      setImportStatus("error");
      alert("Parsing error. File is not a valid JSON structure.");
    }
  };

  const handleResetClick = async () => {
    if (confirm("⚠️ CRITICAL SECURITY INSTRUCTION:\nAre you sure you want to reset the database? This deletes all shipments and notifications and restores the 2 default Turkmenistanyn Poçtasy sample parcels.")) {
      try {
        await onResetDatabase();
        alert("Logistics database reset successfully completed!");
      } catch (err) {
        alert("Failed to reset database.");
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Grid of Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Module A: Tracking Code Generator */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2 border-b border-gray-100 pb-3">
            <Key className="w-4 h-4 text-gold-600" />
            Turkmenistan Post Identifier Generator
          </h3>

          <div className="space-y-4 text-xs">
            <p className="text-gray-400">
              Generate sequential, secure logistics tracking sequences for cargo carriage. Code contains corporate identifiers, route dates, and secure sequential verification integers.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-gray-600">Sequence Year</label>
                <select 
                  value={seqYear}
                  onChange={(e) => setSeqYear(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer"
                >
                  {[new Date().getFullYear(), new Date().getFullYear() + 1, new Date().getFullYear() - 1, new Date().getFullYear() - 2].map((y) => (
                    <option key={y} value={y.toString()}>
                      {y} {y === new Date().getFullYear() ? "(Current)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-gray-600">Sequence Month</label>
                <select 
                  value={seqMonth}
                  onChange={(e) => setSeqMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0")).map(m => (
                    <option key={m} value={m}>{m} ({new Date(new Date().getFullYear(), parseInt(m) - 1).toLocaleString('default', { month: 'short' })})</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateCode}
              className="w-full py-2.5 bg-black text-gold-500 font-extrabold rounded-xl hover:bg-neutral-900 transition-all border border-neutral-800 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-gold-400" />
              <span>Generate Sequential Tracking Number</span>
            </button>

            {generatedCodes.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Generated Sequences Log</h4>
                <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto pr-1">
                  {generatedCodes.map((code) => (
                    <div key={code} className="py-2.5 flex items-center justify-between text-xs font-mono font-bold text-black">
                      <span>{code}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopyCode(code)}
                          className="p-1 text-gray-400 hover:text-black flex items-center gap-1 font-semibold text-[10px]"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copySuccess === code ? "Copied!" : "Copy"}</span>
                        </button>
                        {onNavigateToShipmentCreation && (
                          <button
                            onClick={() => onNavigateToShipmentCreation(code)}
                            className="p-1 text-gold-600 hover:text-gold-700 flex items-center gap-1 font-semibold text-[10px]"
                          >
                            <span>Use to Create</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Module B: Backup and Recovery Database System */}
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2 border-b border-gray-100 pb-3">
            <Database className="w-4 h-4 text-gold-600" />
            Backup & Restoration Systems
          </h3>

          <div className="space-y-5 text-xs">
            <p className="text-gray-400">
              Download your full logistics database structures as offline portable standard JSON files. Restoring merges cargo, sender registries, and route timeline history structures.
            </p>

            <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl space-y-3">
              <h4 className="font-bold text-black flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-600" />
                Export Full Cloud Backup
              </h4>
              <p className="text-gray-400 text-[11px]">
                Create a snapshot of all {shipments.length} active shipment manifests.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="px-4 py-2 bg-neutral-900 text-gold-500 font-bold rounded-lg hover:bg-black transition-all text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-gold-400" />
                <span>Download Backup .json</span>
              </button>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl space-y-3">
              <h4 className="font-bold text-black flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-amber-600" />
                Upload & Restore Backup file
              </h4>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-black file:text-gold-500 hover:file:bg-neutral-900 cursor-pointer"
              />
              {backupFileContent && (
                <div className="flex gap-2">
                  <button
                    onClick={handleExecuteRestore}
                    disabled={actionLoading}
                    className="px-4 py-1.5 bg-emerald-600 text-white font-extrabold rounded-lg hover:bg-emerald-700 transition-all text-[10px] cursor-pointer"
                  >
                    Confirm Restore Merge
                  </button>
                  <button
                    onClick={() => setBackupFileContent(null)}
                    className="px-3 py-1.5 text-gray-400 hover:text-black font-semibold text-[10px]"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {importStatus === "success" && (
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Merge operation executed successfully!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Module C: Database diagnostics manager */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2 border-b border-gray-100 pb-3">
          <Database className="w-4 h-4 text-gold-600" />
          Cloud Firestore Diagnostics Manager
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Database ID</h4>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono text-black font-semibold truncate select-all">
              {dbName || "ai-studio-ab7004ce-firebase"}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Collection Nodes</h4>
            <div className="divide-y divide-gray-100 font-semibold text-black">
              <div className="py-2 flex justify-between">
                <span className="text-gray-400 uppercase">shipments</span>
                <span>{shipments.length} docs</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-gray-400 uppercase">contacts (messages)</span>
                <span>Real-time</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-gray-400 uppercase">notifications</span>
                <span>Outbound logs</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Destructive Reset Utility</h4>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              Clear the current database completely and deploy pristine Turkmenistan Post sample cargo profiles to resolve connectivity errors.
            </p>
            <button
              onClick={handleResetClick}
              className="py-2 px-4 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200/50 rounded-xl font-bold font-mono transition-all text-[11px] cursor-pointer"
            >
              RESET_CLOUD_DATABASE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
