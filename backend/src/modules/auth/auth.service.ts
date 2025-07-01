import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User, UserDocument } from '../user/entities/user.entity';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { username, email, password, ...userData } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel
      .findOne({
        $or: [{ username }, { email }]
      })
      .exec();

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new this.userModel({
      username,
      email,
      password: hashedPassword,
      ...userData
    });

    await user.save();

    return this.generateAuthResponse(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { username, password } = loginDto;

    // Find user
    const user = await this.userModel.findOne({ username }).exec();

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAuthResponse(user);
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userModel.findOne({ _id: userId, isActive: true }).exec();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private generateAuthResponse(user: User): AuthResponseDto {
    const payload = { sub: user.id, username: user.username, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };
  }
}
