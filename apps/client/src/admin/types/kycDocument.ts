export interface AdminKYCDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_path: string;
  mime_type?: string;
  status: string;
  created_at?: string;
}
