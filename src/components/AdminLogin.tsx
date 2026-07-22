import React, { useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { AdminUser } from "../types";
import { ShieldAlert, ShieldCheck, Key, Loader2, ArrowRight, Mail, Lock, CheckCircle2, X } from "lucide-react";
import CompanyLogo from "./CompanyLogo";

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
}

const SUPER_ADMIN_EMAIL = "hfkxjbd@gmail.com";

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState(SUPER_ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot Password modal/view state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState(SUPER_ADMIN_EMAIL);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        const userEmail = (user.email || "").toLowerCase();
        const isSuperAdminEmail = userEmail === SUPER_ADMIN_EMAIL.toLowerCase();

        const adminDocRef = doc(db, "admins", user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (isSuperAdminEmail || adminDoc.exists()) {
          if (!adminDoc.exists()) {
            await setDoc(adminDocRef, {
              uid: user.uid,
              email: user.email,
              name: user.displayName || "Super Administrator",
              role: "Super Administrator",
              isSuperAdmin: true,
              permissions: ["all"],
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            }, { merge: true });
          } else {
            await setDoc(adminDocRef, {
              lastLoginAt: new Date().toISOString(),
            }, { merge: true });
          }

          onLoginSuccess({
            uid: user.uid,
            email: user.email || SUPER_ADMIN_EMAIL,
            name: user.displayName || "System Administrator",
            isAdmin: true,
          });
        } else {
          setError(`Access Denied: The Google account (${user.email}) is not registered as an authorized administrator.`);
        }
      }
    } catch (err: any) {
      console.error("Google Sign-In Error: ", err);
      if (err.code === "auth/unauthorized-domain") {
        const hostname = window.location.hostname;
        setError(
          `Domain "${hostname}" is not authorized for Google Sign-In in Firebase Console. To enable Google Sign-In on Netlify, add "${hostname}" in Firebase Console -> Authentication -> Settings -> Authorized Domains.`
        );
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Google Sign-In popup was closed before completing authorization.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Google Sign-In popup was blocked by your browser. Please allow popups for this domain.");
      } else {
        setError(err.message || "Google Sign-In failed. Please try password sign-in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSecureLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const inputEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!inputEmail || !trimmedPassword) {
      setError("Please fill in both email and password fields.");
      return;
    }

    setLoading(true);
    try {
      let userCred;
      try {
        // Step 1: Attempt direct Firebase Authentication sign-in
        userCred = await signInWithEmailAndPassword(auth, inputEmail, trimmedPassword);
      } catch (authErr: any) {
        console.warn("Firebase Auth sign-in result:", authErr.code, authErr.message);

        // Step 2: If account does not exist or invalid credentials for super admin, auto-provision
        if (
          inputEmail === SUPER_ADMIN_EMAIL.toLowerCase() &&
          (authErr.code === "auth/user-not-found" || authErr.code === "auth/invalid-credential")
        ) {
          try {
            userCred = await createUserWithEmailAndPassword(auth, inputEmail, trimmedPassword);
            setSuccess("Super Administrator account successfully provisioned in Firebase Authentication!");
          } catch (createErr: any) {
            if (createErr.code === "auth/email-already-in-use") {
              setError(
                `Incorrect password for ${inputEmail}. If you forgot your password, click 'Forgot Password?' below to reset it via email.`
              );
              setLoading(false);
              return;
            } else if (createErr.code === "auth/weak-password") {
              setError("Password must be at least 6 characters long.");
              setLoading(false);
              return;
            } else {
              throw createErr;
            }
          }
        } else if (authErr.code === "auth/wrong-password" || authErr.code === "auth/invalid-credential") {
          setError(
            `Incorrect password for ${inputEmail}. If you forgot your password, click 'Forgot Password?' below.`
          );
          setLoading(false);
          return;
        } else if (authErr.code === "auth/too-many-requests") {
          setError("Access temporarily blocked due to multiple failed attempts. Please use 'Forgot Password?' to reset your password.");
          setLoading(false);
          return;
        } else {
          throw authErr;
        }
      }

      if (userCred && userCred.user) {
        const user = userCred.user;
        const adminDocRef = doc(db, "admins", user.uid);

        // Ensure administrator document exists in Firestore with full permissions
        await setDoc(adminDocRef, {
          uid: user.uid,
          email: inputEmail,
          name: user.displayName || "System Administrator",
          role: "Super Administrator",
          isSuperAdmin: true,
          permissions: ["all"],
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        }, { merge: true });

        onLoginSuccess({
          uid: user.uid,
          email: inputEmail,
          name: "System Administrator",
          isAdmin: true,
        });
      } else {
        setError("Invalid administrative email or password. Access Denied.");
      }
    } catch (err: any) {
      console.error("Secure login error:", err);
      setError(err.message || "Invalid administrative email or password. Access Denied.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    const targetEmail = (resetEmail || email || SUPER_ADMIN_EMAIL).trim().toLowerCase();
    if (!targetEmail) {
      setResetError("Please enter your administrator email address.");
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setResetSuccess(`Password reset email sent to ${targetEmail}! Please check your inbox and follow the link to set a new password.`);
    } catch (err: any) {
      console.error("Password reset error:", err);
      if (err.code === "auth/user-not-found") {
        setResetError(`No account registered with email ${targetEmail}.`);
      } else if (err.code === "auth/invalid-email") {
        setResetError("Please provide a valid email address.");
      } else {
        setResetError(err.message || "Failed to send password reset email. Please try again.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl p-8 space-y-8">
        <div className="flex flex-col items-center text-center space-y-3">
          <CompanyLogo size="md" />
          <h2 className="text-xl font-display font-bold text-black mt-2">
            Secure Admin Portal
          </h2>
          <p className="text-xs text-gray-500 max-w-xs">
            Authenticating via live Firebase Authentication & Firestore Security Rules.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-start gap-2.5 text-xs text-green-800">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSecureLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Admin Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="hfkxjbd@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-sm transition-all text-black font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Secure Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email || SUPER_ADMIN_EMAIL);
                  setResetError(null);
                  setResetSuccess(null);
                  setShowResetModal(true);
                }}
                className="text-xs font-semibold text-gold-600 hover:text-gold-700 hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-sm transition-all text-black font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-black hover:bg-neutral-900 text-white font-bold py-3 px-4 rounded-xl transition-all text-sm cursor-pointer shadow-md"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gold-500" />
            ) : (
              <>
                <span>Secure Log In</span>
                <ArrowRight className="w-4 h-4 text-gold-500" />
              </>
            )}
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <span className="relative px-3 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            or use OAuth Identity
          </span>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2.5 px-4 rounded-xl border border-gray-250 transition-all font-semibold text-xs cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Sign in with Google Admin Domain</span>
        </button>
      </div>

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gold-50 text-gold-700 rounded-lg">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900 font-display">
                  Reset Administrator Password
                </h3>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Enter your administrator email address below. Firebase Authentication will send you a secure password reset link directly.
            </p>

            {resetError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex items-start gap-2.5 text-xs text-green-800">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    placeholder="hfkxjbd@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all font-medium text-black"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-900 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  {resetLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gold-500" />
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

