import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(Role, { message: 'Указана несуществующая роль' })
  role?: Role;

  @IsOptional()
  @IsString()
  login?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password?: string;
}
