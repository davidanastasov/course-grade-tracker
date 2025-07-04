import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../user/entities/user.entity';
import { ROLES_KEY } from '../guards/roles.guard';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
