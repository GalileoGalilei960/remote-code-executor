import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.use(cookieParser());

    // Setup Swagger documentation
    setupSwagger(app);

    await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap().catch((err) => {
    console.error('Application failed to start:', err);
    process.exit(1);
});
