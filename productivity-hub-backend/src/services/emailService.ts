import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  private nodemailerTransporter?: nodemailer.Transporter;
  private sesClient?: SESClient;

  constructor() {
    if (process.env.EMAIL_SERVICE === 'gmail') {
      this.setupNodemailer();
    } else if (process.env.EMAIL_SERVICE === 'aws-ses') {
      this.setupAWSSES();
    }
  }

  private setupNodemailer() {
    this.nodemailerTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  private setupAWSSES() {
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
  }

  // Generate verification token
  generateVerificationToken(): string {
    return uuidv4();
  }

  // Calculate token expiration
  getTokenExpiration(): Date {
    const hours = parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_HOURS || '24');
    return new Date(Date.now() + (hours * 60 * 60 * 1000));
  }

  // Send verification email
  async sendVerificationEmail(email: string, name: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${process.env.API_BASE_URL}/api/auth/verify-email?token=${verificationToken}`;

    const subject = 'Verify Your ProductivityHub Account';
    const htmlContent = this.generateVerificationHTML(name, verificationUrl);
    const textContent = this.generateVerificationText(name, verificationUrl);

    if (process.env.EMAIL_SERVICE === 'gmail' && this.nodemailerTransporter) {
      await this.sendWithNodemailer(email, subject, htmlContent, textContent);
    } else if (process.env.EMAIL_SERVICE === 'aws-ses' && this.sesClient) {
      await this.sendWithAWSSES(email, subject, htmlContent, textContent);
    } else {
      throw new Error('No email service configured');
    }
  }

  private async sendWithNodemailer(email: string, subject: string, html: string, text: string) {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject,
      text,
      html
    };

    await this.nodemailerTransporter!.sendMail(mailOptions);
    console.log(`Verification email sent via Gmail to: ${email}`);
  }

  private async sendWithAWSSES(email: string, subject: string, html: string, text: string) {
    const command = new SendEmailCommand({
      Source: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: subject },
        Body: {
          Html: { Data: html },
          Text: { Data: text }
        }
      }
    });

    await this.sesClient!.send(command);
    console.log(`Verification email sent via AWS SES to: ${email}`);
  }

  private generateVerificationHTML(name: string, verificationUrl: string): string {
    return `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #007AFF; margin: 0;">ProductivityHub</h1>
        </div>
        
        <div style="padding: 20px;">
          <h2>Welcome, ${name}!</h2>
          
          <p>Thanks for registering for ProductivityHub. Please verify your email address to complete your account setup.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007AFF; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 8px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Or copy and paste this link into your browser:
          </p>
          <p style="word-break: break-all; color: #007AFF; font-size: 14px;">
            ${verificationUrl}
          </p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
      </div>
    `;
  }

  private generateVerificationText(name: string, verificationUrl: string): string {
    return `
      Welcome to ProductivityHub, ${name}!
      
      Thanks for registering. Please verify your email address by visiting:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, please ignore this email.
    `;
  }

  // Test email connection
  async testConnection(): Promise<boolean> {
    try {
      if (this.nodemailerTransporter) {
        await this.nodemailerTransporter.verify();
        console.log('Gmail connection verified');
        return true;
      } else if (this.sesClient) {
        // Basic SES test - try to get sending quota
        console.log('AWS SES client initialized');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Email service connection test failed:', error);
      return false;
    }
  }
}

export default new EmailService();