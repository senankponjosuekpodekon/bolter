import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class EnableTwoFactorDto {
    @ApiProperty({ example: '123456' })
    @IsString()
    token: string;
}

export class VerifyTwoFactorDto {
    @ApiProperty({ example: '123456' })
    @IsString()
    token: string;
}

export class TwoFactorResponseDto {
    @ApiProperty()
    secret: string;

    @ApiProperty()
    qrCodeUrl: string;
}