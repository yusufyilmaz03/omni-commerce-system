import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  AuthResponse,
  AuthenticatedUser,
  JwtPayload,
  StoredUser,
} from './auth.types';

@Injectable()
export class AuthService {
  private readonly usersByEmail = new Map<string, StoredUser>();
  private readonly saltRounds = 10;

  constructor(private readonly jwtService: JwtService) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const email = registerDto.email.toLowerCase();

    if (this.usersByEmail.has(email)) {
      throw new ConflictException('Email is already registered');
    }

    const user: StoredUser = {
      email,
      id: randomUUID(),
      name: registerDto.name,
      passwordHash: await bcrypt.hash(registerDto.password, this.saltRounds),
    };

    this.usersByEmail.set(email, user);

    return this.createAuthResponse(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const email = loginDto.email.toLowerCase();
    const user = this.usersByEmail.get(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createAuthResponse(user);
  }

  async verifyToken(accessToken: string): Promise<AuthenticatedUser> {
    const payload = await this.jwtService.verifyAsync<JwtPayload>(accessToken);

    return {
      email: payload.email,
      id: payload.sub,
      name: payload.name,
    };
  }

  private async createAuthResponse(user: StoredUser): Promise<AuthResponse> {
    const payload: JwtPayload = {
      email: user.email,
      name: user.name,
      sub: user.id,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: this.toAuthenticatedUser(user),
    };
  }

  private toAuthenticatedUser(user: StoredUser): AuthenticatedUser {
    return {
      email: user.email,
      id: user.id,
      name: user.name,
    };
  }
}
