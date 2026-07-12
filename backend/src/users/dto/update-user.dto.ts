import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @IsEnum(Role, { message: 'Указана несуществующая роль' })
  role!: Role;
}
