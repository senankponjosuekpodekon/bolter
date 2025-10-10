import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUserDto): Promise<User> {
    const { password, ...userData } = data;
    
    // Hash password if provided
    const hashedPassword = password ? await this.hashPassword(password) : null;
    
    return this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        profile: {
          create: {},
        },
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        profile: true,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    const { password, ...userData } = data;
    
    // Hash password if provided
    const hashedPassword = password ? await this.hashPassword(password) : undefined;
    
    return this.prisma.user.update({
      where: { id },
      data: {
        ...userData,
        ...(hashedPassword && { password: hashedPassword }),
      },
      include: {
        profile: true,
      },
    });
  }

  async updateProfile(userId: string, data: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    // Update or create profile
    await this.prisma.profile.upsert({
      where: { userId },
      update: data,
      create: {
        ...data,
        userId,
      },
    });
    
    return this.findById(userId);
  }

  async remove(id: string): Promise<User> {
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async setRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async addCredits(userId: string, amount: number): Promise<User> {
    const user = await this.findById(userId);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: amount,
        },
      },
    });
  }

  async deductCredits(userId: string, amount: number): Promise<User> {
    const user = await this.findById(userId);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    if (user.credits < amount) {
      throw new BadRequestException('Insufficient credits');
    }
    
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: amount,
        },
      },
    });
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }
}