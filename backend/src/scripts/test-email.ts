import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';

async function bootstrap() {
  // Create application context (no HTTP server)
  const app = await NestFactory.createApplicationContext(AppModule);
  
  // Get the notifications queue
  const queue = app.get<Queue>(getQueueToken('notifications'));

  // Get email from command line args or use default
  const email = process.argv[2] || 'test@example.com';

  console.log(`Adding test email job for: ${email}`);
  console.log('----------------------------------------');

  // Add job to queue
  await queue.add('send-email', {
    email: email,
    type: 'odometer_request',
    sessionId: 'test-session-id', // Dummy ID
    notificationId: 'test-notification-id', // Dummy ID
  });

  console.log('✅ Job added to queue successfully.');
  console.log('👉 Check your main backend terminal (where "npm run start:dev" is running) to see the email sending logs.');
  console.log('----------------------------------------');

  await app.close();
}

bootstrap();
