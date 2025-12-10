import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID, IsOptional } from 'class-validator';

export const CARD_TYPES = ['VIRTUAL', 'PHYSICAL'] as const;
export const CARD_STATUSES = ['ACTIVE', 'BLOCKED', 'EXPIRED'] as const;

export type CardType = (typeof CARD_TYPES)[number];
export type CardStatus = (typeof CARD_STATUSES)[number];

export class CreateCardDto {
    @ApiProperty({ description: 'Account ID to attach card to' })
    @IsUUID()
    accountId: string;

    @ApiPropertyOptional({ enum: CARD_TYPES, description: 'Card type', default: 'VIRTUAL' })
    @IsOptional()
    @IsIn(CARD_TYPES, { message: 'Card type must be VIRTUAL or PHYSICAL' })
    type?: CardType;
}
