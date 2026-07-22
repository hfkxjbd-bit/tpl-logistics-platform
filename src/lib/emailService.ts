import nodemailer from "nodemailer";
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "./firebase.js";

async function ensureAdminAuth() {
  if (!auth.currentUser) {
    try {
      await signInWithEmailAndPassword(auth, "hfkxjbd@gmail.com", "ThankGod255@");
      console.log("[Email Worker] Authenticated background worker as Super Admin.");
    } catch (err) {
      console.warn("[Email Worker] Background auth warning:", err);
    }
  }
}

export interface SmtpConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  senderName: string;
  fromEmail: string;
  encryption?: string;
}

export function generateEmailHtml(
  recipientName: string,
  trackingNumber: string | null,
  newStatus: string | null,
  currentLocation: string | null,
  parcelDescription: string | null,
  expectedDeliveryDate: string | null,
  bodyMessage: string,
  title: string = "Logistics Update Notification"
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>TPL Logistics - ${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03); }
        .header { background-color: #000000; color: #f59e0b; padding: 32px 24px; text-align: center; border-bottom: 4px solid #f59e0b; }
        .logo-text { font-size: 22px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0; color: #f59e0b; }
        .subtitle { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #9ca3af; margin-top: 6px; text-transform: uppercase; }
        .content { padding: 32px 24px; color: #1f2937; }
        .greeting { font-size: 18px; font-weight: 800; margin-bottom: 12px; color: #111827; }
        .message { font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 24px; }
        .status-badge { display: inline-flex; align-items: center; background-color: #fef3c7; color: #d97706; font-size: 12px; font-weight: 800; padding: 8px 16px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #fde68a; margin-bottom: 24px; }
        .details-card { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
        .details-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #6b7280; }
        .value { font-weight: 700; color: #111827; }
        .footer { background-color: #000000; padding: 32px 24px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
        .footer-logo { font-size: 14px; font-weight: 800; color: #f59e0b; margin-bottom: 12px; letter-spacing: 1px; }
        .footer-text { margin-bottom: 16px; line-height: 1.5; }
        .footer-links a { color: #f59e0b; text-decoration: none; margin: 0 10px; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">Turkmenistanyn Poçtasy</div>
          <div class="subtitle">Global Gateway Logistics & Post</div>
        </div>
        <div class="content">
          <div class="greeting">Dear ${recipientName},</div>
          
          ${newStatus ? `
            <div style="text-align: center;">
              <div class="status-badge">${newStatus}</div>
            </div>
          ` : ""}

          <div class="message">
            ${bodyMessage}
          </div>
          
          ${trackingNumber && trackingNumber !== "GENERAL" && trackingNumber !== "SUPPORT-REPLY" ? `
            <div class="details-card">
              <div class="details-row">
                <span class="label">Tracking ID</span>
                <span class="value" style="font-family: monospace; color: #d97706; font-size: 14px;">${trackingNumber}</span>
              </div>
              ${currentLocation ? `
                <div class="details-row">
                  <span class="label">Current Location</span>
                  <span class="value">${currentLocation}</span>
                </div>
              ` : ""}
              ${expectedDeliveryDate ? `
                <div class="details-row">
                  <span class="label">Expected Delivery</span>
                  <span class="value">${expectedDeliveryDate}</span>
                </div>
              ` : ""}
              ${parcelDescription ? `
                <div class="details-row">
                  <span class="label">Consignment Description</span>
                  <span class="value">${parcelDescription}</span>
                </div>
              ` : ""}
            </div>
          ` : ""}
        </div>
        <div class="footer">
          <div class="footer-logo">TURKMENISTAN POST LIMITED</div>
          <div class="footer-text">
            Official National Postal Regulatory Authority of Turkmenistan.<br/>
            Central Headquarters: Mollanepes Street, Ashgabat, Turkmenistan.<br/>
            Phone: +993 12 38-01-02 | Email: support@tpl-logistics.gov.tm
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  try {
    await ensureAdminAuth();
    const emailConfigSnap = await getDoc(doc(db, "settings", "email_config"));
    
    let smtpHost = process.env.SMTP_HOST || "";
    let smtpPort = parseInt(process.env.SMTP_PORT || "587");
    let smtpUser = process.env.SMTP_USER || "";
    let smtpPass = process.env.SMTP_PASS || "";
    let senderName = process.env.SENDER_NAME || "Turkmenistanyn Poçtasy Support";
    let fromEmail = process.env.SMTP_FROM || smtpUser || "notifications@tpl-logistics.gov.tm";

    if (emailConfigSnap.exists()) {
      const config = emailConfigSnap.data();
      if (config?.smtpHost) smtpHost = config.smtpHost;
      if (config?.smtpPort) smtpPort = parseInt(config.smtpPort);
      if (config?.smtpUser) smtpUser = config.smtpUser;
      if (config?.smtpPass) smtpPass = config.smtpPass;
      if (config?.senderName) senderName = config.senderName;
      if (config?.smtpUser) fromEmail = config.smtpUser;
    }

    if (!smtpHost || !smtpUser || !smtpPass) {
      return null;
    }

    return {
      smtpHost,
      smtpPort: smtpPort || 587,
      smtpUser,
      smtpPass,
      senderName,
      fromEmail
    };
  } catch (err) {
    console.error("Error fetching SMTP config from Firestore:", err);
    return null;
  }
}

export async function sendEmailNotification(
  notifId: string,
  data: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const smtpConfig = await getSmtpConfig();

    if (!smtpConfig) {
      const errorMsg = "SMTP credentials not configured in Settings -> Email & SMS Settings. Please provide SMTP host, username, and password.";
      console.warn(`[Email Worker] Unable to send notification ${notifId}: ${errorMsg}`);
      
      await updateDoc(doc(db, "notifications", notifId), {
        status: "Failed",
        error: errorMsg,
        updatedAt: new Date().toISOString()
      });
      return { success: false, error: errorMsg };
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.smtpHost,
      port: smtpConfig.smtpPort,
      secure: smtpConfig.smtpPort === 465,
      auth: {
        user: smtpConfig.smtpUser,
        pass: smtpConfig.smtpPass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const recipientEmail = data.recipientEmail;
    const recipientName = data.recipientName || "Valued Customer";
    const subject = data.subject || "[TPL Logistics] Notification Update";
    const body = data.body || "";
    const trackingNumber = data.trackingNumber || null;
    const sentBy = data.sentBy || "System";

    let currentLocation = null;
    let parcelDescription = null;
    let expectedDeliveryDate = null;

    if (trackingNumber && trackingNumber !== "GENERAL" && trackingNumber !== "SUPPORT-REPLY") {
      try {
        const shipmentSnap = await getDoc(doc(db, "shipments", trackingNumber));
        if (shipmentSnap.exists()) {
          const s = shipmentSnap.data();
          currentLocation = s?.currentLocation || null;
          parcelDescription = s?.parcelDescription || null;
          expectedDeliveryDate = s?.expectedDeliveryDate || null;
        }
      } catch (e) {
        console.error("Could not fetch shipment details for email:", e);
      }
    }

    const formattedBody = body.includes("<br") || body.includes("<p")
      ? body
      : body.replace(/\n/g, "<br/>");

    const htmlContent = generateEmailHtml(
      recipientName,
      trackingNumber,
      null,
      currentLocation,
      parcelDescription,
      expectedDeliveryDate,
      formattedBody,
      subject
    );

    console.log(`[Email Worker] Attempting SMTP send to ${recipientEmail} via ${smtpConfig.smtpHost}:${smtpConfig.smtpPort}...`);

    await transporter.sendMail({
      from: `"${smtpConfig.senderName}" <${smtpConfig.fromEmail}>`,
      to: recipientEmail,
      subject: subject,
      html: htmlContent
    });

    console.log(`[Email Worker] SUCCESS! Email ${notifId} sent to ${recipientEmail}`);

    await updateDoc(doc(db, "notifications", notifId), {
      status: "Sent",
      error: null,
      sentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return { success: true };

  } catch (err: any) {
    const errorMessage = err?.message || "Unknown SMTP connection error";
    console.error(`[Email Worker] FAILED to send email ${notifId} to ${data?.recipientEmail}:`, err);

    try {
      await updateDoc(doc(db, "notifications", notifId), {
        status: "Failed",
        error: errorMessage,
        updatedAt: new Date().toISOString()
      });
    } catch (dbErr) {
      console.error("Failed to update status to Failed in Firestore:", dbErr);
    }

    return { success: false, error: errorMessage };
  }
}

// Set up real-time listener for pending notifications in Firestore
export function startPendingNotificationListener() {
  console.log("Starting real-time Pending Notification listener...");
  const q = query(collection(db, "notifications"), where("status", "==", "Pending"));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added" || change.type === "modified") {
        const notifId = change.doc.id;
        const data = change.doc.data();
        if (data.status === "Pending") {
          console.log(`[Pending Listener] Detected pending notification doc: ${notifId}`);
          sendEmailNotification(notifId, data);
        }
      }
    });
  }, (err) => {
    console.error("Error in Pending Notification listener:", err);
  });

  return unsubscribe;
}
