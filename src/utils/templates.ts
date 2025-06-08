// templates/otpTemplate.ts

export const generateOtpTemplate = (otp: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NamasteCart OTP Verification</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f6f8;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 10px;
      padding: 40px 30px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
      color: #333;
    }
    .otp-box {
      text-align: center;
      font-size: 36px;
      font-weight: bold;
      letter-spacing: 6px;
      color: #007BFF;
      margin: 30px 0;
      border: 2px dashed #007BFF;
      padding: 15px;
      background-color: #eaf4ff;
      border-radius: 8px;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #aaa;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Verify Your NamasteCart Account</h2>
    <p>Hello,</p>
    <p>Your OTP to verify your NamasteCart account is:</p>
    <div class="otp-box">${otp}</div>
    <p>This code is valid for <strong>1 minute</strong>. Do not share it with anyone.</p>
    <div class="footer">
      &copy; ${new Date().getFullYear()} NamasteCart. All rights reserved.
    </div>
  </div>
</body>
</html>`;
