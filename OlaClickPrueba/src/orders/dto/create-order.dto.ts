import { IsArray, IsNotEmpty, IsString, ValidateNested, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @IsString({ message: 'El nombre del cliente debe ser un texto.' })
  @IsNotEmpty({ message: 'El nombre del cliente no puede estar vacío.' })
  clientName: string;

  @IsArray({ message: 'Los ítems deben ser un listado.' })
  @ArrayNotEmpty({ message: 'La orden debe tener al menos un ítem.'})
  @ValidateNested({ each: true, message: 'Cada ítem debe cumplir con las reglas de validación.' }) 
  @Type(() => CreateOrderItemDto) 
  items: CreateOrderItemDto[];
}