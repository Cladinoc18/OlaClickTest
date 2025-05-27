import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreationAttributes } from 'sequelize';
import { Op } from 'sequelize';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        @InjectModel(Order)
        private readonly orderModel: typeof Order,
        @InjectModel(OrderItem)
        private readonly orderItemModel: typeof OrderItem,
        private readonly sequelize: Sequelize,
        @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    ) { }

    async create(createOrderDto: CreateOrderDto): Promise<Order> {
        const transaction = await this.sequelize.transaction();
        try {
            this.logger.log(`Creando orden para cliente: ${createOrderDto.clientName}`);

            const order = await this.orderModel.create(
                {
                    clientName: createOrderDto.clientName,
                    status: OrderStatus.INITIATED, // por defecto estado "INITIATED"
                } as CreationAttributes<Order>,
                { transaction },
            );

            const itemsData = createOrderDto.items.map((itemDto) => ({
                ...itemDto,
                orderId: order.id,
            }));

            await this.orderItemModel.bulkCreate(itemsData as CreationAttributes<OrderItem>[], { transaction });

            await transaction.commit();
            this.logger.log(`Orden ID: ${order.id} creada exitosamente.`);



            const reloadedOrder = await this.orderModel.findByPk(order.id, {
                include: [OrderItem],
            });

            if (!reloadedOrder) {
                this.logger.error(`Error crítico: La orden con ID ${order.id} no se encontró después de la creación.`);
                throw new InternalServerErrorException('Error al recuperar la orden después de la creación.');
            }

            return reloadedOrder;

        } catch (error) {
            await transaction.rollback();
            this.logger.error(`Error al crear la orden: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Ocurrió un error al crear la orden. Por favor, inténtalo de nuevo.');
        }
    }

    async findAllActive(): Promise<Order[]> {
        this.logger.log('Obteniendo todas las órdenes activas');
        try {
            return this.orderModel.findAll({
                where: {
                    status: {
                        [Op.ne]: OrderStatus.DELIVERED,
                    },
                },
                include: [OrderItem],
                order: [['creationDate', 'DESC']],
            });
        } catch (error) {
            this.logger.error(`Error al obtener órdenes activas: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Ocurrió un error al obtener las órdenes.');
        }
    }

    async findOne(id: number): Promise<Order> {
        this.logger.log(`Buscando orden con ID: ${id}`);
        const order = await this.orderModel.findByPk(id, {
            include: [OrderItem],
        });

        if (!order) {
            this.logger.warn(`Orden con ID: ${id} no encontrada.`);
            throw new NotFoundException(`Orden con ID ${id} no encontrada.`);
        }

        return order;
    }

    async advanceOrderState(id: number): Promise<Order | { message: string; id: number }> {
  const transaction = await this.sequelize.transaction();
  try {
    this.logger.log(`Avanzando estado para orden con ID: ${id}`);
    const order = await this.orderModel.findByPk(id, {
      transaction,
    });

    if (!order) {
      this.logger.warn(`Orden con ID: ${id} no encontrada para avanzar estado.`);
      throw new NotFoundException(`Orden con ID ${id} no encontrada.`);
    }

    this.logger.debug(`Orden encontrada (ID: ${id}): ${JSON.stringify(order, null, 2)}`);
    this.logger.debug(`Estado actual de la orden ID ${id} antes del switch: [${order.status}]`);

    let result: Order | { message: string; id: number };

    switch (order.status) {
      case OrderStatus.INITIATED:
        order.status = OrderStatus.SENT;
        await order.save({ transaction });
        this.logger.log(`Orden ID: ${id} avanzada a ${OrderStatus.SENT}`);
        result = order;
        break;
      case OrderStatus.SENT:
        await order.destroy({ transaction });
        this.logger.log(`Orden ID: ${id} marcada como entregada y eliminada de la BD.`);
        try {
          await this.cacheManager.del('all_active_orders');
          this.logger.log("Caché 'all_active_orders' invalidado.");
        } catch (cacheError) {
          this.logger.error(`Error al invalidar el caché 'all_active_orders': ${cacheError.message}`, cacheError.stack);
        }
        result = { message: `Orden con ID ${id} marcada como entregada y eliminada.`, id };
        break;
      case OrderStatus.DELIVERED:
        this.logger.log(`Orden ID: ${id} ya está en estado ${OrderStatus.DELIVERED} y debería haber sido eliminada.`);
        result = { message: `Orden con ID ${id} ya está entregada (y debería estar eliminada).`, id };
        break;
      default:

        this.logger.warn(`Estado desconocido o no manejado para la orden ID: ${id} - Estado en switch: [${order.status}]`);
        throw new InternalServerErrorException(`Estado de orden no manejable o indefinido: [${order.status}]`);
    }

    await transaction.commit();
    return result;

  } catch (error) {

    if (transaction ) {
        await transaction.rollback();
    }
    this.logger.error(`Error al avanzar estado de la orden ID ${id}: ${error.message}`, error.stack);
    if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
      throw error;
    }
    throw new InternalServerErrorException('Ocurrió un error al avanzar el estado de la orden.');
  }
}
}