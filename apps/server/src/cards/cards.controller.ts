import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('cards')
@Controller('cards')
@UseGuards(JwtAuthGuard, RolesGuard)
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
    getCardsByAccount(@Param('accountId') accountId: string) {
        return this.cardsService.findByAccountId(accountId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get card by ID' })
    @ApiResponse({ status: 200, description: 'Return card' })
    @ApiResponse({ status: 404, description: 'Card not found' })
    getCard(@Param('id') id: string) {
        return this.cardsService.findById(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new card for an account' })
    @ApiResponse({ status: 201, description: 'Card successfully created' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    createCard(@Req() req, @Body() createCardDto: CreateCardDto) {
        if (!createCardDto.accountId) {
            throw new BadRequestException('accountId is required');
        }
        return this.cardsService.create(req.user.id, createCardDto.accountId, createCardDto);
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
        return this.cardsService.create(userId, accountId, createCardDto, true);
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
