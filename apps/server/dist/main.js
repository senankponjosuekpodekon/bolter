"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("@nestjs/config");
const logger_service_1 = require("./common/logger/logger.service");
const throttler_1 = require("@nestjs/throttler");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function bootstrap() {
    const useHttps = process.env.USE_HTTPS === 'true';
    let app;
    if (useHttps) {
        const keyPath = path.join(__dirname, '../cert/192.168.1.198-key.pem');
        const certPath = path.join(__dirname, '../cert/192.168.1.198.pem');
        if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
            console.warn('[startup] USE_HTTPS=true but cert files not found at', keyPath, certPath, '; falling back to HTTP');
            app = await core_1.NestFactory.create(app_module_1.AppModule, {
                logger: ['error', 'warn', 'log', 'debug', 'verbose'],
            });
        }
        else {
            const httpsOptions = {
                key: fs.readFileSync(keyPath),
                cert: fs.readFileSync(certPath),
            };
            app = await core_1.NestFactory.create(app_module_1.AppModule, {
                logger: ['error', 'warn', 'log', 'debug', 'verbose'],
                httpsOptions,
            });
        }
    }
    else {
        app = await core_1.NestFactory.create(app_module_1.AppModule, {
            logger: ['error', 'warn', 'log', 'debug', 'verbose'],
        });
    }
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 3000);
    const logger = app.get(logger_service_1.Logger);
    app.useLogger(logger);
    app.setGlobalPrefix('api');
    if (useHttps) {
        app.use((0, helmet_1.default)());
    }
    else {
        app.use((0, helmet_1.default)({
            crossOriginOpenerPolicy: false,
            contentSecurityPolicy: false,
            originAgentCluster: false,
        }));
    }
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const throttlerGuard = app.get(throttler_1.ThrottlerGuard);
    app.useGlobalGuards(throttlerGuard);
    const swaggerConfig = new swagger_1.DocumentBuilder()
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
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            url: '/api-json',
        },
        customSiteTitle: 'Banking Platform API Docs',
    });
    await app.listen(port, '0.0.0.0');
    logger.log(`Application is running on: https://192.168.1.199:${port} or http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map