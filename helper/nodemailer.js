import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();
const {NODEMAILER_EMAIL, NODEMAILER_PASSWORD} = process.env;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: NODEMAILER_EMAIL,
    pass: NODEMAILER_PASSWORD,
  },
});

// Offer Letter Email
function generateOfferLetter(name, position, startDate, salary) {
    return `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="background-color: #f7f7f7; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
          <h1 style="text-align: center; color: #4CAF50;">Offer Letter</h1>
          <p style="text-align: right; font-size: 14px; color: #777;">Date: ${new Date().toLocaleDateString('en-GB')}</p>
          
          <p>Dear <strong>${name}</strong>,</p>
          
          <p>We are delighted to offer you the position of <strong>${position}</strong> at 
          <strong>Krivi's Restaurant</strong>. Your start date is set for <strong>${new Date(startDate).toLocaleDateString('en-GB')}</strong>.</p>
  
          <p>Your starting salary will be <strong>${salary}/Month</strong>. Additionally, you will be eligible for other performance benefits.</p>
  
          <p>We are excited to have you join our team and look forward to working together.</p>
          
          <p style="margin-top: 40px;">Best Regards,</p>
          <p><strong>Krivi's Restaurant</strong></p>
        </div>
        
        <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
          © ${new Date().getFullYear()} Krivi's Restaurant. All rights reserved.
        </p>
      </div>
    `;
}
async function sendOfferLetter(name, position, startDate, salary, employeeEmail){
    transporter.sendMail({
        from: NODEMAILER_EMAIL,
        to: employeeEmail,
        subject: "Your Offer Letter from Krivi's Restaurants.",
        html: generateOfferLetter(name, position, startDate, salary),
      }, (error, info) => {
        if (error) {
          console.log('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      }
    );
}

// Payment Letter Acknowledgement
function generateAcknowledgmentLetter(name, salary, month) {
  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <div style="background-color: #f7f7f7; padding: 20px; border-radius: 10px; max-width: 600px; margin: auto;">
        <h1 style="text-align: center; color: #4CAF50;">Salary Acknowledgment</h1>
        <p style="text-align: right; font-size: 14px; color: #777;">Date: ${new Date().toLocaleDateString('en-GB')}</p>
        
        <p>Dear <strong>${name}</strong>,</p>
        
        <p>This is to confirm that we have received your acknowledgment of the salary payment of <strong>₹${Number(salary).toFixed(2)}</strong> for the month of <strong>${month}</strong>.</p>

        <p>We appreciate your prompt confirmation and are pleased to have you as a part of the <strong>Krivi's Restaurant</strong> team.</p>

        <p>If you have any questions or require further assistance, please don't hesitate to reach out.</p>
        
        <p style="margin-top: 40px;">Best Regards,</p>
        <p><strong>Krivi's Restaurant</strong></p>
      </div>
      
      <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
        © ${new Date().getFullYear()} Krivi's Restaurant. All rights reserved.
      </p>
    </div>
  `;
}
async function sendAcknowledgementReceipt(name, salary, month, employeeEmail){
  transporter.sendMail({
      from: NODEMAILER_EMAIL,
      to: employeeEmail,
      subject: "Acknowledgment of Salary Receipt from Krivi's Restaurant",
      html: generateAcknowledgmentLetter(name, salary, month),
    }, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    }
  );
}

export default {
    sendOfferLetter,
    sendAcknowledgementReceipt,
}