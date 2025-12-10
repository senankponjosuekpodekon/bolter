export class UploadKycFileDto {
    documentType: 'ID_CARD' | 'PASSPORT' | 'SELFIE' | 'PROOF_ADDRESS';
    file: { originalname: string; buffer: Buffer; mimetype: string; size: number };
}
