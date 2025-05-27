import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
  HasMany,
  Default,
} from 'sequelize-typescript';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  INITIATED = 'initiated',
  SENT = 'sent',
  DELIVERED = 'delivered',
}

@Table({
  tableName: 'orders',
  timestamps: true,
})
export class Order extends Model<Order> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare clientName: string;

  @Default(OrderStatus.INITIATED)
  @Column({
    type: DataType.ENUM(...Object.values(OrderStatus)),
    allowNull: false,
  })
  declare status: OrderStatus;

  @CreatedAt
  declare creationDate: Date;

  @UpdatedAt
  declare updatedOn: Date;

  @HasMany(() => OrderItem)
  items: OrderItem[];
}