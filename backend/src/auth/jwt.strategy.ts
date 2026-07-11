import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Используем тот же секрет, что и при генерации токена
      secretOrKey: process.env.JWT_SECRET as string, 
    });
  }

  // Этот метод вызывается автоматически, если токен валиден
  async validate(payload: any) {
    // Возвращаем объект, который будет доступен в контроллерах через req.user
    return { userId: payload.sub, role: payload.role };
  }
}