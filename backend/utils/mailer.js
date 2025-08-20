import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerificationCode = async (email, code) => {
  const mailOptions = {
    from: `"Dentax Dental Care" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verification Code for Your Dentax Dental Care Account',
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4A90E2;">Dentax Dental System Email Verification</h2>
                <p>Dear user,</p>
                <p>Please use the following verification code to verify your email address:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="display: inline-block; background-color: #4A90E2; color: white; font-size: 24px; padding: 10px 20px; border-radius: 5px; letter-spacing: 3px;">
                        ${code}
                    </span>
                </div>
                <p>If you did not request this, you can safely ignore this email.</p>
                <p>Best regards,<br><strong>Dentax Dental System Team</strong></p>
                <hr style="margin-top: 40px;">
                <p style="font-size: 12px; color: #888;">Dentax Dental System | Dentax Dental System</p>
            </div>
        `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(`Error sending verification email to ${email}:`, error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

const sendAppointmentConfirmation = async (email, date, start_time) => {
  const mailOptions = {
    from: `"Dentax Dental System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Appointment Confirmation Notice',
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4CAF50;">Appointment Confirmed</h2>
                <p>Dear user,</p>
                <p>We’re pleased to confirm your appointment booking. Please find the details below:</p>
                <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0;"><strong>Date:</strong></td>
                        <td style="padding: 8px 0;">${date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Time:</strong></td>
                        <td style="padding: 8px 0;">${start_time}</td>
                    </tr>
                </table>
                <p style="margin-top: 20px;">Please ensure to be on time. If you have any questions or need to reschedule, feel free to contact us.</p>
                <p>Best regards,<br><strong>Dentax Dental System Team</strong></p>
                <hr style="margin-top: 40px;">
                <p style="font-size: 12px; color: #888;">Dentax Dental System | Dentax Dental System</p>
            </div>
        `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(`Error sending appointment confirmation to ${email}:`, error);
    throw new Error(`Failed to send appointment confirmation: ${error.message}`);
  }
};

const sendtempAppointment = async (email, date, start_time) => {
  const mailOptions = {
    from: `"Dentax Dental System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Appointment Notice',
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
                <h2 style="color: #4CAF50;">Appointment Placed</h2>
                <p>Dear user,</p>
                <p>We’re pleased to place your appointment booking. Please find the details below:</p>
                <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0;"><strong>Date:</strong></td>
                        <td style="padding: 8px 0;">${date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Time:</strong></td>
                        <td style="padding: 8px 0;">${start_time}</td>
                    </tr>
                </table>
                <p style="margin-top: 20px;">Please ensure to be there before the time. Please be kind to inform the receptionist and complete the patient registration before the appointment time. If you have any questions or need to reschedule, feel free to contact us.</p>
                <p>Best regards,<br><strong>Dentax Dental System Team</strong></p>
                <hr style="margin-top: 40px;">
                <p style="font-size: 12px; color: #888;">Dentax Dental System | Dentax Dental System</p>
            </div>
        `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(`Error sending appointment confirmation to ${email}:`, error);
    throw new Error(`Failed to send appointment confirmation: ${error.message}`);
  }
};

const sendAppointmentCancelation = async (email, date, start_time, provider, cancelNote) => {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mailOptions = {
    from: `"Dentax Dental System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Appointment Cancellation Notice',
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
          <h2 style="color: #e53935;">Appointment Cancelled</h2>
          <p>Dear user,</p>
          <p>We’re sorry to inform you that your appointment with <strong>${provider}</strong> has been cancelled. Please find the details below:</p>
          <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0;"><strong>Date:</strong></td>
              <td style="padding: 8px 0;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; vertical-align: top;"><strong>Time:</strong></td>
              <td style="padding: 8px 0;">${start_time}</td>
            </tr>
            ${cancelNote ? `
            <tr>
              <td style="padding: 8px 0; vertical-align: top;"><strong>Reason for Cancellation:</strong></td>
              <td style="padding: 8px 0;">${cancelNote}</td>
            </tr>` : ''}
          </table>
          <p style="margin-top: 20px;">You can reschedule another appointment with ${provider} at your convenience. If you have any questions, feel free to contact us.</p>
          <p>Best regards,<br><strong>Dentax Dental System Team</strong></p>
          <hr style="margin-top: 40px;">
          <p style="font-size: 12px; color: #888;">Dentax Dental System | Dentax Dental System</p>
        </div>
      `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(`Error sending appointment cancellation to ${email}:`, error);
    throw new Error(`Failed to send appointment cancellation: ${error.message}`);
  }
};

const sendAppointmentRescheduleNotice = async (email, pastDate, pastTime, doctorName, newDate, newTime) => {
  const formattedPastDate = new Date(pastDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedNewDate = new Date(newDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const mailOptions = {
    from: `"Dentax Dental System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Appointment Rescheduled Notice',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
        <h2 style="color: #FB8C00;">Appointment Rescheduled</h2>
        <p>Dear user,</p>
        <p>Your appointment with <strong>${doctorName}</strong> has been rescheduled. Please find the updated details below:</p>

        <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0;"><strong>Previous Date:</strong></td>
            <td style="padding: 8px 0;">${formattedPastDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>Previous Time:</strong></td>
            <td style="padding: 8px 0;">${pastTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>New Date:</strong></td>
            <td style="padding: 8px 0;">${formattedNewDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;"><strong>New Time:</strong></td>
            <td style="padding: 8px 0;">${newTime}</td>
          </tr>
        </table>

        <p style="margin-top: 20px;">We apologize for any inconvenience this may have caused. If the new time doesn't work for you, please contact us to reschedule.</p>

        <p>Best regards,<br><strong>Dentax Dental System Team</strong></p>
        <hr style="margin-top: 40px;">
        <p style="font-size: 12px; color: #888;">Dentax Dental System | Dentax Dental System</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(`Error sending appointment reschedule notice to ${email}:`, error);
    throw new Error(`Failed to send appointment reschedule notice: ${error.message}`);
  }
};

const sendAppointmentOverdueNotice = async (email, name, appointments) => {
  if (!appointments || appointments.length === 0) return;

  const mailOptions = {
    from: `"Dentax Dental System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Overdue Appointments Notice',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
        <h2 style="color: #E53935;">Overdue Appointments</h2>
        <p>Dear ${name},</p>
        <p>The following appointments are more than <strong>15 minutes overdue</strong> and the patients have not checked in:</p>

        <table style="width: 100%; margin-top: 20px; border-collapse: collapse; border: 1px solid #ddd;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Appointment ID</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Patient</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Dentist</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Date</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Time</th>
            </tr>
          </thead>
          <tbody>
            ${appointments.map(app => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${app.appointment_id || 'N/A'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${app.patient?.name || 'Unknown'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${app.dentist?.name || 'Unknown'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">
                  ${new Date(app.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">
                  ${app.time_from ? app.time_from : 'N/A'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <p style="margin-top: 20px;">Please take the necessary follow-up actions as needed.</p>

        <p>Best regards,<br><strong>Dentax Dental System Team</strong></p>
        <hr style="margin-top: 40px;">
        <p style="font-size: 12px; color: #888;">Dentax Dental System | Dentax Dental System</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(`Error sending overdue appointment notice to ${email}:`, error);
    throw new Error(`Failed to send overdue appointment notice: ${error.message}`);
  }
};

const sendAccountCreationInvite = async (email, role, link) => {
  const mailOptions = {
    from: `"Dentax Dental System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Dentax Dental System Account Invitation',
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
          <h2 style="color: #43a047;">You're Invited to Join Dentax Dental System</h2>
          <p>Dear user,</p>
          <p>You’ve been invited to join <strong>Dentax Dental System</strong> as a <strong>${role}</strong>.</p>
          <p>Please click the button below to create your account and get started:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #43a047; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Create Account</a>
          </div>
          <p>If the button doesn't work, copy and paste the following link into your browser:</p>
          <p style="word-break: break-all;">${link}</p>
          <p>We're excited to have you on board. If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br><strong>Dentax Dental System Team</strong></p>
          <hr style="margin-top: 40px;">
          <p style="font-size: 12px; color: #888;">Dentax Dental System | Dentax Dental System</p>
        </div>
      `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(`Error sending account creation invite to ${email}:`, error);
    throw new Error(`Failed to send account creation invite: ${error.message}`);
  }
};

const sendAccountCreationNotice = async (email, ID) => {
  const mailOptions = {
    from: `"Dentax Dental System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Dentax Dental System Account Has Been Created',
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
          <h2 style="color: #43a047;">Welcome to Dentax Dental System</h2>
          <p>Dear user,</p>
          <p>Your account has been successfully created on <strong>Dentax Dental System</strong>.</p>
          <p><strong>Your Account ID:</strong> ${ID}</p>
          <p>You can now log in using your account ID and the password provided by your administrator.</p>
          <p>If you have any questions or need help accessing your account, please contact our support team.</p>
          <p>Best regards,<br><strong>Dentax Dental System Team</strong></p>
          <hr style="margin-top: 40px;">
          <p style="font-size: 12px; color: #888;">Dentax Dental System | Dentax Dental System</p>
        </div>
      `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(`Error sending account creation notice to ${email}:`, error);
    throw new Error(`Failed to send account creation notice: ${error.message}`);
  }
};

const sendAccountCreationNoticeWithPassword = async (email, ID, password) => {
  const mailOptions = {
    from: `"Dentax Dental System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Dentax Dental System Account Has Been Created',
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
          <h2 style="color: #43a047;">Welcome to Dentax Dental System</h2>
          <p>Dear user,</p>
          <p>Your account has been successfully created on <strong>Dentax Dental System</strong>.</p>
          <p><strong>Your Account ID:</strong> ${ID}</p>
          <p><strong>Your Account Password:</strong> ${password}</p>
          <p>You can now log in using your account ID and the password provided by your administrator.</p>
          <p>If you have any questions or need help accessing your account, please contact our support team.</p>
          <p>Best regards,<br><strong>Dentax Dental System Team</strong></p>
          <hr style="margin-top: 40px;">
          <p style="font-size: 12px; color: #888;">Dentax Dental System | Dentax Dental System</p>
        </div>
      `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(`Error sending account creation notice to ${email}:`, error);
    throw new Error(`Failed to send account creation notice: ${error.message}`);
  }
};

const sendReminder = async (email, date, start_time, dentist_name) => {
  const mailOptions = {
    from: `"Dentax Dental System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Appointment Reminder – Dentax Dental System',
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px; background-color: #ffffff;">
                <h2 style="color: #4CAF50;">Upcoming Appointment Reminder</h2>
                <p>Dear Patient,</p>
                <p>This is a friendly reminder that you have a dental appointment <strong>scheduled for tomorrow</strong> at <strong>Dentax Dental System</strong>. Please find the appointment details below:</p>
                
                <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0;"><strong>Date:</strong></td>
                        <td style="padding: 8px 0;">${date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Time:</strong></td>
                        <td style="padding: 8px 0;">${start_time}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0;"><strong>Dentist:</strong></td>
                        <td style="padding: 8px 0;">Dr. ${dentist_name}</td>
                    </tr>
                </table>

                <p style="margin-top: 20px;">Please arrive a few minutes early and bring any necessary documents. If you have any questions or need to reschedule, feel free to contact us.</p>

                <p>We look forward to seeing you tomorrow!</p>

                <p>Best regards,<br><strong>Dentax Dental System Team</strong></p>

                <hr style="margin-top: 40px;">
                <p style="font-size: 12px; color: #888;">Dentax Dental System | DentaxdentalSystem.com</p>
            </div>
        `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(`Error sending appointment reminder to ${email}:`, error);
    throw new Error(`Failed to send appointment reminder: ${error.message}`);
  }
};

const sendMedicalImageAddedNotice = async (email, date, patientName, url) => {
  const mailOptions = {
    from: `"Dentax Dental System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'New Medical Image Added – Dentax Dental System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px; background-color: #ffffff;">
        <h2 style="color: #4CAF50;">Medical Image Uploaded</h2>
        <p>Dear ${patientName},</p>
        <p>We would like to inform you that a new medical image has been added to your record on <strong>${date}</strong>.</p>
        <p>You can view the image directly by clicking the button below:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Medical Image
          </a>
        </div>

        <p>If the button above doesn't work, you can copy and paste this URL into your browser:</p>
        <p style="word-break: break-all;"><a href="${url}" target="_blank">${url}</a></p>

        <p>If you have any questions or concerns, feel free to contact our team.</p>

        <p>Best regards,<br><strong>Dentax Dental System Team</strong></p>
        <hr style="margin-top: 40px;">
        <p style="font-size: 12px; color: #888;">Dentax Dental System | DentaxdentalSystem.com</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(`Error sending image upload notice to ${email}:`, error);
    throw new Error(`Failed to send medical image notice: ${error.message}`);
  }
};

const sendMedicalReportAddedNotice = async (email, date, patientName) => {
  const mailOptions = {
    from: `"Dentax Dental System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'New Medical Report Added – Dentax Dental System',
    html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px; background-color: #ffffff;">
              <h2 style="color: #4CAF50;">Medical Report Uploaded</h2>
              <p>Dear ${patientName ?? "user"},</p>
              <p>A new medical report has been uploaded to your patient record on <strong>${date}</strong>.</p>
              <p>You may view this report by logging into your patient portal.</p>

              <p>If you need further clarification or assistance, don’t hesitate to reach out.</p>

              <p>Best regards,<br><strong>Dentax Dental System Team</strong></p>
              <hr style="margin-top: 40px;">
              <p style="font-size: 12px; color: #888;">Dentax Dental System | DentaxdentalSystem.com</p>
          </div>
      `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(`Error sending report upload notice to ${email}:`, error);
    throw new Error(`Failed to send medical report notice: ${error.message}`);
  }
};

const sendMedicalImageAndReportAddedNotice = async (email, date, patientName, url) => {
  const mailOptions = {
    from: `"Dentax Dental System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Medical Image and Report Added – Dentax Dental System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px; background-color: #ffffff;">
        <h2 style="color: #4CAF50;">Medical Image & Report Uploaded</h2>
        <p>Dear ${patientName},</p>
        <p>We have added both a new medical image and its corresponding report to your records on <strong>${date}</strong>.</p>
        <p>You can view the medical image directly by clicking the button below:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
            View Image & Report
          </a>
        </div>

        <p>If the button above doesn't work, you can copy and paste this URL into your browser:</p>
        <p style="word-break: break-all;"><a href="${url}" target="_blank">${url}</a></p>

        <p>For questions or assistance, our team is always here to help.</p>

        <p>Best regards,<br><strong>Dentax Dental System Team</strong></p>

        <hr style="margin-top: 40px;">
        <p style="font-size: 12px; color: #888;">Dentax Dental System | DentaxdentalSystem.com</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(`Error sending combined image/report notice to ${email}:`, error);
    throw new Error(`Failed to send medical image and report notice: ${error.message}`);
  }
};

export { sendVerificationCode, sendAppointmentConfirmation, sendtempAppointment, sendAppointmentCancelation, sendAppointmentRescheduleNotice, sendAppointmentOverdueNotice, sendAccountCreationInvite, sendAccountCreationNotice, sendAccountCreationNoticeWithPassword, sendReminder, sendMedicalImageAddedNotice, sendMedicalReportAddedNotice, sendMedicalImageAndReportAddedNotice };