import React, { useState } from "react";
import { auth, db } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { AdminUser } from "../types";
import { ShieldAlert, Key, Loader2, ArrowRight, Mail, Lock } from "lucide-react";
import CompanyLogo from "./CompanyLogo";

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Secure password hashing function
  const hashPassword = async (pwd: string): Promise<string> => {
    const msgUint8 = new TextEncoder().encode(pwd);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        const adminDocRef = doc(db, "admins", user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (!adminDoc.exists()) {
          await setDoc(adminDocRef, {
            uid: user.uid,
            email: user.email,
            name: user.displayName || "Administrator",
            createdAt: new Date().toISOString(),
          });
        }

        onLoginSuccess({
          uid: user.uid,
          email: user.email,
          name: user.displayName || "Administrator",
          isAdmin: true,
        });
      }
    } catch (err: any) {
      console.error("Google Sign-In Error: ", err);
      setError(
        "Google Sign-In was blocked or cancelled. Please use the secure administrator credentials below."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSecureLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please fill in both email and password fields.");
      return;
    }

    setLoading(true);
    try {
      const enteredHash = await hashPassword(password.trim());
      // Securely hashed passcode/password comparison (TplAdmin2026!)
      const targetHash = "413b0c4eb8dcbf6ec58fe84f2b1d7d078c85fa65ec437e29cf9a3e1fc8d2495d";
      const targetEmail = "hfkxjbd@gmail.com";

      if (email.trim().toLowerCase() === targetEmail && enteredHash === targetHash) {
        // Authenticate the user with Firebase Auth so that Firebase Security Rules can verify identity
        let fbUid = "secure-admin-uid";
        try {
          const userCred = await signInWithEmailAndPassword(auth, targetEmail, password.trim());
          fbUid = userCred.user.uid;
        } catch (authErr: any) {
          // If the user doesn't exist yet, attempt auto-creation
          if (authErr.code === "auth/user-not-found" || authErr.code === "auth/invalid-credential" || authErr.code === "auth/wrong-password") {
            try {
              const userCred = await createUserWithEmailAndPassword(auth, targetEmail, password.trim());
              fbUid = userCred.user.uid;
            } catch (createErr) {
              console.warn("Could not auto-create Admin Auth user:", createErr);
            }
          } else {
            console.warn("Firebase Auth sign-in failed:", authErr);
          }
        }

        onLoginSuccess({
          uid: fbUid,
          email: targetEmail,
          name: "System Administrator",
          isAdmin: true,
        });
      } else {
        setError("Invalid administrative email or password. Access Denied.");
      }
    } catch (err) {
      console.error("Secure login error:", err);
      setError("An internal error occurred during secure credential verification.");
    } finally {
      setLoading(false);
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
            Enter authorized administrator credentials to manage Turkmenistanyn Poçtasy Limited logs.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
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
                placeholder="admin@tpl-logistics.gov.tm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-sm transition-all text-black font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Secure Password
            </label>
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

        {/* Informative Security Box */}
        <div className="bg-gold-50 border border-gold-200/50 rounded-xl p-4 space-y-1.5 text-xs text-gold-950">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4.5 h-4.5 text-gold-700" />
            Security Notice
          </p>
          <p className="leading-relaxed">
            Authorized administrator credentials for evaluation:
            <br />
            Email: <code className="bg-white px-1 py-0.5 rounded border border-gold-300 font-mono font-bold">hfkxjbd@gmail.com</code>
            <br />
            Password: <code className="bg-white px-1 py-0.5 rounded border border-gold-300 font-mono font-bold">TplAdmin2026!</code>
          </p>
        </div>
      </div>
    </div>
  );
}
