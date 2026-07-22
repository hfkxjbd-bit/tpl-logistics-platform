import React, { useState, useEffect } from "react";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { AdminUser } from "./types";
import CompanyLogo from "./components/CompanyLogo";
import PublicTracking from "./components/PublicTracking";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";

// New page views
import HomeView from "./components/HomeView";
import ServicesView from "./components/ServicesView";
import CalculatorView from "./components/CalculatorView";
import BookingView from "./components/BookingView";
import CompanyInfoViews from "./components/CompanyInfoViews";
import LegalViews from "./components/LegalViews";
import LiveChatWidget from "./components/LiveChatWidget";

import {
  Shield,
  Search,
  Globe,
  PhoneCall,
  Mail,
  MapPin,
  Home,
  Info,
  Layers,
  Calculator,
  CalendarDays,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type ActiveTab = "home" | "services" | "calculator" | "book" | "about" | "legal" | "track";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  // Deep linking props/states
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [infoSubTab, setInfoSubTab] = useState<"about" | "branches" | "careers" | "contact" | "faq">("about");
  const [legalSubTab, setLegalSubTab] = useState<"privacy" | "terms">("privacy");

  // Pathname routing & security middleware (Requirement 1, 3, 5, 11, 12, 13)
  useEffect(() => {
    const handlePathAndRouteGuard = () => {
      const pathname = window.location.pathname;
      const isAdmin = pathname === "/admin" || pathname === "/admin/dashboard" || pathname === "/dashboard";
      setIsAdminRoute(isAdmin);

      if (isAdmin) {
        // Prevent search engines from indexing the Admin Login page (Requirement 12)
        let meta = document.querySelector('meta[name="robots"]');
        if (!meta) {
          meta = document.createElement("meta");
          meta.setAttribute("name", "robots");
          meta.setAttribute("content", "noindex, nofollow");
          document.head.appendChild(meta);
        } else {
          meta.setAttribute("content", "noindex, nofollow");
        }

        // Active redirection once session determination is complete
        if (!authLoading) {
          if (adminUser) {
            if (pathname === "/admin" || pathname === "/dashboard") {
              window.history.pushState({}, "", "/admin/dashboard");
              window.dispatchEvent(new Event("popstate"));
            }
          } else {
            if (pathname === "/admin/dashboard" || pathname === "/dashboard") {
              window.history.pushState({}, "", "/admin");
              window.dispatchEvent(new Event("popstate"));
            }
          }
        }
      } else {
        // Sync public SPA routes to activeTab
        if (pathname === "/track" || pathname === "/tracking") {
          setActiveTab("track");
        } else if (pathname === "/book" || pathname === "/book-shipment" || pathname === "/book-carriage") {
          setActiveTab("book");
        } else if (pathname === "/calculator") {
          setActiveTab("calculator");
        } else if (pathname === "/services") {
          setActiveTab("services");
        } else if (pathname === "/about") {
          setActiveTab("about");
        } else if (pathname === "/legal") {
          setActiveTab("legal");
        } else if (pathname === "/" || pathname === "/home") {
          setActiveTab("home");
        }
      }
    };

    handlePathAndRouteGuard();
    window.addEventListener("popstate", handlePathAndRouteGuard);
    
    return () => {
      window.removeEventListener("popstate", handlePathAndRouteGuard);
    };
  }, [adminUser, authLoading]);

  // Secure Session management with auto-expiration & restoration
  useEffect(() => {
    const checkRestoreSession = () => {
      const sessionUserStr = localStorage.getItem("tpl_admin_session_user");
      const sessionExpiryStr = localStorage.getItem("tpl_admin_session_expiry");

      if (sessionUserStr && sessionExpiryStr) {
        const expiry = Number(sessionExpiryStr);
        if (Date.now() < expiry) {
          const user = JSON.parse(sessionUserStr) as AdminUser;
          setAdminUser(user);

          // Slide expiration window on active verification
          const newExpiry = Date.now() + 30 * 60 * 1000; // Extend by 30 mins
          localStorage.setItem("tpl_admin_session_expiry", newExpiry.toString());

          // Redirect to dashboard if they are on /admin or root admin path
          if (window.location.pathname === "/admin") {
            window.history.pushState({}, "", "/admin/dashboard");
            window.dispatchEvent(new Event("popstate"));
          }
        } else {
          // Expired
          localStorage.removeItem("tpl_admin_session_user");
          localStorage.removeItem("tpl_admin_session_expiry");
          setAdminUser(null);
        }
      }
      setAuthLoading(false);
    };

    checkRestoreSession();

    // Firebase Auth State Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const email = (firebaseUser.email || "").toLowerCase();
        if (email === "hfkxjbd@gmail.com") {
          const userObj: AdminUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || "hfkxjbd@gmail.com",
            name: firebaseUser.displayName || "System Administrator",
            isAdmin: true,
          };
          setAdminUser(userObj);
          const expiry = Date.now() + 30 * 60 * 1000;
          localStorage.setItem("tpl_admin_session_user", JSON.stringify(userObj));
          localStorage.setItem("tpl_admin_session_expiry", expiry.toString());
        }
      }
      setAuthLoading(false);
    });

    // Check expiration periodically every 10 seconds
    const interval = setInterval(() => {
      const sessionExpiryStr = localStorage.getItem("tpl_admin_session_expiry");
      if (sessionExpiryStr && Date.now() > Number(sessionExpiryStr)) {
        localStorage.removeItem("tpl_admin_session_user");
        localStorage.removeItem("tpl_admin_session_expiry");
        setAdminUser(null);
        alert("Session Expired: For security reasons, you have been logged out due to inactivity.");
        window.history.pushState({}, "", "/");
        window.dispatchEvent(new Event("popstate"));
      }
    }, 10000);

    return () => {
      unsubscribeAuth();
      clearInterval(interval);
    };
  }, []);

  // Event listener for global programmatic navigation triggers
  useEffect(() => {
    const handleNavigation = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.tab) {
        const targetTab = customEvent.detail.tab;
        if (targetTab === "services") {
          setSelectedServiceId(customEvent.detail.service);
          setActiveTab("services");
        } else if (["about", "branches", "careers", "contact", "faq"].includes(targetTab)) {
          setInfoSubTab(targetTab);
          setActiveTab("about");
        } else if (["privacy", "terms"].includes(targetTab)) {
          setLegalSubTab(targetTab);
          setActiveTab("legal");
        } else if (targetTab === "admin" || targetTab === "dashboard" || targetTab === "admin-dashboard") {
          window.history.pushState({}, "", adminUser ? "/admin/dashboard" : "/admin");
          window.dispatchEvent(new Event("popstate"));
        } else {
          setActiveTab(targetTab as ActiveTab);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    window.addEventListener("tpl-navigate", handleNavigation);
    return () => window.removeEventListener("tpl-navigate", handleNavigation);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
    localStorage.removeItem("tpl_admin_session_user");
    localStorage.removeItem("tpl_admin_session_expiry");
    setAdminUser(null);
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new Event("popstate"));
  };

  const handleLoginSuccess = (user: AdminUser) => {
    const expiry = Date.now() + 30 * 60 * 1000; // 30 mins session duration
    localStorage.setItem("tpl_admin_session_user", JSON.stringify(user));
    localStorage.setItem("tpl_admin_session_expiry", expiry.toString());

    setAdminUser(user);
    window.history.pushState({}, "", "/admin/dashboard");
    window.dispatchEvent(new Event("popstate"));
  };

  // Programmatic stateful transitions
  const handleTabSwitch = (tab: ActiveTab, sub?: string) => {
    setMobileMenuOpen(false);
    if (tab === "services") {
      setSelectedServiceId(sub);
      setActiveTab("services");
      window.history.pushState({}, "", "/services");
    } else if (tab === "about") {
      setInfoSubTab((sub as any) || "about");
      setActiveTab("about");
      window.history.pushState({}, "", "/about");
    } else if (tab === "legal") {
      setLegalSubTab((sub as any) || "privacy");
      setActiveTab("legal");
      window.history.pushState({}, "", "/legal");
    } else if (tab === "home") {
      setActiveTab("home");
      window.history.pushState({}, "", "/");
    } else {
      setActiveTab(tab);
      window.history.pushState({}, "", `/${tab}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleInstantTrack = (trackingNo: string) => {
    window.history.pushState({}, "", `/track?tracking=${trackingNo}`);
    setActiveTab("track");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div id="tpl-app-root" className="min-h-screen flex flex-col bg-neutral-50 selection:bg-gold-500 selection:text-black font-sans">
      
      {/* 1. Global Premium Responsive Navigation Header - Admin Login page NOT appearing in navigation menu (Requirement 2, 3, 13) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-150/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <CompanyLogo size="sm" className="cursor-pointer" onClick={() => {
            window.history.pushState({}, "", "/");
            window.dispatchEvent(new Event("popstate"));
            handleTabSwitch("home");
          }} />

          {/* Desktop Navigation Link Menu */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {[
              { id: "home", label: "Home", icon: Home },
              { id: "services", label: "Services", icon: Layers },
              { id: "calculator", label: "Calculator", icon: Calculator },
              { id: "book", label: "Book Carriage", icon: CalendarDays },
              { id: "about", label: "Company Hub", icon: Info },
              { id: "track", label: "Track Parcel", icon: Search },
              ...(adminUser ? [{ id: "admin-dashboard", label: "Admin Space", icon: Shield }] : [])
            ].map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    if (link.id === "admin-dashboard") {
                      window.history.pushState({}, "", "/admin/dashboard");
                      window.dispatchEvent(new Event("popstate"));
                    } else {
                      handleTabSwitch(link.id as any);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    !isAdminRoute && activeTab === link.id
                      ? "bg-black text-gold-500 shadow-sm"
                      : "text-gray-500 hover:text-black hover:bg-gray-100/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Hamburger Mobile Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-black transition-all cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown menu drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-gray-150 bg-white px-4 py-4 space-y-2 overflow-hidden"
            >
              {[
                { id: "home", label: "Home", icon: Home },
                { id: "services", label: "Shipping Services", icon: Layers },
                { id: "calculator", label: "Shipping Calculator", icon: Calculator },
                { id: "book", label: "Book a New Shipment", icon: CalendarDays },
                { id: "about", label: "About, Careers & Contact", icon: Info },
                { id: "track", label: "Track a Parcel", icon: Search },
                ...(adminUser ? [{ id: "admin-dashboard", label: "Admin Space", icon: Shield }] : [])
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.id}
                    onClick={() => {
                      if (link.id === "admin-dashboard") {
                        setMobileMenuOpen(false);
                        window.history.pushState({}, "", "/admin/dashboard");
                        window.dispatchEvent(new Event("popstate"));
                      } else {
                        handleTabSwitch(link.id as any);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-all text-left cursor-pointer ${
                      !isAdminRoute && activeTab === link.id
                        ? "bg-black text-gold-500"
                        : "text-gray-500 hover:bg-gray-50 hover:text-black"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. Main Page Render Canvas */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {isAdminRoute ? (
            <motion.div
              key="secure-admin-portal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {authLoading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-2">
                  <div className="w-8 h-8 border-3 border-gold-500 border-t-black rounded-full animate-spin"></div>
                  <span className="text-[10px] font-mono text-gray-400">VERIFYING ADMINISTRATIVE TOKEN...</span>
                </div>
              ) : adminUser ? (
                <AdminPanel user={adminUser} onLogout={handleLogout} />
              ) : (
                <AdminLogin onLoginSuccess={handleLoginSuccess} />
              )}
            </motion.div>
          ) : (
            <>
              {activeTab === "home" && (
                <motion.div
                  key="home-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <HomeView onNavigate={(tab, param) => handleTabSwitch(tab as any, param)} onInstantTrack={handleInstantTrack} />
                </motion.div>
              )}

              {activeTab === "services" && (
                <motion.div
                  key="services-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ServicesView initialServiceId={selectedServiceId} />
                </motion.div>
              )}

              {activeTab === "calculator" && (
                <motion.div
                  key="calculator-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <CalculatorView />
                </motion.div>
              )}

              {activeTab === "book" && (
                <motion.div
                  key="booking-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <BookingView />
                </motion.div>
              )}

              {activeTab === "about" && (
                <motion.div
                  key="company-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <CompanyInfoViews initialSubTab={infoSubTab} />
                </motion.div>
              )}

              {activeTab === "legal" && (
                <motion.div
                  key="legal-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <LegalViews initialTab={legalSubTab} />
                </motion.div>
              )}

              {activeTab === "track" && (
                <motion.div
                  key="track-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <PublicTracking />
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </main>

      {/* 3. Global Floating AI Chatbot Assistant */}
      <LiveChatWidget />

      {/* 4. Luxury Premium Footer */}
      <footer className="bg-black text-white py-12 px-4 border-t border-neutral-950 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-neutral-900 text-xs">
          {/* Logo + About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg bg-white/10 p-1.5 border border-gold-500/30 w-7 h-7">
                <span className="text-[10px] font-mono font-extrabold text-gold-500">TPL</span>
              </div>
              <span className="font-display font-bold text-sm tracking-wide text-white uppercase">
                Turkmenistanyn Poçtasy Limited
              </span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              Serving as the national regulatory postal authority and central Silk Road freight distribution gateway of Turkmenistan. Delivering verified trust, speed, and continuous tracing.
            </p>
          </div>

          {/* Quick Nav links */}
          <div className="space-y-4">
            <h4 className="font-bold text-gold-500 uppercase tracking-widest text-[10px]">Corporate Channels</h4>
            <div className="space-y-2 text-neutral-300">
              <button onClick={() => {
                window.history.pushState({}, "", "/");
                window.dispatchEvent(new Event("popstate"));
                handleTabSwitch("home");
              }} className="block hover:text-gold-500 transition-colors cursor-pointer text-left">Home Base</button>
              <button onClick={() => {
                window.history.pushState({}, "", "/");
                window.dispatchEvent(new Event("popstate"));
                handleTabSwitch("services");
              }} className="block hover:text-gold-500 transition-colors cursor-pointer text-left">Shipping Services</button>
              <button onClick={() => {
                window.history.pushState({}, "", "/");
                window.dispatchEvent(new Event("popstate"));
                handleTabSwitch("calculator");
              }} className="block hover:text-gold-500 transition-colors cursor-pointer text-left">Tariff Calculator</button>
              <button onClick={() => {
                window.history.pushState({}, "", "/");
                window.dispatchEvent(new Event("popstate"));
                handleTabSwitch("book");
              }} className="block hover:text-gold-500 transition-colors cursor-pointer text-left">Book a Shipment</button>
              {adminUser && (
                <button onClick={() => {
                  window.history.pushState({}, "", "/admin/dashboard");
                  window.dispatchEvent(new Event("popstate"));
                }} className="block text-gold-500 font-extrabold hover:underline transition-colors cursor-pointer text-left">
                  ✦ Admin Portal Dashboard
                </button>
              )}
            </div>
          </div>

          {/* Support channels */}
          <div className="space-y-4">
            <h4 className="font-bold text-gold-500 uppercase tracking-widest text-[10px]">Information Hub</h4>
            <div className="space-y-2 text-neutral-300">
              <button onClick={() => {
                window.history.pushState({}, "", "/");
                window.dispatchEvent(new Event("popstate"));
                handleTabSwitch("about", "about");
              }} className="block hover:text-gold-500 transition-colors cursor-pointer text-left">About TPL</button>
              <button onClick={() => {
                window.history.pushState({}, "", "/");
                window.dispatchEvent(new Event("popstate"));
                handleTabSwitch("about", "branches");
              }} className="block hover:text-gold-500 transition-colors cursor-pointer text-left">Company Branches</button>
              <button onClick={() => {
                window.history.pushState({}, "", "/");
                window.dispatchEvent(new Event("popstate"));
                handleTabSwitch("about", "careers");
              }} className="block hover:text-gold-500 transition-colors cursor-pointer text-left">Logistics Careers</button>
              <button onClick={() => {
                window.history.pushState({}, "", "/");
                window.dispatchEvent(new Event("popstate"));
                handleTabSwitch("about", "faq");
              }} className="block hover:text-gold-500 transition-colors cursor-pointer text-left">Support & FAQs</button>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="font-bold text-gold-500 uppercase tracking-widest text-[10px]">Central Terminal</h4>
            <div className="space-y-2.5 text-neutral-300">
              <p className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-gold-500 flex-shrink-0" />
                <span>+993 12 38-01-02</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold-500 flex-shrink-0" />
                <span>support@tpl-logistics.gov.tm</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold-500 flex-shrink-0" />
                <span>Mollanepes St, Ashgabat, TM</span>
              </p>
            </div>
          </div>
        </div>

        {/* Legal copyrights */}
        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-neutral-500 font-mono">
          <span>© {new Date().getFullYear()} Turkmenistanyn Poçtasy Limited. All rights reserved. Registered UPU code: TM.</span>
          <div className="flex gap-4">
            <button onClick={() => {
              window.history.pushState({}, "", "/");
              window.dispatchEvent(new Event("popstate"));
              handleTabSwitch("legal", "privacy");
            }} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">Privacy Protection</button>
            <button onClick={() => {
              window.history.pushState({}, "", "/");
              window.dispatchEvent(new Event("popstate"));
              handleTabSwitch("legal", "terms");
            }} className="hover:text-white transition-colors cursor-pointer bg-transparent border-none">Terms of Carriage</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
