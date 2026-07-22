import { db, auth } from "../src/lib/firebase.ts";
import { doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";

async function checkConfig() {
  try {
    await signInWithEmailAndPassword(auth, "hfkxjbd@gmail.com", "ThankGod255@");
    console.log("Logged in as Admin successfully!");
    const snap = await getDoc(doc(db, "settings", "email_config"));
    if (snap.exists()) {
      console.log("EMAIL CONFIG IN FIRESTORE:", JSON.stringify(snap.data(), null, 2));
    } else {
      console.log("No email_config doc in settings collection!");
    }
  } catch (err) {
    console.error("Error reading email config:", err);
  }
  process.exit(0);
}

checkConfig();
