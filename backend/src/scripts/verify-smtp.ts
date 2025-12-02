import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

async function bootstrap() {
  // Create application context to load .env via ConfigModule
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const configService = app.get(ConfigService);

  console.log('\n📧 Testing SMTP Connection...');
  console.log('----------------------------------------');
  
  const host = configService.get('SMTP_HOST');
  const port = configService.get('SMTP_PORT');
  const user = configService.get('SMTP_USER');
  const pass = configService.get('SMTP_PASSWORD');
  const secure = configService.get('SMTP_SECURE');

  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`Pass: ${pass ? '******' : '(empty)'}`);
  console.log(`Secure: ${secure}`);
  console.log('----------------------------------------');

  const transporter = nodemailer.createTransport({
    host: host,
    port: Number(port),
    secure: secure === 'true',
    auth: {
      user: user,
      pass: pass,
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true, // show debug output
    logger: true // log information in console
  });

  try {
    await transporter.verify();
    console.log('✅ SUCCESS: SMTP connection and authentication established!');
  } catch (error) {
    console.error('❌ FAILED: Could not connect or authenticate.');
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('Server response:', error.response);
    }
  }

  await app.close();
  process.exit(0);
}

bootstrap();
