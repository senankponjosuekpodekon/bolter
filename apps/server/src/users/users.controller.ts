import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { QueryUserDto } from './dto/query-user.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  create(@Req() req, @Body() createUserDto: CreateUserDto) {
    const actor = req.user;
    const requestedRole = createUserDto.role ?? 'CLIENT';

    if (actor.role === 'ADMIN') {
      // ADMIN can only create CLIENT or COMPLIANCE
      if (requestedRole === 'ADMIN' || requestedRole === 'SUPER_ADMIN') {
        throw new ForbiddenException('ADMIN can only create CLIENT or COMPLIANCE users');
      }
    }

    if (actor.role === 'SUPER_ADMIN' && requestedRole === 'SUPER_ADMIN') {
      throw new ForbiddenException('Cannot create another SUPER_ADMIN');
    }

    const tenantId = req.tenant?.id ?? null;
    return this.usersService.create(createUserDto, { performedBy: actor.id, tenantId });
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  findAll(@Req() req, @Query() query: QueryUserDto) {
    const { skip, take } = query;
    const tenantId = req.user?.role === 'SUPER_ADMIN' ? null : (req.tenant?.id ?? null);
    return this.usersService.findAll({ skip, take, tenantId });
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Req() req) {
    return this.usersService.findById(req.user.id);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    const allowed = { ...(updateUserDto ?? {}) } as Record<string, unknown>;
    delete allowed.role;       // Users cannot change their own role
    delete allowed.status;     // Users cannot change their own status
    delete allowed.kyc_status; // Users cannot change their own KYC status
    return this.usersService.update(req.user.id, allowed as UpdateUserDto, { performedBy: req.user.id });
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user (Admin only)' })
  async update(@Req() req, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const actor = req.user;
    // Only SUPER_ADMIN can assign/change roles
    if (updateUserDto.role && actor.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only SUPER_ADMIN can change user roles');
    }
    // ADMIN cannot modify another ADMIN or SUPER_ADMIN
    if (actor.role === 'ADMIN') {
      const target = await this.usersService.findById(id);
      if (target?.role === 'ADMIN' || target?.role === 'SUPER_ADMIN') {
        throw new ForbiddenException('ADMIN cannot modify another ADMIN or SUPER_ADMIN');
      }
    }
    return this.usersService.update(id, updateUserDto, { performedBy: actor.id });
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  async remove(@Req() req, @Param('id') id: string) {
    const actor = req.user;
    // Nobody can delete a SUPER_ADMIN
    const target = await this.usersService.findById(id);
    if (target?.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('SUPER_ADMIN accounts cannot be deleted');
    }
    // ADMIN cannot delete another ADMIN
    if (actor.role === 'ADMIN' && target?.role === 'ADMIN') {
      throw new ForbiddenException('ADMIN cannot delete another ADMIN');
    }
    return this.usersService.remove(id, { performedBy: actor.id });
  }
}
