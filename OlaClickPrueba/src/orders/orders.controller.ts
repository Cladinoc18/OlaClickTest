import { Controller, Post, Body, HttpCode, HttpStatus, Logger, Get, UseInterceptors, Param, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { Order } from './entities/order.entity';

@Controller('orders')
export class OrdersController {
    private readonly logger = new Logger(OrdersController.name);

    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createOrderDto: CreateOrderDto) {
        this.logger.log(`Recibida solicitud para crear orden: ${JSON.stringify(createOrderDto)}`);
        return this.ordersService.create(createOrderDto);
    }

    @Get()
    @UseInterceptors(CacheInterceptor)
    @CacheKey('all_active_orders')
    @CacheTTL(30)
    async findAllActive() {
        this.logger.log('Recibida solicitud para listar todas las órdenes activas');
        return this.ordersService.findAllActive();
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Order> {
        this.logger.log(`Recibida solicitud para ver detalle de orden con ID: ${id}`);
        return this.ordersService.findOne(id);
    }

    @Post(':id/advance')
    @HttpCode(HttpStatus.OK)
    async advanceOrderState(@Param('id', ParseIntPipe) id: number) {
        this.logger.log(`Recibida solicitud para avanzar estado de orden con ID: ${id}`);
        return this.ordersService.advanceOrderState(id);
    }

}