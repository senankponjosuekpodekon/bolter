export interface KycDocument {
  id: string;
  document_type: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
}
