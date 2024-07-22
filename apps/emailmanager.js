const nodemailer = require('nodemailer');
require("dotenv").config()

const senderName = process.env.SENDER_NAME;
const user = process.env.EMAIL_ID
const pass = process.env.APP_PWD

async function sendOtp(email, otp) {
  let transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: user,
      pass: pass
    }
  });

  let mailOptions = {
    from: `"${senderName}" <your-email@gmail.com>`,
    to: email,
    subject: 'Your OTP Code',
    html: `<b>Your OTP code is ${otp}</b>`
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email: %s', error);
  }
}

module.exports =  {sendOtp}
