import { IsString, MinLength } from 'class-validator';

export class AuthDto {
  @IsString()
  @MinLength(3, { message: 'Логин должен содержать минимум 3 символа' })
  login!: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  password!: string;
}