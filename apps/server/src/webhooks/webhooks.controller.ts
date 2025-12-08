import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebhooksService, CreateWebhookDto, UpdateWebhookDto } from './webhooks.service';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: {
    sub: string;
    email: string;
    role?: string;
  };
}

@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) { }

  @Post()
  async createWebhook(@Req() req: AuthRequest, @Body() dto: CreateWebhookDto) {
    if (!dto.url || !dto.events || dto.events.length === 0) {
      throw new HttpException('Missing required fields', HttpStatus.BAD_REQUEST);
    }

    const webhook = await this.webhooksService.createWebhook(req.user.sub, dto);
    return { success: true, webhook };
  }

  @Get()
  async getUserWebhooks(@Req() req: AuthRequest) {
    const webhooks = await this.webhooksService.getUserWebhooks(req.user.sub);
    return { success: true, webhooks };
  }

  @Get(':id')
  async getWebhook(@Req() req: AuthRequest, @Param('id') webhookId: string) {
    const webhook = await this.webhooksService.getWebhookById(req.user.sub, webhookId);
    if (!webhook) {
      throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);
    }
    return { success: true, webhook };
  }

  @Put(':id')
  async updateWebhook(@Req() req: AuthRequest, @Param('id') webhookId: string, @Body() dto: UpdateWebhookDto) {
    const webhook = await this.webhooksService.updateWebhook(req.user.sub, webhookId, dto);
    if (!webhook) {
      throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);
    }
    return { success: true, webhook };
  }

  @Delete(':id')
  async deleteWebhook(@Req() req: AuthRequest, @Param('id') webhookId: string) {
    const success = await this.webhooksService.deleteWebhook(req.user.sub, webhookId);
    if (!success) {
      throw new HttpException('Failed to delete webhook', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { success: true };
  }

  @Get(':id/deliveries')
  async getWebhookDeliveries(@Req() req: AuthRequest, @Param('id') webhookId: string) {
    const deliveries = await this.webhooksService.getWebhookDeliveries(req.user.sub, webhookId);
    return { success: true, deliveries };
  }

  @Post('deliveries/:deliveryId/retry')
  async retryDelivery(@Req() req: AuthRequest, @Param('deliveryId') deliveryId: string) {
    const success = await this.webhooksService.retryWebhookDelivery(req.user.sub, deliveryId);
    if (!success) {
      throw new HttpException('Failed to retry delivery', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { success: true };
  }
}
