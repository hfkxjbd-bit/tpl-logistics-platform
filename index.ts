import { onDocumentUpdated, onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();
const db = admin.firestore();

// Formats a premium HTML email body with brand theme and specific logistics details
function generateEmailHtml(
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

          <p class="message">
            ${bodyMessage}
          </p>
          
          ${trackingNumber ? `
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
          <div class="footer-links">
            <a href="#">Official Website</a> | 
            <a href="#">Real-time Portal</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Retrieves dynamic, secure SMTP transporter parameters from Firestore settings or falls back to env variables
async function getSmtpTransporter() {
  const emailConfigSnap = await db.doc("settings/email_config").get();
  
  let smtpHost = process.env.SMTP_HOST || "smtp.ethereal.email";
  let smtpPort = parseInt(process.env.SMTP_PORT || "587");
  let smtpUser = process.env.SMTP_USER || "";
  let smtpPass = process.env.SMTP_PASS || "";
  let fromEmail = process.env.SMTP_FROM || "notifications@tpl-logistics.gov.tm";
  let senderName = "Turkmenistanyn Poçtasy Support";

  if (emailConfigSnap.exists) {
    const config = emailConfigSnap.data();
    if (config?.smtpHost) smtpHost = config.smtpHost;
    if (config?.smtpPort) smtpPort = parseInt(config.smtpPort);
    if (config?.smtpUser) smtpUser = config.smtpUser;
    if (config?.smtpPass) smtpPass = config.smtpPass;
    if (config?.senderName) senderName = config.senderName;
    if (config?.smtpUser) fromEmail = config.smtpUser;
  }

  if (smtpUser && smtpPass) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    return { transporter, fromEmail, senderName, isDemo: false };
  } else {
    console.log("SMTP Credentials missing. Simulating notification email.");
    return { transporter: null, fromEmail, senderName, isDemo: true };
  }
}

// 1. Triggered automatically whenever a customer books a shipment (document created in shipments)
export const onShipmentCreated = onDocumentCreated("shipments/{shipmentId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  if (!data) return;

  console.log(`New shipment booked: ${data.trackingNumber}`);

  const trackingNumber = data.trackingNumber;
  const newStatus = data.status || "Booking Pending";
  const currentLocation = data.currentLocation || "Customer Booked - Scheduled for pickup";
  const parcelDescription = data.parcelDescription || "General Goods";
  const expectedDeliveryDate = data.expectedDeliveryDate || "";

  const recipients = [];
  if (data.senderEmail) {
    recipients.push({
      email: data.senderEmail,
      name: data.senderName,
      type: "Sender",
    });
  }
  if (data.receiverEmail) {
    recipients.push({
      email: data.receiverEmail,
      name: data.receiverName,
      type: "Receiver",
    });
  }

  if (recipients.length === 0) {
    console.log("No recipient emails for new shipment.");
    return;
  }

  const { transporter, fromEmail, senderName, isDemo } = await getSmtpTransporter();

  for (const r of recipients) {
    const subject = `[TPL Logistics] Booking Confirmed: ${trackingNumber}`;
    const htmlContent = generateEmailHtml(
      r.name,
      trackingNumber,
      newStatus,
      currentLocation,
      parcelDescription,
      expectedDeliveryDate,
      `Your online consignment booking has been registered successfully with Turkmenistanyn Poçtasy Limited (TPL). Please drop off your parcel at your nearest TPL office, or present your Waybill Label to our pickup courier.`,
      "Booking Registered"
    );

    let deliveryStatus: "Sent" | "Failed" = "Sent";
    let errorMessage = "";

    if (transporter && !isDemo) {
      try {
        await transporter.sendMail({
          from: `"${senderName}" <${fromEmail}>`,
          to: r.email,
          subject: subject,
          html: htmlContent,
        });
        console.log(`New booking confirmation email sent to ${r.email}`);
      } catch (err: any) {
        console.error(`Failed to send booking email to ${r.email}:`, err);
        deliveryStatus = "Failed";
        errorMessage = err.message || "Unknown SMTP error";
      }
    } else {
      console.log(`[SIMULATED EMAIL] To: ${r.email} - Subject: ${subject}`);
    }

    // Record the notification in Firestore history
    try {
      const notifRef = db.collection("notifications").doc();
      await notifRef.set({
        id: notifRef.id,
        trackingNumber: trackingNumber,
        recipientEmail: r.email,
        recipientName: r.name,
        recipientType: r.type,
        subject: subject,
        body: `Hello ${r.name}, your shipment booking is confirmed. Tracking ID: ${trackingNumber}. Origin: ${data.originCountry}, Destination: ${data.destinationCountry}.`,
        status: isDemo ? "Sent" : deliveryStatus,
        timestamp: new Date().toISOString(),
        error: errorMessage || undefined,
        simulated: isDemo,
        sentBy: "System",
        type: "automated"
      });
    } catch (dbErr) {
      console.error("Failed to log notification for new shipment:", dbErr);
    }
  }
});

// 2. Triggered automatically on any shipment milestone or status change
export const onShipmentStatusUpdated = onDocumentUpdated("shipments/{shipmentId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const beforeData = snapshot.before.data();
  const afterData = snapshot.after.data();

  if (!beforeData || !afterData) return;

  // Only trigger if status or location actually shifted
  if (beforeData.status === afterData.status && beforeData.currentLocation === afterData.currentLocation) {
    console.log("No milestone changes. Bypassing notification.");
    return;
  }

  console.log(`Shipment status changed from [${beforeData.status}] to [${afterData.status}] for ${afterData.trackingNumber}`);

  const trackingNumber = afterData.trackingNumber;
  const newStatus = afterData.status;
  const currentLocation = afterData.currentLocation || "In Transit";
  const parcelDescription = afterData.parcelDescription || "General Goods";
  const expectedDeliveryDate = afterData.expectedDeliveryDate || "";

  // Extract latest history log text for a premium descriptive update
  const history = afterData.history || [];
  const latestHistory = history.length > 0 ? history[history.length - 1] : null;
  const historyDescription = latestHistory ? latestHistory.description : `Consignment milestone status updated successfully to: ${newStatus}`;

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

  const { transporter, fromEmail, senderName, isDemo } = await getSmtpTransporter();

  for (const r of recipients) {
    const subject = `[TPL Logistics] Status Alert: ${trackingNumber} is now ${newStatus}`;
    const htmlContent = generateEmailHtml(
      r.name,
      trackingNumber,
      newStatus,
      currentLocation,
      parcelDescription,
      expectedDeliveryDate,
      `Your shipment transit milestones have been updated in our Central Logistics Database.<br/><br/><strong>Status Details:</strong> ${historyDescription}`,
      "Status Update"
    );

    let deliveryStatus: "Sent" | "Failed" = "Sent";
    let errorMessage = "";

    if (transporter && !isDemo) {
      try {
        await transporter.sendMail({
          from: `"${senderName}" <${fromEmail}>`,
          to: r.email,
          subject: subject,
          html: htmlContent,
        });
        console.log(`Notification email successfully sent to ${r.email}`);
      } catch (err: any) {
        console.error(`Failed to send email to ${r.email}:`, err);
        deliveryStatus = "Failed";
        errorMessage = err.message || "Unknown SMTP error";
      }
    }

    // Always log the notification event into the /notifications collection of Firestore for active tracking
    try {
      const notifRef = db.collection("notifications").doc();
      await notifRef.set({
        id: notifRef.id,
        trackingNumber: trackingNumber,
        recipientEmail: r.email,
        recipientName: r.name,
        recipientType: r.type,
        subject: subject,
        body: `Hello ${r.name}, your parcel status is now: ${newStatus}. Location: ${currentLocation}. Detail: ${historyDescription}`,
        status: isDemo ? "Sent" : deliveryStatus,
        timestamp: new Date().toISOString(),
        error: errorMessage || undefined,
        simulated: isDemo,
        sentBy: "System",
        type: "automated"
      });
    } catch (dbErr) {
      console.error("Failed to log notification history:", dbErr);
    }
  }
});

// 3. Triggered automatically on manual emails composed by administrators (document created in notifications with status "Pending")
export const onNotificationCreated = onDocumentCreated("notifications/{notifId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  if (!data) return;

  // Only handle manual, administrative emails sent with status "Pending"
  if (data.status !== "Pending") {
    return;
  }

  console.log(`Processing manually composed administrator email for ${data.recipientEmail}`);

  const recipientEmail = data.recipientEmail;
  const recipientName = data.recipientName || "Valued Customer";
  const subject = data.subject || "[TPL Logistics] Administrative Notification Update";
  const body = data.body || "";
  const trackingNumber = data.trackingNumber || null;
  const sentBy = data.sentBy || "Administrator";

  let currentLocation = null;
  let parcelDescription = null;
  let expectedDeliveryDate = null;

  // If a valid tracking number was appended to this manual mail, let's inject its details
  if (trackingNumber && trackingNumber !== "SUPPORT-REPLY" && trackingNumber !== "GENERAL") {
    try {
      const shipmentSnap = await db.collection("shipments").doc(trackingNumber).get();
      if (shipmentSnap.exists) {
        const s = shipmentSnap.data();
        currentLocation = s?.currentLocation || null;
        parcelDescription = s?.parcelDescription || null;
        expectedDeliveryDate = s?.expectedDeliveryDate || null;
      }
    } catch (err) {
      console.error("Failed to load attached shipment details for admin mail:", err);
    }
  }

  const { transporter, fromEmail, senderName, isDemo } = await getSmtpTransporter();

  const formattedBody = `This message is sent by TPL Logistics Admin space operator (<strong>${sentBy}</strong>):<br/><br/>${body.replace(/\n/g, "<br/>")}`;

  const htmlContent = generateEmailHtml(
    recipientName,
    trackingNumber === "SUPPORT-REPLY" || trackingNumber === "GENERAL" ? null : trackingNumber,
    null,
    currentLocation,
    parcelDescription,
    expectedDeliveryDate,
    formattedBody,
    "Support Advisory"
  );

  let deliveryStatus: "Sent" | "Failed" = "Sent";
  let errorMessage = "";

  if (transporter && !isDemo) {
    try {
      await transporter.sendMail({
        from: `"${senderName}" <${fromEmail}>`,
        to: recipientEmail,
        subject: subject,
        html: htmlContent,
      });
      console.log(`Admin custom email successfully delivered to ${recipientEmail}`);
    } catch (err: any) {
      console.error(`Admin custom email delivery failed to ${recipientEmail}:`, err);
      deliveryStatus = "Failed";
      errorMessage = err.message || "Unknown SMTP error";
    }
  } else {
    console.log(`[SIMULATED ADMIN EMAIL] To: ${recipientEmail} - Subject: ${subject}`);
  }

  // Update notification document status so the admin console receives real-time delivery confirmation
  try {
    await snapshot.ref.update({
      status: isDemo ? "Sent" : deliveryStatus,
      error: errorMessage || null,
      simulated: isDemo,
      updatedAt: new Date().toISOString()
    });
  } catch (dbErr) {
    console.error("Failed to update custom admin notification status:", dbErr);
  }
});
