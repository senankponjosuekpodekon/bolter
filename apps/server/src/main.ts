import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { Logger } from './common/logger/logger.service';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

async function bootstrap() {
  // Choose HTTPS or HTTP based on environment variable USE_HTTPS
  const useHttps = process.env.USE_HTTPS === 'true';

  let app: INestApplication;
  if (useHttps) {
    const keyPath = path.join(__dirname, '../cert/192.168.1.198-key.pem');
    const certPath = path.join(__dirname, '../cert/192.168.1.198.pem');

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      // eslint-disable-next-line no-console
      console.warn('[startup] USE_HTTPS=true but cert files not found at', keyPath, certPath, '; falling back to HTTP');
      app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
      });
    } else {
      const httpsOptions: https.ServerOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
        httpsOptions,
      });
    }
  } else {
    app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
  }

  const configService = app.get<ConfigService>(ConfigService);
  const port = configService.get('PORT', 3000);

  const logger = app.get(Logger);
  app.useLogger(logger);

  app.setGlobalPrefix('api');

  // Configure helmet differently for dev HTTP vs HTTPS.
  // When running over plain HTTP (useHttps === false) we disable headers
  // that require a secure origin (Cross-Origin-Opener-Policy / Origin-Agent-Cluster)
  // to avoid browser warnings and asset requests over HTTPS.
  if (useHttps) {
    app.use(helmet());
  } else {
    app.use(
      helmet({
        // disable COOP/Origin-Agent-Cluster in dev http mode
        crossOriginOpenerPolicy: false,
        // disable strict content security policy for easier dev; re-enable for prod
        contentSecurityPolicy: false,
        // do not set Origin-Agent-Cluster header
        originAgentCluster: false,
      }),
    );
  }

  const frontendUrl = configService.get<string>('frontend.url', 'http://localhost:5173');
  const allowedOrigins = [
    frontendUrl,
    'http://localhost:5173',
    'http://localhost:5174',
    // Allow any ngrok subdomain for dev/demo usage
    /^https:\/\/[a-z0-9-]+\.ngrok-free\.dev$/,
    /^https:\/\/[a-z0-9-]+\.ngrok\.io$/,
    /^https:\/\/[a-z0-9-]+\.ngrok\.app$/,
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Swagger)
      if (!origin) return callback(null, true);
      const allowed = allowedOrigins.some((o) =>
        typeof o === 'string' ? o === origin : o.test(origin),
      );
      if (allowed) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuration Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Banking Platform API')
    .setDescription('Complete banking platform with KYC, transactions, and admin validation')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('users')
    .addTag('accounts')
    .addTag('transactions')
    .addTag('kyc')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  if (process.env.NODE_ENV !== 'production') {
    // Serve swagger UI using relative URLs so assets use the current page protocol.
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        // ensure swagger uses relative URL for the spec
        url: '/api-json',
      },
      customSiteTitle: 'Banking Platform API Docs',
    });
  }

  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: https://192.168.1.199:${port} or http://localhost:${port}`);
}
bootstrap();