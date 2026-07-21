import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();
const db = admin.firestore();

// Formats a premium html email body with brand theme and specific logistics status updates
function generateEmailHtml(
  recipientName: string,
  trackingNumber: string,
  newStatus: string,
  currentLocation: string,
  parcelDescription: string,
  expectedDeliveryDate: string,
  historyDescription: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>TPL Logistics - Status Update Notification</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e5e5; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background-color: #000000; color: #f59e0b; padding: 32px 24px; text-align: center; }
        .logo-text { font-size: 20px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin: 0; }
        .subtitle { font-size: 11px; font-weight: 600; letter-spacing: 1px; color: #a3a3a3; margin-top: 4px; }
        .content { padding: 32px 24px; color: #1f2937; }
        .greeting { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
        .message { font-size: 14px; line-height: 1.6; color: #4b5563; margin-bottom: 24px; }
        .status-badge { display: inline-flex; align-items: center; background-color: #000000; color: #f59e0b; font-size: 11px; font-weight: 800; padding: 6px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid rgba(245, 158, 11, 0.2); }
        .details-card { background-color: #fafafa; border: 1px solid #f0f0f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
        .details-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #6b7280; }
        .value { font-weight: 700; color: #111827; }
        .footer { background-color: #fafafa; padding: 24px; text-align: center; border-t: 1px solid #e5e5e5; font-size: 11px; color: #6b7280; }
        .footer-links { margin-top: 8px; }
        .footer-links a { color: #f59e0b; text-decoration: none; margin: 0 8px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-text">Turkmenistanyn Poçtasy Limited</div>
          <div class="subtitle">Global Gateway Logistics Tracing</div>
        </div>
        <div class="content">
          <div class="greeting">Salamat / Dear ${recipientName},</div>
          <p class="message">
            Your parcel status has been updated in our Central Logistics Database. We continuously monitor and authenticate shipping milestones across all transit nodes.
          </p>
          <div style="text-align: center; margin-bottom: 24px;">
            <div class="status-badge">${newStatus}</div>
          </div>
          <div class="details-card">
            <div class="details-row">
              <span class="label">Tracking Number</span>
              <span class="value" style="font-family: monospace; color: #f59e0b;">${trackingNumber}</span>
            </div>
            <div class="details-row">
              <span class="label">Current Location</span>
              <span class="value">${currentLocation}</span>
            </div>
            <div class="details-row">
              <span class="label">Expected Delivery</span>
              <span class="value">${expectedDeliveryDate || "TBD"}</span>
            </div>
            <div class="details-row">
              <span class="label">Description</span>
              <span class="value">${parcelDescription}</span>
            </div>
          </div>
          <p class="message" style="font-style: italic; border-left: 3px solid #f59e0b; padding-left: 12px; font-size: 13px;">
            <strong>Latest milestone status description:</strong><br/>
            ${historyDescription || "Parcel status changed successfully in Central Logistics Hub."}
          </p>
        </div>
        <div class="footer">
          <div>© 2026 Turkmenistanyn Poçtasy Limited. Ashgabat, Turkmenistan.</div>
          <div class="footer-links">
            <a href="#">Track Shipment</a> | 
            <a href="#">Support Portal</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Main Cloud Function triggered on shipment updates
export const onShipmentStatusUpdated = onDocumentUpdated("shipments/{shipmentId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No snapshot available.");
    return;
  }

  const beforeData = snapshot.before.data();
  const afterData = snapshot.after.data();

  if (!beforeData || !afterData) {
    console.log("Empty document data states.");
    return;
  }

  // Only trigger if status has changed
  if (beforeData.status === afterData.status) {
    console.log(`Status unchanged (${afterData.status}). Bypassing notification.`);
    return;
  }

  console.log(`Shipment status changed from [${beforeData.status}] to [${afterData.status}] for ${afterData.trackingNumber}`);

  const trackingNumber = afterData.trackingNumber;
  const newStatus = afterData.status;
  const currentLocation = afterData.currentLocation || "In Transit";
  const parcelDescription = afterData.parcelDescription || "General Goods";
  const expectedDeliveryDate = afterData.expectedDeliveryDate || "";

  // Extract latest history message if available
  const history = afterData.history || [];
  const latestHistory = history.length > 0 ? history[history.length - 1] : null;
  const historyDescription = latestHistory ? latestHistory.description : `Status updated to ${newStatus}`;

  const recipients = [];
  if (afterData.senderEmail) {
    recipients.push({
      email: afterData.senderEmail,
      name: afterData.senderName,
      type: "Sender",
    });
  }
  if (afterData.receiverEmail) {
    recipients.push({
      email: afterData.receiverEmail,
      name: afterData.receiverName,
      type: "Receiver",
    });
  }

  if (recipients.length === 0) {
    console.log("No recipient emails defined. Bypassing notification.");
    return;
  }

  // Set up mail transport configuration
  // Fallback to demo simulator if credentials are not configured
  const smtpHost = process.env.SMTP_HOST || "smtp.ethereal.email";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";
  const fromEmail = process.env.SMTP_FROM || "notifications@tpl-logistics.gov.tm";

  let transporter: nodemailer.Transporter | null = null;
  let isDemoTransport = false;

  if (smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } else {
    // If credentials are not configured, create a free ethereal test account on the fly or run in dry-run mode
    console.log("SMTP Credentials missing in env. Simulating notification email logs to Firestore.");
    isDemoTransport = true;
  }

  for (const r of recipients) {
    const subject = `[TPL Logistics] Status Update: ${trackingNumber} is now ${newStatus}`;
    const htmlContent = generateEmailHtml(
      r.name,
      trackingNumber,
      newStatus,
      currentLocation,
      parcelDescription,
      expectedDeliveryDate,
      historyDescription
    );

    let deliveryStatus: "Sent" | "Failed" = "Sent";
    let errorMessage = "";

    if (transporter && !isDemoTransport) {
      try {
        await transporter.sendMail({
          from: `"TPL Logistics Notification" <${fromEmail}>`,
          to: r.email,
          subject: subject,
          html: htmlContent,
        });
        console.log(`Notification email successfully sent to ${r.type} (${r.email})`);
      } catch (err: any) {
        console.error(`Failed to send email to ${r.email}:`, err);
        deliveryStatus = "Failed";
        errorMessage = err.message || "Unknown mailer error";
      }
    } else {
      console.log(`[SIMULATED EMAIL]
        To: ${r.name} <${r.email}> (${r.type})
        Subject: ${subject}
        Status: SIMULATED SENT (SMTP credentials not configured)
      `);
    }

    // Always log the notification event into the /notifications collection of Firestore so that the admin can view logs in real-time in the dashboard
    try {
      const notificationLogRef = db.collection("notifications").doc();
      await notificationLogRef.set({
        id: notificationLogRef.id,
        trackingNumber: trackingNumber,
        recipientEmail: r.email,
        recipientName: r.name,
        recipientType: r.type,
        subject: subject,
        body: `Hello ${r.name}, your parcel status is now: ${newStatus}. Location: ${currentLocation}. Expected Delivery: ${expectedDeliveryDate || "N/A"}. Detail: ${historyDescription}`,
        status: isDemoTransport ? "Sent" : deliveryStatus,
        timestamp: new Date().toISOString(),
        error: errorMessage || undefined,
        simulated: isDemoTransport,
      });
    } catch (dbErr) {
      console.error("Failed to log notification to database:", dbErr);
    }
  }
});
