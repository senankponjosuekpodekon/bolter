import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebhooksService, CreateWebhookDto, UpdateWebhookDto } from './webhooks.service';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: {
    id: string;
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
    console.log('CREATE WEBHOOK - req.user:', JSON.stringify(req.user, null, 2));
    console.log('CREATE WEBHOOK - user.id:', req.user?.id);
    
    if (!dto.url || !dto.events || dto.events.length === 0) {
      throw new HttpException('Missing required fields', HttpStatus.BAD_REQUEST);
    }

    // Basic URL validation to catch invalid inputs early
    try {
      // eslint-disable-next-line no-new
      new URL(dto.url);
    } catch {
      throw new HttpException('Invalid URL', HttpStatus.BAD_REQUEST);
    }

    if (!req.user?.id) {
      throw new HttpException('User ID not found in request', HttpStatus.UNAUTHORIZED);
    }

    try {
      const webhook = await this.webhooksService.createWebhook(req.user.id, dto);
      return { success: true, webhook };
    } catch (err) {
      const message = (err as Error)?.message || 'Failed to create webhook';
      const isPolicyErr = /permission|RLS|policy/i.test(message);
      const status = isPolicyErr ? HttpStatus.FORBIDDEN : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(message, status);
    }
  }

  @Get()
  async getUserWebhooks(@Req() req: AuthRequest) {
    const webhooks = await this.webhooksService.getUserWebhooks(req.user.id);
    return { success: true, webhooks };
  }

  @Get(':id')
  async getWebhook(@Req() req: AuthRequest, @Param('id') webhookId: string) {
    const webhook = await this.webhooksService.getWebhookById(req.user.id, webhookId);
    if (!webhook) {
      throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);
    }
    return { success: true, webhook };
  }

  @Put(':id')
  async updateWebhook(@Req() req: AuthRequest, @Param('id') webhookId: string, @Body() dto: UpdateWebhookDto) {
    const webhook = await this.webhooksService.updateWebhook(req.user.id, webhookId, dto);
    if (!webhook) {
      throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);
    }
    return { success: true, webhook };
  }

  @Delete(':id')
  async deleteWebhook(@Req() req: AuthRequest, @Param('id') webhookId: string) {
    const success = await this.webhooksService.deleteWebhook(req.user.id, webhookId);
    if (!success) {
      throw new HttpException('Failed to delete webhook', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { success: true };
  }

  @Get(':id/deliveries')
  async getWebhookDeliveries(@Req() req: AuthRequest, @Param('id') webhookId: string) {
    const deliveries = await this.webhooksService.getWebhookDeliveries(req.user.id, webhookId);
    return { success: true, deliveries };
  }

  @Post(':id/test')
  async testWebhook(@Req() req: AuthRequest, @Param('id') webhookId: string) {
    const webhook = await this.webhooksService.getWebhookById(req.user.id, webhookId);
    if (!webhook) {
      throw new HttpException('Webhook not found', HttpStatus.NOT_FOUND);
    }

    return this.webhooksService.testWebhook(webhookId);
  }

  @Post('deliveries/:deliveryId/retry')
  async retryDelivery(@Req() req: AuthRequest, @Param('deliveryId') deliveryId: string) {
    const success = await this.webhooksService.retryWebhookDelivery(req.user.id, deliveryId);
    if (!success) {
      throw new HttpException('Failed to retry delivery', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { success: true };
  }
}
