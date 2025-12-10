import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { CARD_STATUSES, CardStatus } from './create-card.dto';

export class UpdateCardDto {
    @ApiPropertyOptional({ enum: CARD_STATUSES, description: 'Card status' })
    @IsOptional()
    @IsIn(CARD_STATUSES, { message: 'Status must be ACTIVE, BLOCKED, or EXPIRED' })
    status?: CardStatus;
}
