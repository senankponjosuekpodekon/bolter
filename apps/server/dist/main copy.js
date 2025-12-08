"use strict";
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
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 3000);
    const logger = app.get(logger_service_1.Logger);
    app.useLogger(logger);
    app.setGlobalPrefix('api');
    app.use((0, helmet_1.default)());
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
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
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    await app.listen(port, '0.0.0.0');
    logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main%20copy.js.map