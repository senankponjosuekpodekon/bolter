import { Injectable } from '@nestjs/common';
// import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  // transporter: Transporter;

  constructor() {
    // this.transporter = nodemailer.createTransport({
    //   host: 'smtp.example.com',
    //   port: 587,
    //   auth: { user: 'user', pass: 'pass' },
    // });
  }

  async sendAlertEmail(to: string, subject: string, message: string) {
    // await this.transporter.sendMail({
    //   from: 'noreply@bank.com',
    //   to,
    //   subject,
    //   text: message,
    // });
    // Pour démo, log seulement
    console.log(`Email envoyé à ${to}: ${subject} - ${message}`);
  }
}
