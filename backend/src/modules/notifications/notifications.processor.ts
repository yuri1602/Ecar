import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bull';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Notification, NotificationStatus } from './entities/notification.entity';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {
    // Initialize nodemailer transporter
    // In a real app, these would come from environment variables
    const secure = this.configService.get('SMTP_SECURE') === 'true';
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST') || 'smtp.example.com',
      port: Number(this.configService.get('SMTP_PORT')) || 587,
      secure: secure, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER') || 'user@example.com',
        pass: this.configService.get('SMTP_PASSWORD') || 'password',
      },
      tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false,
      },
    });
  }

  @Process('send-email')
  async handleSendEmail(job: Job) {
    this.logger.debug('Start handling send-email job...');
    const { email, type, sessionId, notificationId } = job.data;

    if (!email) {
      this.logger.warn(`No email provided for job ${job.id}`);
      return;
    }

    try {
      let subject = 'Notification from ECar';
      let html = '<p>You have a new notification.</p>';

      // Frontend URL - ideally from config
      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';

      if (type === 'odometer_request') {
        subject = 'Въвеждане на километраж - ECar';
        const link = `${frontendUrl}/odometer`;
        
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Необходимо е въвеждане на километраж</h2>
            <p>Здравейте,</p>
            <p>Засечено е ново зареждане за вашия автомобил. Моля, въведете текущия километраж, за да завършите процеса.</p>
            <div style="margin: 30px 0;">
              <a href="${link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Въведи километраж
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Ако бутонът не работи, копирайте следния линк във вашия браузър:</p>
            <p style="color: #666; font-size: 14px;">${link}</p>
          </div>
        `;
      }

      // Send email
      const fromEmail = this.configService.get('SMTP_FROM_EMAIL') || 'noreply@ecar.com';
      const fromName = this.configService.get('SMTP_FROM_NAME') || 'ECar System';
      
      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: email,
        subject: subject,
        html: html,
      });

      this.logger.log(`Email sent to ${email}: ${info.messageId}`);

      // Update notification status
      if (notificationId) {
        await this.notificationRepository.update(notificationId, {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
          metadata: { messageId: info.messageId },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}`, error.stack);
      
      // Update notification status to failed
      if (notificationId) {
        await this.notificationRepository.update(notificationId, {
          status: NotificationStatus.FAILED,
          failedAt: new Date(),
          failureReason: error.message,
        });
      }
      
      // We might want to throw error to let Bull retry the job
      // throw error;
    }
  }
}
