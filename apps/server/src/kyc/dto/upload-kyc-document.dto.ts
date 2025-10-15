import { IsString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadKycDocumentDto {
  @ApiProperty() @IsEnum(['ID_CARD', 'PASSPORT', 'SELFIE', 'PROOF_ADDRESS']) documentType: string;
  @ApiProperty() @IsString() filePath: string;
  @ApiProperty() @IsNumber() fileSize: number;
  @ApiProperty() @IsString() mimeType: string;
}
