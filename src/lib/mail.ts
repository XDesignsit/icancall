import nodemailer from 'nodemailer';

// Configure the SMTP transporter using Maileroo
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.maileroo.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailArgs {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Core function to send generic transactional emails using Maileroo SMTP
 */
export async function sendEmail({ to, subject, text, html }: SendEmailArgs) {
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@yourdomain.com';
  const fromName = process.env.SMTP_FROM_NAME || 'iCanCall Support';

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    });

    console.log('✉️ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email via Maileroo SMTP:', error);
    return { success: false, error };
  }
}

/**
 * Sends a visually styled Password Reset email
 */
export async function sendPasswordResetEmail(to: string, name: string, resetLink: string) {
  const subject = 'Reset your iCanCall password';
  const text = `Hi ${name},\n\nWe received a request to reset your password. Click the link below to set a new password:\n\n${resetLink}\n\nThis link will expire in 1 hour. If you did not make this request, you can safely ignore this email.\n\nBest,\nThe iCanCall Team`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 1.25rem; font-weight: 700; color: #1e3a8a; letter-spacing: -0.025em;">iCanCall</span>
      </div>
      <h2 style="color: #0f172a; font-size: 1.5rem; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.025em;">Password Reset Request</h2>
      <p style="color: #475569; font-size: 1rem; line-height: 1.6; margin: 0 0 24px 0;">Hi ${name},</p>
      <p style="color: #475569; font-size: 1rem; line-height: 1.6; margin: 0 0 28px 0;">We received a request to reset the password for your iCanCall account. Click the button below to secure your account and set a new password:</p>
      <div style="margin-bottom: 28px;">
        <a href="${resetLink}" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Reset Password</a>
      </div>
      <p style="color: #64748b; font-size: 0.875rem; line-height: 1.6; margin: 0 0 24px 0;">This button will expire in 1 hour. If you didn't ask to reset your password, you can safely disregard this message.</p>
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0 20px 0;" />
      <p style="color: #94a3b8; font-size: 0.775rem; line-height: 1.5; margin: 0;">If you're having trouble clicking the button, copy and paste this URL into your browser:<br />
        <a href="${resetLink}" style="color: #3b82f6; text-decoration: underline; word-break: break-all;">${resetLink}</a>
      </p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
}

/**
 * Sends a styled System or Security Alert email
 */
export async function sendSystemAlertEmail(to: string, alertTitle: string, severity: 'info' | 'warning' | 'critical', message: string) {
  const subject = `[iCanCall Alert] ${alertTitle}`;
  const text = `iCanCall System Alert:\n\nTitle: ${alertTitle}\nSeverity: ${severity.toUpperCase()}\n\nDescription:\n${message}\n\nIf you have any questions, please contact support.`;

  const colorMap = {
    info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a', label: 'INFO' },
    warning: { bg: '#fffbeb', border: '#fde68a', text: '#78350f', label: 'WARNING' },
    critical: { bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d', label: 'CRITICAL' }
  };

  const scheme = colorMap[severity] || colorMap.info;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 1.25rem; font-weight: 700; color: #1e3a8a; letter-spacing: -0.025em;">iCanCall</span>
        <span style="display: inline-block; padding: 4px 10px; background-color: ${scheme.bg}; border: 1px solid ${scheme.border}; color: ${scheme.text}; font-size: 0.75rem; font-weight: 700; border-radius: 6px; letter-spacing: 0.05em;">${scheme.label}</span>
      </div>
      <h2 style="color: #0f172a; font-size: 1.35rem; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.02em;">${alertTitle}</h2>
      <div style="background-color: #f8fafc; border-left: 4px solid ${scheme.border}; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
        <p style="color: #334155; font-size: 0.95rem; line-height: 1.6; margin: 0;">${message}</p>
      </div>
      <p style="color: #64748b; font-size: 0.875rem; line-height: 1.6; margin: 0 0 16px 0;">If you performed this action or recognize this event, no action is required.</p>
      <p style="color: #64748b; font-size: 0.875rem; line-height: 1.6; margin: 0;">If this seems suspicious, please secure your account immediately or notify our tech support desk.</p>
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0 20px 0;" />
      <p style="color: #94a3b8; font-size: 0.75rem; text-align: center; margin: 0;">&copy; 2026 iCanCall Technologies Inc. All rights reserved.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
}

/**
 * Sends a highly-interactive Voicemail Notification email
 */
export async function sendVoicemailAlertEmail(
  to: string,
  callerName: string,
  duration: string,
  recordingLink: string,
  transcription?: string
) {
  const subject = `New voicemail from ${callerName} (${duration})`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const dashboardLink = `${appUrl}/dashboard?view=log&recordingUrl=${encodeURIComponent(recordingLink)}&transcription=${encodeURIComponent(transcription || '')}&caller=${encodeURIComponent(callerName)}&duration=${encodeURIComponent(duration)}`;

  const text = `You received a new voicemail from ${callerName}!\n\nDuration: ${duration}\nListen in Dashboard: ${dashboardLink}\n\nTranscript:\n"${transcription || 'No transcription available.'}"`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 1.25rem; font-weight: 700; color: #1e3a8a; letter-spacing: -0.025em;">iCanCall Voicemail</span>
      </div>
      
      <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 24px; border-radius: 12px; margin-bottom: 28px; text-align: center;">
        <div style="width: 48px; height: 48px; background: #2563eb; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
          <!-- Inline Microphone/Audio SVG -->
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1A3 3 0 0 0 9 4v7a3 3 0 0 0 6 0V4a3 3 0 0 0 -3 -3z" fill="#ffffff"/>
            <path d="M19 10v1a7 7 0 0 1 -14 0v-1M12 18v4m-4 0h8" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h3 style="color: #1e3a8a; font-size: 1.2rem; font-weight: 700; margin: 0 0 4px 0;">New Voicemail Message</h3>
        <p style="color: #1e40af; font-size: 0.9rem; font-weight: 500; margin: 0;">From: <strong>${callerName}</strong> &bull; Duration: <strong>${duration}</strong></p>
      </div>

      <h4 style="color: #0f172a; font-size: 0.95rem; font-weight: 700; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">Audio Transcript</h4>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 8px; font-style: italic; color: #334155; font-size: 0.975rem; line-height: 1.6; margin-bottom: 28px;">
        "${transcription || 'No audio transcript was generated.'}"
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        <a href="${dashboardLink}" style="flex: 1; text-align: center; padding: 12px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.95rem; display: block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Listen in Dashboard</a>
      </div>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0 20px 0;" />
      <p style="color: #94a3b8; font-size: 0.775rem; text-align: center; margin: 0;">You are receiving this because Voicemail Notifications are enabled on your phone line settings.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
}


/**
 * Sends a high-fidelity Welcome & Signup Confirmation email with billing details
 */
export async function sendWelcomeBillingEmail(
  to: string,
  name: string,
  planName: string,
  price: string,
  interval: string,
  paymentStatus: string,
  phoneNumbersIncluded: string
) {
  const subject = `Welcome to iCanCall! Confirmation for your ${planName}`;
  const text = `Hi ${name},\n\nWelcome to iCanCall! Thank you for signing up. Here are your subscription details:\n\nPlan: ${planName}\nPrice: ${price}/${interval}\nStatus: ${paymentStatus}\nVirtual Lines: ${phoneNumbersIncluded}\n\nLogin to your dashboard to configure your emergency call circles.\n\nBest,\nThe iCanCall Team`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="margin-bottom: 24px;">
        <span style="font-size: 1.25rem; font-weight: 700; color: #1e3a8a; letter-spacing: -0.025em;">iCanCall</span>
      </div>
      
      <h2 style="color: #0f172a; font-size: 1.45rem; font-weight: 700; margin: 0 0 12px 0; letter-spacing: -0.025em;">Welcome to iCanCall, ${name}! 🎉</h2>
      <p style="color: #475569; font-size: 1rem; line-height: 1.6; margin: 0 0 24px 0;">We're thrilled to help keep your family safe. Your account has been registered successfully, and your active billing subscription details are summarized below.</p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
        <h4 style="color: #0f172a; font-size: 0.875rem; font-weight: 700; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.05em;">Subscription Summary</h4>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem; line-height: 1.5; color: #334155;">
          <tr>
            <td style="padding: 6px 0; font-weight: 500; color: #64748b;">Selected Plan</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #0f172a;">${planName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 500; color: #64748b;">Amount / Billing Cycle</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #0f172a;">${price} / ${interval}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 500; color: #64748b;">Included Features</td>
            <td style="padding: 6px 0; text-align: right; font-weight: 500; color: #0f172a;">${phoneNumbersIncluded}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0 6px 0; border-top: 1px dashed #e2e8f0; font-weight: 500; color: #64748b;">Billing Status</td>
            <td style="padding: 12px 0 6px 0; text-align: right; font-weight: 700; color: #16a34a;">${paymentStatus}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 28px; text-align: center;">
        <a href="https://icancall.co/dashboard" style="display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Go to Your Dashboard</a>
      </div>

      <p style="color: #64748b; font-size: 0.875rem; line-height: 1.6; margin: 0 0 24px 0;">In your dashboard, you can immediately configure call routing, manage emergency circles, and setup phone lines for your family members.</p>
      
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0 20px 0;" />
      <p style="color: #94a3b8; font-size: 0.775rem; line-height: 1.5; margin: 0; text-align: center;">
        Need help getting started? Check out our <a href="https://icancall.co/help" style="color: #3b82f6; text-decoration: none;">Help Center</a> or email us at support@icancall.co.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
}

