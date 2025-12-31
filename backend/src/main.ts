import {NestFactory} from '@nestjs/core';
import {ValidationPipe} from '@nestjs/common';
import {AppModule} from './app.module';

async function bootstrap() {
    try {
        console.log('Starting backend server...');
        console.log('Environment:', process.env.NODE_ENV || 'development');
        console.log('Port:', process.env.PORT || 3001);

        const app = await NestFactory.create(AppModule, {
            logger: ['error', 'warn', 'log'],
        });

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                transform: true,
                forbidNonWhitelisted: true,
            }),
        );

        const corsOrigins = process.env.CORS_ORIGIN ?
            process.env.CORS_ORIGIN.split(',').map(o => o.trim()) :
            ['http://localhost:3002'];

        app.enableCors({
            origin: corsOrigins,
            credentials: true,
        });

        const port = process.env.PORT || 3001;
        await app.listen(port, '0.0.0.0');

        console.log(`Server running on port ${port}`);
        console.log(`CORS Origins: ${corsOrigins.join(', ')}`);
        console.log('Application ready');
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

bootstrap();