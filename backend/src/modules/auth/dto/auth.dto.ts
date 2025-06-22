import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../user/entities/user.entity';

export class RegisterDto {
  @ApiProperty({
    description: 'Username for the user account',
    example: 'john_doe',
    minLength: 3
  })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password for the user account',
    example: 'strongPassword123',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'First name of the user',
    example: 'John'
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe'
  })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({
    description: 'Role of the user in the system',
    enum: UserRole,
    default: UserRole.STUDENT
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.STUDENT;
}

export class LoginDto {
  @ApiProperty({
    description: 'Username for login',
    example: 'john_doe'
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Password for login',
    example: 'strongPassword123'
  })
  @IsString()
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  access_token: string;

  @ApiProperty({
    description: 'User information',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'uuid-string' },
      username: { type: 'string', example: 'john_doe' },
      email: { type: 'string', example: 'john.doe@example.com' },
      firstName: { type: 'string', example: 'John' },
      lastName: { type: 'string', example: 'Doe' },
      role: { type: 'string', enum: Object.values(UserRole), example: UserRole.STUDENT }
    }
  })
  user: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
}
