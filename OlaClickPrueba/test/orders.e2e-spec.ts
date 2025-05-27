import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest'; 
import { AppModule } from './../src/app.module';

describe('OrdersController (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
                transformOptions: {
                    enableImplicitConversion: true,
                },
            }),
        );

            await app.init(); 

    });

    afterAll(async () => {
        if (app) await app.close();
        
    });

    it('/orders (GET) should return an array of orders', () => {

        return request(app.getHttpServer()) 
            .get('/orders')
            .expect(200)
            .expect((res) => {
                expect(Array.isArray(res.body)).toBe(true);
            });
    });

    it('/orders (POST) should create an order', async () => {

        const createOrderDto = {
            clientName: 'Cliente de Prueba E2E',
            items: [{ description: 'Item E2E', quantity: 1, unitPrice: 10 }],
        };

        const response = await request(app.getHttpServer())
            .post('/orders')
            .send(createOrderDto)
            .expect(201);

        expect(response.body).toBeDefined();
        expect(response.body.clientName).toEqual(createOrderDto.clientName);
        expect(response.body.status).toEqual('initiated');
        expect(Array.isArray(response.body.items)).toBe(true);
        expect(response.body.items.length).toBe(1);
        expect(response.body.items[0].description).toEqual(createOrderDto.items[0].description);
    });

});