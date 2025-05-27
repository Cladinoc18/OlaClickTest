import { IsNotEmpty, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsString({ message: 'La descripción del ítem debe ser un texto.' })
  @IsNotEmpty({ message: 'La descripción del ítem no puede estar vacía.' })
  description: string;

  @IsNumber({}, { message: 'La cantidad debe ser un número.' })
  @IsPositive({ message: 'La cantidad debe ser un número positivo.' })
  @Min(1, { message: 'La cantidad mínima debe ser 1.' })
  quantity: number;

  @IsNumber({}, { message: 'El precio unitario debe ser un número.' })
  @IsPositive({ message: 'El precio unitario debe ser un número positivo.' })
  unitPrice: number;
}