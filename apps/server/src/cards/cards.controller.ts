import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CardsService, Card } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtVerifiedGuard } from '../auth/guards/jwt-verified.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('cards')
@Controller('cards')
@UseGuards(JwtAuthGuard, JwtVerifiedGuard, RolesGuard)
@ApiBearerAuth()
export class CardsController {
    constructor(private readonly cardsService: CardsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all cards for current user' })
    @ApiResponse({ status: 200, description: 'Return cards' })
    getAllCards(@Req() req) {
        return this.cardsService.findByUserId(req.user.id);
    }

    @Get('account/:accountId')
    @ApiOperation({ summary: 'Get cards for an account' })
    @ApiResponse({ status: 200, description: 'Return cards' })
    async getCardsByAccount(@Req() req, @Param('accountId') accountId: string) {
        const cards = await this.cardsService.findByAccountId(accountId);
        const isAdmin = ['ADMIN', 'COMPLIANCE', 'SUPER_ADMIN'].includes(req.user.role);
        if (!isAdmin) {
            const userCards = await this.cardsService.findByUserId(req.user.id);
            const userAccountIds = new Set(userCards.map((c: Card) => c.account_id));
            if (!userAccountIds.has(accountId)) throw new ForbiddenException('Access denied');
        }
        return cards;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get card by ID' })
    @ApiResponse({ status: 200, description: 'Return card' })
    @ApiResponse({ status: 404, description: 'Card not found' })
    async getCard(@Req() req, @Param('id') id: string) {
        const card = await this.cardsService.findById(id) as Card;
        const isAdmin = ['ADMIN', 'COMPLIANCE', 'SUPER_ADMIN'].includes(req.user.role);
        if (!isAdmin) {
            const userCards = await this.cardsService.findByUserId(req.user.id);
            const userAccountIds = new Set(userCards.map((c: Card) => c.account_id));
            if (!userAccountIds.has(card?.account_id)) {
                throw new ForbiddenException('Access denied');
            }
        }
        return card;
    }

    @Post()
    @ApiOperation({ summary: 'Create a new card for an account' })
    @ApiResponse({ status: 201, description: 'Card successfully created' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    createCard(@Req() req, @Body() createCardDto: CreateCardDto) {
        if (!createCardDto.accountId) {
            throw new BadRequestException('accountId is required');
        }
        return this.cardsService.create(req.user.id, createCardDto.accountId, createCardDto, false, req.tenant?.id);
    }

    @Post('admin/:userId/:accountId')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Create card for a user (Admin - bypasses limits)' })
    @ApiResponse({ status: 201, description: 'Card successfully created' })
    createCardAsAdmin(
        @Req() req,
        @Param('userId') userId: string,
        @Param('accountId') accountId: string,
        @Body() createCardDto: CreateCardDto,
    ) {
        return this.cardsService.create(userId, accountId, createCardDto, true, req.tenant?.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update card (block, unblock, etc.)' })
    @ApiResponse({ status: 200, description: 'Card successfully updated' })
    @ApiResponse({ status: 404, description: 'Card not found' })
    updateCard(@Req() req, @Param('id') id: string, @Body() updateCardDto: UpdateCardDto) {
        return this.cardsService.update(req.user.id, id, updateCardDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a card' })
    @ApiResponse({ status: 200, description: 'Card successfully deleted' })
    @ApiResponse({ status: 404, description: 'Card not found' })
    deleteCard(@Req() req, @Param('id') id: string) {
        return this.cardsService.delete(req.user.id, id);
    }
}
