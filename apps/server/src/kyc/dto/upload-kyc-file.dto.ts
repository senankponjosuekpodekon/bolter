export class UploadKycFileDto {
    documentType: 'ID_CARD' | 'PASSPORT' | 'SELFIE' | 'PROOF_ADDRESS';
    file: any; // Express.Multer.File type
}
