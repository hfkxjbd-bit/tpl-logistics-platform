import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. Live Assistant AI features are disabled.");
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `You are "TPL Live Assistant", the friendly, polite, natural, and highly professional AI Customer Support representative for Turkmenistanyn Poçtasy (Turkmenistan Post) Limited.

Our company is the central national regulatory postal authority and central Silk Road freight distribution gateway of Turkmenistan.

Business Details & FAQ Information:
1. HEADQUARTERS & BRANCHES:
- Central Headquarters: Mollanepes Street, Ashgabat.
- Branches: We have active service branches in Ashgabat, Mary, Turkmenabat, Dashoguz, Balkanabat, and Turkmenbashi.
- Hours of operation: Mon-Sat, 09:00 - 18:00.

2. LOGISTICS & FREIGHT SERVICES:
- Air Freight: Priority aviation network for high-speed logistics (transit: 2-5 business days globally). Features temperature-monitored pharmaceutical logistics and fragile cargo safety. Uses Ashgabat International Airport.
- Sea Freight: Global container shipping (FCL/LCL). Connects via Turkmenbashi International Seaport on the Caspian Sea (transit: 15-30 business days internationally).
- Road Freight: Silk Road overland trucking with GPS-enabled active cargo telemetry trackers (transit: 3-7 business days regionally).
- Express Delivery: Priority courier service for urgent documents and parcels in major metropolitan regions (transit: same-day or next-day).
- International Shipping: Outbound and inbound shipping connecting Turkmenistan to 190+ countries globally (transit: 5-12 business days).
- Domestic Shipping: Economical intra-province cargo transport connecting Ashgabat and all provinces with local branch couriers (transit: 1-3 business days nationwide).

3. CUSTOMS CLEARANCE:
- Turkmenistan Post provides licensed in-house customs brokerage and documentation clearance for incoming and outgoing cargo.
- We coordinate directly with the State Customs Service of Turkmenistan. Clearance usually takes 12-24 hours at border ports.
- Prohibited materials are strictly forbidden. Users can find more regulations on our 'Customs Clearance' page.

4. BOOKINGS:
- Customers can book shipments online through our "Book Carriage" / "Book Shipment" portal.
- Once submitted, our logistics administrators review, assign couriers, and send an automated tracking confirmation email.

5. PAYMENT QUESTIONS:
- We accept cash-on-delivery (COD) for domestic shipping (great for local e-commerce) as well as secure corporate billing.

CRITICAL RULES:
1. PRICING & QUOTATION RULE:
If a customer asks about shipping prices, quotes, discounts, rates, tariffs, or special rates, you MUST ALWAYS respond with exactly this text, and nothing else regarding pricing or quotes:
"For shipping prices and personalized quotations, please contact our company directly via our official email. Our team will provide you with the most accurate quotation based on your shipment details."
Do NOT invent, guess, or estimate any shipping prices or rates, even if the user insists.
(Note: You can mention the general features of our services, but never provide currency numbers or specific estimates).

2. UNKNOWN ANSWERS RULE:
If you do not know the answer to a question or if it is outside our services, DO NOT GUESS OR INVENT information. Instead, politely direct the customer to contact our official support team via our email (support@tpl-logistics.gov.tm) or phone (+993 12 38-01-02).

3. PROFESSIONALISM & TONE:
Be extremely warm, helpful, professional, and friendly. Speak naturally and concisely like a human customer support agent.

4. TRACKING HELP:
- If a user asks about tracking a package, explain how to track it (by entering their 19-character TPL tracking ID in the format TPL-YYYYMMDD-XXXXXX).
- If system notes provide real-time tracking information about a specific shipment, summarize the status of their parcel clearly, including current location, sender, receiver, and estimated delivery, and reassure them of its secure transit.`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded body parsing middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Start real-time email listener background worker
  try {
    const { startPendingNotificationListener } = await import("./src/lib/emailService.ts");
    startPendingNotificationListener();
    console.log("Live email delivery worker started successfully.");
  } catch (workerErr) {
    console.error("Failed to start email delivery worker:", workerErr);
  }

  // API Endpoint to send email directly and wait for result
  app.post("/api/send-email", async (req, res) => {
    try {
      const { recipientEmail, recipientName, subject, body, trackingNumber, sentBy } = req.body;
      if (!recipientEmail || !subject || !body) {
        return res.status(400).json({ error: "Missing required fields: recipientEmail, subject, body" });
      }

      const { db } = await import("./src/lib/firebase.ts");
      const { collection, addDoc } = await import("firebase/firestore");
      const { sendEmailNotification } = await import("./src/lib/emailService.ts");

      const notifDoc = {
        trackingNumber: trackingNumber || "GENERAL",
        recipientEmail: recipientEmail.trim(),
        recipientName: recipientName ? recipientName.trim() : "Valued Customer",
        recipientType: "Customer",
        subject: subject.trim(),
        body: body.trim(),
        status: "Pending",
        timestamp: new Date().toISOString(),
        sentBy: sentBy || "Administrator",
        type: "manual"
      };

      const docRef = await addDoc(collection(db, "notifications"), notifDoc);
      console.log(`Created notification doc ${docRef.id} for immediate email dispatch.`);

      const sendResult = await sendEmailNotification(docRef.id, notifDoc);

      if (sendResult.success) {
        return res.json({
          success: true,
          message: "Email dispatched and delivered successfully via SMTP!",
          notificationId: docRef.id
        });
      } else {
        return res.status(500).json({
          success: false,
          error: sendResult.error || "Failed to deliver email via SMTP",
          notificationId: docRef.id
        });
      }
    } catch (err: any) {
      console.error("API /api/send-email error:", err);
      return res.status(500).json({ error: err.message || "Failed to process email request" });
    }
  });

  // API Endpoint to test SMTP configuration
  app.post("/api/test-email", async (req, res) => {
    try {
      const { getSmtpConfig } = await import("./src/lib/emailService.ts");
      const config = await getSmtpConfig();

      if (!config) {
        return res.status(400).json({
          success: false,
          error: "No SMTP credentials found in Firestore settings/email_config or environment variables."
        });
      }

      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await transporter.verify();
      return res.json({
        success: true,
        message: `SMTP connection verified successfully to ${config.smtpHost}:${config.smtpPort} using account ${config.smtpUser}!`
      });
    } catch (err: any) {
      console.error("SMTP verification error:", err);
      return res.status(500).json({
        success: false,
        error: `SMTP connection failed: ${err.message || "Could not reach or authenticate with SMTP server"}`
      });
    }
  });

  // Server-side Live Chat Assistant Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages format. Must be an array." });
      }

      // Get the last user message text
      const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.parts?.[0]?.text || "";

      // Strict Canned-Response override for pricing queries
      const pricingKeywords = [
        "price", "quote", "quotation", "discount", "special rate", "tariff", "fee", "cost", "how much to ship", "rates", "pricing",
        "baha", "töleg", "скидк", "цена", "стоимост", "тариф"
      ];
      const asksAboutPricing = pricingKeywords.some(keyword => 
        lastUserMessage.toLowerCase().includes(keyword)
      );

      if (asksAboutPricing) {
        return res.json({
          reply: "For shipping prices and personalized quotations, please contact our company directly via our official email. Our team will provide you with the most accurate quotation based on your shipment details."
        });
      }

      // Detect and query tracking number if present in user message
      const trackingRegex = /TPL-[A-Z0-9-]+/i;
      const trackingMatch = lastUserMessage.match(trackingRegex);
      let systemNote = "";

      if (trackingMatch) {
        const trackingNo = trackingMatch[0].toUpperCase().trim();
        try {
          // Dynamic import of Firebase initialization to prevent load crashes
          const { db } = await import("./src/lib/firebase.ts");
          const { doc, getDoc } = await import("firebase/firestore");

          const docRef = doc(db, "shipments", trackingNo);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            systemNote = `\n\n[SYSTEM INFO: Tracking number ${trackingNo} was successfully retrieved. Current real-time shipment passport logs:
- Current Status: ${data.status}
- Sender: ${data.senderName} (${data.originCountry})
- Recipient: ${data.receiverName} (${data.destinationCountry})
- Current Location Terminal: ${data.currentLocation || "In transit"}
- Shipping Method: ${data.shippingMethod || "Standard Cargo"}
- Chargeable Weight: ${data.parcelWeight || "N/A"} kg
- Itemized Description: ${data.parcelDescription || "N/A"}
- Estimated Delivery Date: ${data.expectedDeliveryDate || "N/A"}
- Historical Logs: ${JSON.stringify(data.history || [])}
Reassure the customer and clearly explain these real-time logistics logs to them with extreme care, friendliness, and professionalism.]`;
          } else {
            systemNote = `\n\n[SYSTEM INFO: Tracking number ${trackingNo} was not found in our central Firestore database. Politely guide them to double-check their tracking number or contact support@tpl-logistics.gov.tm.]`;
          }
        } catch (dbErr) {
          console.error("Database tracking lookup failed inside server:", dbErr);
        }
      }

      const ai = getGeminiClient();
      if (!ai) {
        // Fallback responses when API key is missing
        return res.json({
          reply: "Greetings from Turkmenistan Post. Our live assistant chat is currently running in offline demo mode. For real-time tracking, you can use our Tracking portal above, or contact our support team directly via support@tpl-logistics.gov.tm."
        });
      }

      // Map conversation context history into the format expected by Google GenAI SDK (role: 'user' | 'model')
      const geminiContents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : m.role,
        parts: [{ text: m.parts?.[0]?.text || "" }]
      }));

      // Inject the Firestore-retrieved real-time shipment tracking data note to the latest user message
      if (systemNote && geminiContents.length > 0) {
        const lastUserIndex = geminiContents.map(c => c.role).lastIndexOf("user");
        if (lastUserIndex !== -1) {
          geminiContents[lastUserIndex].parts[0].text += systemNote;
        }
      }

      // Enforce starting with user message
      if (geminiContents.length > 0 && geminiContents[0].role !== "user") {
        geminiContents.shift();
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: geminiContents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          maxOutputTokens: 1000,
          temperature: 0.2,
        }
      });

      const replyText = response.text || "I apologize, but I could not formulate a response. Is there anything else I can assist you with?";
      return res.json({ reply: replyText });

    } catch (chatErr: any) {
      console.error("Live Assistant Backend Error:", chatErr);
      return res.status(500).json({ error: chatErr.message || "Internal server error" });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // SPA fallback for dev server (handles routes like /admin, /admin/dashboard, etc. without 404s)
    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(
          path.resolve(__dirname, "index.html"),
          "utf-8"
        );
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Catch-all route to serve SPA index.html for any deep links in production
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
