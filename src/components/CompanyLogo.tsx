import React from "react";

interface CompanyLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export default function CompanyLogo({ className = "", size = "md", onClick }: CompanyLogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-10 h-10",
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 font-display font-bold tracking-tight select-none ${className}`}
    >
      {/* Premium Geometric Postal Crest */}
      <div className={`relative flex items-center justify-center rounded-lg bg-black p-1.5 border border-gold-500/30 shadow-md ${iconSizes[size]}`}>
        {/* Diamond frame */}
        <div className="absolute inset-0.5 border border-gold-500 rotate-45 rounded-sm"></div>
        {/* Core Letter */}
        <span className="relative text-[10px] sm:text-xs font-mono font-extrabold text-gold-500 tracking-tighter">
          TPL
        </span>
      </div>
      <div className="flex flex-col leading-none">
        <span className={`${sizeClasses[size]} font-extrabold text-black dark:text-black uppercase tracking-wide`}>
          Turkmenistanyn Poçtasy
        </span>
        <span className="text-[10px] sm:text-xs font-mono text-gold-600 font-semibold tracking-wider uppercase">
          Limited Logistics
        </span>
      </div>
    </div>
  );
}
