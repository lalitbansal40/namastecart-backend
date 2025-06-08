import nodemailer from 'nodemailer';
import { CONSTANTS } from '../config/constant';
import Razorpay from 'razorpay';

export const sendMail = async (to: string, subject: string, htmlContent: string) => {
    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: CONSTANTS.EMAIL_CRED.EMAIL,       // Your Gmail
            pass: CONSTANTS.EMAIL_CRED.EMAIL_PASSWORD,           // App Password or Gmail password
        },
    });

    // Email options with dynamic fields
    const mailOptions = {
        from: `"NamasteCart" ${CONSTANTS.EMAIL_CRED.EMAIL}`,
        to,               // Dynamic recipient email
        subject,          // Dynamic subject
        html: htmlContent, // Dynamic HTML content
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

export const razorpay = new Razorpay({
    key_id: CONSTANTS.RAZORPAY.RAZORPAY_KEY_ID!,
    key_secret: CONSTANTS.RAZORPAY.RAZORPAY_KEY_SECRET!,
  });