import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: AuthDto) {
    const userExists = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });

    if (userExists) {
      throw new ConflictException('Пользователь с таким логином уже существует');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        login: dto.login,
        password: hashedPassword,
        // Роль 'VIEWER' назначается базой данных по умолчанию
      },
    });

    return this.generateToken(user.id, user.role);
  }

  async login(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
      where: { login: dto.login },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    return this.generateToken(user.id, user.role);
  }

  private generateToken(userId: number, role: string) {
    const payload = { sub: userId, role };
    return {
      access_token: this.jwt.sign(payload),
    };
  }
}