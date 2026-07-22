import { db, auth } from "../src/lib/firebase.ts";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";

async function testEmail() {
  try {
    await signInWithEmailAndPassword(auth, "hfkxjbd@gmail.com", "ThankGod255@");
    console.log("Logged in as Admin.");

    const snap = await getDoc(doc(db, "settings", "email_config"));
    console.log("Current email_config:", snap.exists() ? snap.data() : "Missing");

  } catch (err) {
    console.error("Test error:", err);
  }
  process.exit(0);
}

testEmail();
