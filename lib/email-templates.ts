/**
 * Email templates for various scenarios
 */

export const contactFormTemplate = (data: {
    name: string
    email: string
    subject: string
    message: string
  }) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Contact Form Submission</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .header {
          background: linear-gradient(to right, #22c984, #1eac73);
          padding: 20px;
          text-align: center;
          color: white;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 0 0 5px 5px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
        .message-box {
          background-color: #f5f5f5;
          padding: 15px;
          border-left: 4px solid #22c984;
          margin: 20px 0;
        }
        h1 {
          margin: 0;
          font-size: 24px;
        }
        h2 {
          color: #22c984;
          font-size: 20px;
          margin-top: 0;
        }
        .info-item {
          margin-bottom: 10px;
        }
        .label {
          font-weight: bold;
          color: #555;
        }
        .logo {
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Contact Form Submission</h1>
        </div>
        <div class="content">
          <h2>Contact Details</h2>
          <div class="info-item">
            <span class="label">Name:</span> ${data.name}
          </div>
          <div class="info-item">
            <span class="label">Email:</span> ${data.email}
          </div>
          <div class="info-item">
            <span class="label">Subject:</span> ${data.subject}
          </div>
          
          <h2>Message</h2>
          <div class="message-box">
            ${data.message.replace(/\n/g, "<br>")}
          </div>
          
          <p>This message was sent from the contact form on the Orizen Inc website.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Orizen Inc. All rights reserved.</p>
          <p>7901, N STE 15322, St. Petersburg, FL.</p>
        </div>
      </div>
    </body>
    </html>
    `
  }
  
  export const newsletterSubscriptionTemplate = (email: string) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Orizen Newsletter</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(to right, #22c984, #1eac73);
          padding: 30px 20px;
          text-align: center;
          color: white;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 0 0 5px 5px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding: 20px;
          font-size: 12px;
          color: #666;
          background-color: #f9f9f9;
          border-radius: 5px;
        }
        h1 {
          margin: 0;
          font-size: 28px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
        }
        h2 {
          color: #22c984;
          font-size: 22px;
        }
        .benefits {
          margin: 25px 0;
        }
        .benefit-item {
          margin-bottom: 15px;
          display: flex;
          align-items: flex-start;
        }
        .benefit-icon {
          width: 24px;
          height: 24px;
          background-color: #22c984;
          border-radius: 50%;
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
          font-weight: bold;
        }
        .cta-button {
          display: inline-block;
          background-color: #22c984;
          color: white;
          text-decoration: none;
          padding: 12px 25px;
          border-radius: 5px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .social-links {
          margin-top: 20px;
        }
        .social-links a {
          display: inline-block;
          margin: 0 10px;
          color: #22c984;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to the Orizen Newsletter!</h1>
          <p>Thank you for subscribing to our updates</p>
        </div>
        <div class="content">
          <h2>Hello there,</h2>
          <p>Thank you for subscribing to the Orizen Inc newsletter with <strong>${email}</strong>. We're excited to have you join our community!</p>
          
          <p>As a subscriber, you'll receive:</p>
          
          <div class="benefits">
            <div class="benefit-item">
              <div class="benefit-icon">✓</div>
              <div>Exclusive LLC formation tips and strategies</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">✓</div>
              <div>Updates on business compliance requirements</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">✓</div>
              <div>Special offers and promotions</div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">✓</div>
              <div>Helpful resources for business owners</div>
            </div>
          </div>
          
          <p>We're committed to providing valuable content that helps you grow and manage your business effectively.</p>
          
          <div style="text-align: center;">
            <a href="https://orizeninc.com" class="cta-button">Visit Our Website</a>
          </div>
          
          <p>If you have any questions or need assistance, don't hesitate to contact our team at <a href="mailto:info@orizeninc.com">info@orizeninc.com</a>.</p>
          
          <div class="social-links">
            <p>Connect with us:</p>
            <a href="https://facebook.com">Facebook</a> |
            <a href="https://twitter.com">Twitter</a> |
            <a href="https://linkedin.com">LinkedIn</a> |
            <a href="https://instagram.com">Instagram</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Orizen Inc. All rights reserved.</p>
          <p>7901, N STE 15322, St. Petersburg, FL.</p>
          <p>You're receiving this email because you subscribed to our newsletter.</p>
        </div>
      </div>
    </body>
    </html>
    `
  }
  
  