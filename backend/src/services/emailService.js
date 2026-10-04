/**
 * Email Alert Service
 * Sends automated real-time alert notifications to faculty/mentors when:
 * 1. A student attempts attendance outside the college geofence radius.
 * 2. A student marked present is detected leaving campus during college hours.
 */

const nodemailer = require('nodemailer');

async function sendGpsAlertEmail({
  studentName,
  registerNumber,
  departmentName = 'Computer Science',
  date,
  time,
  distanceMeters,
  allowedRadius = 1000,
  gpsStatus = 'Outside Permitted Location',
  alertType = 'ATTENDANCE_LOCATION_VIOLATION',
  recipientEmail = process.env.ALERT_RECIPIENT_EMAIL || 'santhoshsiva754@gmail.com',
  facultyName = 'Assigned Faculty Mentor',
}) {
  const distanceKm = (Number(distanceMeters) / 1000).toFixed(2);
  const subject = `⚠️ [KCAS Alert] ${
    alertType === 'CAMPUS_LEAVE_VIOLATION'
      ? 'Campus Boundary Violation'
      : 'Invalid Geofence Attendance Attempt'
  }: ${studentName} (${registerNumber})`;

  const alertDetails = {
    institution: 'KAMBAN COLLEGE OF ARTS AND SCIENCE FOR WOMEN',
    studentName,
    registerNumber,
    departmentName,
    date,
    time,
    distanceKm: `${distanceKm} km (${distanceMeters} meters)`,
    allowedRadius: `${allowedRadius} meters`,
    gpsStatus,
    alertType,
    facultyName,
    recipientEmail,
  };

  console.log('\n==================================================');
  console.log('📧 DISPATCHING KCAS FACULTY EMAIL ALERT:');
  console.log(`To: ${recipientEmail} (${facultyName})`);
  console.log(`Subject: ${subject}`);
  console.log('Details:', JSON.stringify(alertDetails, null, 2));
  console.log('==================================================\n');

  // Check for email credentials (Gmail Service or Custom SMTP)
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (emailUser && emailPass) {
    try {
      let transporter;

      if (process.env.SMTP_HOST) {
        // Custom SMTP
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });
      } else {
        // Default Gmail Service
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });
      }

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #701a28; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #701a28; color: #ffffff; padding: 16px; text-align: center;">
            <h2 style="margin: 0; font-size: 18px;">KAMBAN COLLEGE OF ARTS AND SCIENCE FOR WOMEN</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #e2b86e;">Tiruvannamalai – 606 603 • Geofence Monitoring Alert</p>
          </div>
          <div style="padding: 20px; color: #333333; line-height: 1.6;">
            <h3 style="color: #c53030; margin-top: 0;">⚠️ ${
              alertType === 'CAMPUS_LEAVE_VIOLATION'
                ? 'Student Left Campus During College Hours'
                : 'Outside Geofence Attendance Attempt'
            }</h3>
            <p>Dear <strong>${facultyName}</strong>,</p>
            <p>The system detected a location event requiring your attention:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
              <tr style="background-color: #f7fafc;"><td style="padding: 8px; border: 1px solid #edf2f7; font-weight: bold;">Student Name</td><td style="padding: 8px; border: 1px solid #edf2f7;">${studentName}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #edf2f7; font-weight: bold;">Register Number</td><td style="padding: 8px; border: 1px solid #edf2f7;">${registerNumber}</td></tr>
              <tr style="background-color: #f7fafc;"><td style="padding: 8px; border: 1px solid #edf2f7; font-weight: bold;">Department</td><td style="padding: 8px; border: 1px solid #edf2f7;">${departmentName}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #edf2f7; font-weight: bold;">Date & Time</td><td style="padding: 8px; border: 1px solid #edf2f7;">${date} at ${time}</td></tr>
              <tr style="background-color: #f7fafc;"><td style="padding: 8px; border: 1px solid #edf2f7; font-weight: bold;">Distance from Campus</td><td style="padding: 8px; border: 1px solid #edf2f7; color: #c53030; font-weight: bold;">${distanceKm} km (${distanceMeters}m)</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #edf2f7; font-weight: bold;">Permitted Radius</td><td style="padding: 8px; border: 1px solid #edf2f7;">${allowedRadius} meters</td></tr>
              <tr style="background-color: #f7fafc;"><td style="padding: 8px; border: 1px solid #edf2f7; font-weight: bold;">GPS Status</td><td style="padding: 8px; border: 1px solid #edf2f7;">${gpsStatus}</td></tr>
            </table>
            <p style="font-size: 13px; color: #718096;">Please review the student's status on the Faculty Dashboard Location Alerts module.</p>
          </div>
          <div style="background-color: #edf2f7; padding: 12px; text-align: center; font-size: 11px; color: #718096;">
            KCAS Department Management & Geofence Intelligence System
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"KCAS Geofence Alert System" <${emailUser}>`,
        to: recipientEmail,
        subject,
        html: htmlBody,
      });
      console.log(`✅ [SUCCESS] Real Email successfully delivered to ${recipientEmail}`);
    } catch (smtpErr) {
      console.warn('⚠️ SMTP send error (saved in portal database):', smtpErr.message);
    }
  } else {
    console.log('ℹ️ Note: EMAIL_USER / EMAIL_PASS (Gmail App Password) not yet set in .env. Alert successfully stored in portal database.');
  }

  return {
    success: true,
    alertDetails,
  };
}

module.exports = {
  sendGpsAlertEmail,
};
