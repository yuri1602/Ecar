# Нотификационна система

## 📬 Общ преглед

Нотификационната система управлява изпращането на известия към потребители при различни събития в системата. Основната цел е да уведоми шофьорите за нови зарядни сесии и да ги подкани да въведат показанията на одометъра.

## 🏗️ Архитектура

```
┌──────────────────────────────────────────────────────────┐
│                    NOTIFICATION FLOW                     │
└──────────────────────────────────────────────────────────┘

    [Event Trigger]
         │
         ├─→ New Charge Session
         ├─→ Odometer Reminder
         └─→ Report Ready
         │
         ▼
┌─────────────────────────┐
│  Notification Service   │
│  ───────────────────    │
│  • Create notification  │
│    record in DB         │
│  • Add job to queue     │
│  • Set status: queued   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│     Job Queue           │
│     (BullMQ + Redis)    │
│  ───────────────────    │
│  • send-notification    │
│  • reminder-check       │
│  • batch-notifications  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Worker Process        │
│  ───────────────────    │
│  • Process jobs         │
│  • Retry logic          │
│  • Error handling       │
└────────────┬────────────┘
             │
             ├──────────────────┬───────────────┬──────────────┐
             ▼                  ▼               ▼              ▼
    ┌────────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐
    │  Email Service │  │ SMS Service │  │   Push   │  │ Webhook  │
    │    (SMTP)      │  │  (future)   │  │ (future) │  │ (future) │
    └────────┬───────┘  └─────────────┘  └──────────┘  └──────────┘
             │
             ▼
    ┌────────────────────┐
    │  Update DB:        │
    │  • status = sent   │
    │  • sent_at = NOW() │
    └────────────────────┘
```

## 📊 Notification Types

```typescript
enum NotificationType {
  ODOMETER_REQUEST = 'odometer_request',     // Ново зареждане - моля въведете одометър
  ODOMETER_REMINDER = 'odometer_reminder',   // Напомняне за липсващ одометър
  REPORT_READY = 'report_ready',             // Генериран отчет е готов
  SYSTEM = 'system'                          // Системни съобщения
}

enum NotificationStatus {
  QUEUED = 'queued',     // Чака изпращане
  SENT = 'sent',         // Изпратено успешно
  FAILED = 'failed',     // Неуспешно изпращане
  SEEN = 'seen'          // Потребителят го е видял
}
```

## 🔔 Notification Templates

### 1. Odometer Request (при ново зареждане)

```typescript
interface OdometerRequestData {
  vehicleRegistrationNo: string;
  vehicleMake: string;
  vehicleModel: string;
  chargeDate: Date;
  kwhCharged: number;
  priceTotal: number;
  currency: string;
  lastKnownKm: number;
  odometerEntryUrl: string;
}

function generateOdometerRequestEmail(data: OdometerRequestData): EmailTemplate {
  const subject = `Ново зареждане за ${data.vehicleRegistrationNo} - Въведете одометър`;
  
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
    .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
    .button { 
      display: inline-block; 
      background-color: #4CAF50; 
      color: white; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 5px; 
      margin: 20px 0;
    }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ Ново зареждане</h1>
    </div>
    
    <div class="content">
      <h2>Здравейте!</h2>
      <p>Има ново зареждане за автомобил <strong>${data.vehicleMake} ${data.vehicleModel}</strong> 
         (<strong>${data.vehicleRegistrationNo}</strong>).</p>
      
      <div class="info-box">
        <h3>📍 Данни за зареждането:</h3>
        <ul>
          <li><strong>Дата:</strong> ${formatDate(data.chargeDate)}</li>
          <li><strong>Заредени:</strong> ${data.kwhCharged} kWh</li>
          <li><strong>Цена:</strong> ${data.priceTotal} ${data.currency}</li>
        </ul>
      </div>
      
      <div class="info-box">
        <h3>📊 Показание на одометъра:</h3>
        <p><strong>Последни известни километри:</strong> ${data.lastKnownKm} км</p>
        <p>Моля, въведете <strong>текущото показание</strong> на одометъра, 
           за да изчислим разхода за това зареждане.</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${data.odometerEntryUrl}" class="button">
          👉 Въведете одометър
        </a>
      </div>
      
      <p style="font-size: 12px; color: #666; margin-top: 20px;">
        Бутонът не работи? Копирайте този линк в браузъра:<br>
        <a href="${data.odometerEntryUrl}">${data.odometerEntryUrl}</a>
      </p>
    </div>
    
    <div class="footer">
      <p>ECar Fleet Management System</p>
      <p>Това е автоматично съобщение, моля не отговаряйте директно.</p>
    </div>
  </div>
</body>
</html>
  `;
  
  const textBody = `
Здравейте,

Има ново зареждане за автомобил ${data.vehicleMake} ${data.vehicleModel} (${data.vehicleRegistrationNo}).

📍 Данни за зареждането:
• Дата: ${formatDate(data.chargeDate)}
• Заредени: ${data.kwhCharged} kWh
• Цена: ${data.priceTotal} ${data.currency}

📊 Последни известни километри: ${data.lastKnownKm} км

Моля, въведете текущото показание на одометъра:
${data.odometerEntryUrl}

С уважение,
ECar Fleet System
  `.trim();
  
  return {
    subject,
    html: htmlBody,
    text: textBody
  };
}
```

### 2. Odometer Reminder (напомняне)

```typescript
interface OdometerReminderData {
  vehicleRegistrationNo: string;
  chargeDate: Date;
  hoursPending: number;
  odometerEntryUrl: string;
}

function generateOdometerReminderEmail(data: OdometerReminderData): EmailTemplate {
  const subject = `⏰ Напомняне: Очакваме одометър за ${data.vehicleRegistrationNo}`;
  
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
    .warning-box { background-color: #FFF3CD; padding: 15px; margin: 15px 0; border-left: 4px solid #FF9800; }
    .button { 
      display: inline-block; 
      background-color: #FF9800; 
      color: white; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 5px; 
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Напомняне за одометър</h1>
    </div>
    
    <div class="content">
      <h2>Здравейте!</h2>
      <p>Напомняме Ви да въведете показанието на одометъра за зареждане на автомобил 
         <strong>${data.vehicleRegistrationNo}</strong>.</p>
      
      <div class="warning-box">
        <p><strong>⚠️ Зареждането е на ${formatDate(data.chargeDate)}</strong></p>
        <p>Изминало време: <strong>${data.hoursPending} часа</strong></p>
      </div>
      
      <p>За да изчислим точния разход за това зареждане, 
         моля въведете текущото показание на одометъра възможно най-скоро.</p>
      
      <div style="text-align: center;">
        <a href="${data.odometerEntryUrl}" class="button">
          👉 Въведете одометър сега
        </a>
      </div>
    </div>
    
    <div class="footer">
      <p>ECar Fleet Management System</p>
    </div>
  </div>
</body>
</html>
  `;
  
  const textBody = `
Здравейте,

Напомняме Ви да въведете показанието на одометъра за зареждане на автомобил ${data.vehicleRegistrationNo}.

⚠️ Зареждането е на ${formatDate(data.chargeDate)}
Изминало време: ${data.hoursPending} часа

Моля, въведете одометър:
${data.odometerEntryUrl}

С уважение,
ECar Fleet System
  `.trim();
  
  return {
    subject,
    html: htmlBody,
    text: textBody
  };
}
```

### 3. Report Ready

```typescript
interface ReportReadyData {
  reportName: string;
  reportPeriod: string;
  downloadUrl: string;
}

function generateReportReadyEmail(data: ReportReadyData): EmailTemplate {
  const subject = `📊 Отчет готов: ${data.reportName}`;
  
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
    .button { 
      display: inline-block; 
      background-color: #2196F3; 
      color: white; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 5px; 
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Отчет готов</h1>
    </div>
    
    <div class="content">
      <h2>Здравейте!</h2>
      <p>Вашият отчет е готов за изтегляне:</p>
      <p><strong>${data.reportName}</strong></p>
      <p>Период: ${data.reportPeriod}</p>
      
      <div style="text-align: center;">
        <a href="${data.downloadUrl}" class="button">
          📥 Изтеглете отчета
        </a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  const textBody = `
Здравейте,

Вашият отчет е готов за изтегляне:
${data.reportName}
Период: ${data.reportPeriod}

Изтеглете от:
${data.downloadUrl}

С уважение,
ECar Fleet System
  `.trim();
  
  return {
    subject,
    html: htmlBody,
    text: textBody
  };
}
```

## 💻 Pseudocode за Notification Service

### Създаване и изпращане на нотификация

```typescript
// ════════════════════════════════════════════════════════════
// CREATE AND SEND NOTIFICATION
// ════════════════════════════════════════════════════════════

async function createAndSendNotification(
  userId: string,
  type: NotificationType,
  data: NotificationData
): Promise<Notification> {
  
  // 1. Генериране на съдържанието според типа
  const content = generateNotificationContent(type, data);
  
  // 2. Намиране на потребителя
  const user = await db.users.findOne({
    where: { id: userId, isActive: true }
  });
  
  if (!user) {
    throw new Error('User not found or inactive');
  }
  
  // 3. Създаване на notification запис
  const notification = await db.notifications.create({
    data: {
      userId: user.id,
      sessionId: data.sessionId,
      type: type,
      subject: content.subject,
      body: content.body,
      status: 'queued',
      metadata: {
        templateData: data,
        retryCount: 0,
        maxRetries: 3
      }
    }
  });
  
  // 4. Добавяне в job queue
  await notificationQueue.add('send-notification', {
    notificationId: notification.id,
    userId: user.id,
    email: user.email,
    type: type,
    priority: getPriority(type)
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000 // 2s, 4s, 8s
    },
    removeOnComplete: false,
    removeOnFail: false
  });
  
  logger.info('Notification queued', {
    notificationId: notification.id,
    userId: user.id,
    type: type
  });
  
  return notification;
}

function getPriority(type: NotificationType): number {
  switch (type) {
    case NotificationType.ODOMETER_REQUEST:
      return 1; // High priority
    case NotificationType.ODOMETER_REMINDER:
      return 2; // Medium
    case NotificationType.REPORT_READY:
      return 3; // Low
    default:
      return 5;
  }
}

// ════════════════════════════════════════════════════════════
// WORKER: PROCESS NOTIFICATION JOB
// ════════════════════════════════════════════════════════════

async function processNotificationJob(job: Job): Promise<void> {
  const { notificationId, userId, email, type } = job.data;
  
  logger.info('Processing notification job', { notificationId, email });
  
  try {
    // 1. Намиране на нотификацията
    const notification = await db.notifications.findOne({
      where: { id: notificationId }
    });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    if (notification.status === 'sent') {
      logger.warn('Notification already sent', { notificationId });
      return;
    }
    
    // 2. Генериране на email
    const templateData = notification.metadata.templateData;
    const emailTemplate = generateEmailTemplate(type, templateData);
    
    // 3. Изпращане на email
    await emailService.send({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    });
    
    // 4. Обновяване на статуса
    await db.notifications.update({
      where: { id: notificationId },
      data: {
        status: 'sent',
        sentAt: new Date()
      }
    });
    
    logger.info('Notification sent successfully', { notificationId, email });
    
  } catch (error) {
    logger.error('Failed to send notification', {
      notificationId,
      email,
      error: error.message,
      attempt: job.attemptsMade
    });
    
    // Update failure info
    await db.notifications.update({
      where: { id: notificationId },
      data: {
        status: job.attemptsMade >= 3 ? 'failed' : 'queued',
        failedAt: job.attemptsMade >= 3 ? new Date() : null,
        failureReason: error.message,
        metadata: {
          ...notification.metadata,
          retryCount: job.attemptsMade
        }
      }
    });
    
    throw error; // Re-throw to trigger retry
  }
}

// ════════════════════════════════════════════════════════════
// CRON JOB: CHECK PENDING ODOMETERS AND SEND REMINDERS
// ════════════════════════════════════════════════════════════

async function checkPendingOdometersAndRemind(): Promise<void> {
  logger.info('Running pending odometer check');
  
  const now = new Date();
  const reminderThresholds = [
    { hours: 24, name: 'first' },
    { hours: 48, name: 'second' },
    { hours: 72, name: 'escalation' }
  ];
  
  for (const threshold of reminderThresholds) {
    const cutoffTime = new Date(now.getTime() - threshold.hours * 60 * 60 * 1000);
    
    // Намиране на всички pending сесии над праг
    const pendingSessions = await db.chargeSessions.findMany({
      where: {
        status: 'pending_odometer',
        createdAt: { lt: cutoffTime }
      },
      include: {
        vehicle: {
          include: {
            userVehicles: {
              where: {
                OR: [
                  { assignedUntil: null },
                  { assignedUntil: { gt: now } }
                ]
              },
              include: { user: true }
            }
          }
        }
      }
    });
    
    for (const session of pendingSessions) {
      // Проверка дали вече е изпратено напомняне за този праг
      const existingReminder = await db.notifications.findFirst({
        where: {
          sessionId: session.id,
          type: 'odometer_reminder',
          metadata: {
            path: ['reminderType'],
            equals: threshold.name
          }
        }
      });
      
      if (existingReminder) {
        continue; // Вече изпратено
      }
      
      // Изчисляване на часовете от създаване
      const hoursPending = Math.floor(
        (now.getTime() - session.createdAt.getTime()) / (1000 * 60 * 60)
      );
      
      // Изпращане на напомняне до всички assigned потребители
      for (const uv of session.vehicle.userVehicles) {
        const odometerUrl = `${process.env.APP_URL}/driver/odometer-entry/${session.id}`;
        
        await createAndSendNotification(
          uv.userId,
          NotificationType.ODOMETER_REMINDER,
          {
            sessionId: session.id,
            vehicleRegistrationNo: session.vehicle.registrationNo,
            chargeDate: session.startedAt,
            hoursPending: hoursPending,
            odometerEntryUrl: odometerUrl,
            reminderType: threshold.name
          }
        );
      }
      
      // Ако е ескалация (72h), нотифицираме и fleet manager-ите
      if (threshold.name === 'escalation') {
        const managers = await db.users.findMany({
          where: {
            role: { in: ['admin', 'fleet_manager'] },
            isActive: true
          }
        });
        
        for (const manager of managers) {
          await createAndSendNotification(
            manager.id,
            NotificationType.SYSTEM,
            {
              subject: `Ескалация: Липсващ одометър за ${session.vehicle.registrationNo}`,
              body: `Зареждането от ${formatDate(session.startedAt)} все още няма въведен одометър (${hoursPending}h).`,
              sessionId: session.id
            }
          );
        }
      }
    }
    
    logger.info(`Processed ${pendingSessions.length} pending sessions for ${threshold.hours}h threshold`);
  }
}

// ════════════════════════════════════════════════════════════
// EMAIL SERVICE (SMTP)
// ════════════════════════════════════════════════════════════

class EmailService {
  private transporter: nodemailer.Transporter;
  
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }
  
  async send(options: EmailOptions): Promise<void> {
    const mailOptions = {
      from: `"ECar Fleet" <${process.env.SMTP_FROM}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };
    
    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent', {
        to: options.to,
        messageId: info.messageId
      });
    } catch (error) {
      logger.error('Failed to send email', {
        to: options.to,
        error: error.message
      });
      throw error;
    }
  }
  
  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified');
      return true;
    } catch (error) {
      logger.error('SMTP verification failed', { error: error.message });
      return false;
    }
  }
}

// ════════════════════════════════════════════════════════════
// WORKER SETUP (BullMQ)
// ════════════════════════════════════════════════════════════

// worker.ts
import { Worker } from 'bullmq';
import { redisConnection } from './config/redis';

const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    await processNotificationJob(job);
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process 5 jobs in parallel
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000 // per 1 second
    }
  }
);

notificationWorker.on('completed', (job) => {
  logger.info('Job completed', { jobId: job.id });
});

notificationWorker.on('failed', (job, error) => {
  logger.error('Job failed', {
    jobId: job?.id,
    error: error.message
  });
});

// ════════════════════════════════════════════════════════════
// CRON SETUP
// ════════════════════════════════════════════════════════════

import cron from 'node-cron';

// Проверка за pending одометри - всеки час
cron.schedule('0 * * * *', async () => {
  try {
    await checkPendingOdometersAndRemind();
  } catch (error) {
    logger.error('Failed to check pending odometers', { error });
  }
});

// Почистване на стари notifications - всеки ден в 3:00
cron.schedule('0 3 * * *', async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const deleted = await db.notifications.deleteMany({
      where: {
        status: 'sent',
        sentAt: { lt: thirtyDaysAgo }
      }
    });
    
    logger.info(`Cleaned up ${deleted.count} old notifications`);
  } catch (error) {
    logger.error('Failed to cleanup notifications', { error });
  }
});
```

## 🔧 Configuration

### Environment Variables

```bash
# SMTP Configuration (SuperHosting Example)
SMTP_HOST=mail.albena.bg
SMTP_PORT=26
SMTP_SECURE=false
SMTP_USER=ecar@albena.bg
SMTP_PASSWORD=your-secure-password
SMTP_FROM=ecar@albena.bg

# Redis (Job Queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Application URLs
APP_URL=https://ecar.company.local

# Notification Settings
NOTIFICATION_REMINDER_24H=true
NOTIFICATION_REMINDER_48H=true
NOTIFICATION_REMINDER_72H=true
NOTIFICATION_MAX_RETRIES=3
```

## 📊 Monitoring & Metrics

### Metrics за проследяване

```typescript
interface NotificationMetrics {
  totalSent: number;
  totalFailed: number;
  averageSendTime: number;
  pendingCount: number;
  retryCount: number;
  
  byType: {
    [key in NotificationType]: {
      sent: number;
      failed: number;
    }
  };
}

async function getNotificationMetrics(
  startDate: Date,
  endDate: Date
): Promise<NotificationMetrics> {
  const stats = await db.notifications.groupBy({
    by: ['type', 'status'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: true
  });
  
  // Process and return metrics
  return processStats(stats);
}
```

### Health Check Endpoint

```typescript
app.get('/api/health/notifications', async (req, res) => {
  const checks = {
    smtp: false,
    redis: false,
    worker: false,
    pendingCount: 0
  };
  
  try {
    // Check SMTP
    checks.smtp = await emailService.verify();
    
    // Check Redis
    checks.redis = await redisClient.ping() === 'PONG';
    
    // Check Worker
    const workers = await notificationQueue.getWorkers();
    checks.worker = workers.length > 0;
    
    // Pending count
    checks.pendingCount = await db.notifications.count({
      where: { status: 'queued' }
    });
    
    const isHealthy = checks.smtp && checks.redis && checks.worker;
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

---

**Следваща стъпка:** UI/UX спецификация
