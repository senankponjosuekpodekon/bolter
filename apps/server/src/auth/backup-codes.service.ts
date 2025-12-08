import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';
import { Logger } from '../common/logger/logger.service';

export interface BackupCode {
  id: string;
  user_id: string;
  code_hash: string;
  used_at: string | null;
  created_at: string;
}

@Injectable()
export class BackupCodesService {
  private readonly CODE_LENGTH = 8;
  private readonly CODE_COUNT = 10;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: Logger,
  ) { }

  async generateBackupCodes(userId: string): Promise<string[]> {
    // Delete existing unused codes
    await this.supabase
      .getAdminClient()
      .from('backup_codes')
      .delete()
      .eq('user_id', userId)
      .is('used_at', null);

    const codes: string[] = [];
    const hashes: string[] = [];

    // Generate new codes
    for (let i = 0; i < this.CODE_COUNT; i++) {
      const code = this.generateCode();
      const hash = this.hashCode(code);
      codes.push(code);
      hashes.push(hash);
    }

    // Store hashed codes in database
    const entries = hashes.map((hash) => ({
      user_id: userId,
      code_hash: hash,
    }));

    const { error } = await this.supabase
      .getAdminClient()
      .from('backup_codes')
      .insert(entries);

    if (error) {
      this.logger.error(`Failed to save backup codes: ${error.message}`, undefined, BackupCodesService.name);
      throw new Error('Failed to generate backup codes');
    }

    // Update user's backup codes generation timestamp
    await this.supabase
      .getAdminClient()
      .from('users')
      .update({ backup_codes_generated_at: new Date().toISOString() })
      .eq('id', userId);

    return codes;
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const hash = this.hashCode(code);

    // Find unused backup code
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('backup_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('code_hash', hash)
      .is('used_at', null)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    // Mark code as used
    const { error: updateError } = await this.supabase
      .getAdminClient()
      .from('backup_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', data.id);

    if (updateError) {
      this.logger.error(`Failed to mark backup code as used: ${updateError.message}`, undefined, BackupCodesService.name);
      return false;
    }

    this.logger.log(`Backup code used for user ${userId}`, BackupCodesService.name);
    return true;
  }

  async getRemainingCodesCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .getAdminClient()
      .from('backup_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('used_at', null);

    if (error) {
      this.logger.error(`Failed to get remaining codes count: ${error.message}`, undefined, BackupCodesService.name);
      return 0;
    }

    return count || 0;
  }

  async hasBackupCodes(userId: string): Promise<boolean> {
    const count = await this.getRemainingCodesCount(userId);
    return count > 0;
  }

  private generateCode(): string {
    // Generate 8-character alphanumeric code (excluding similar characters)
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude 0, O, 1, I
    let code = '';

    const bytes = randomBytes(this.CODE_LENGTH);
    for (let i = 0; i < this.CODE_LENGTH; i++) {
      code += chars[bytes[i] % chars.length];
    }

    // Format as XXXX-XXXX
    return `${code.slice(0, 4)}-${code.slice(4)}`;
  }

  private hashCode(code: string): string {
    // Remove formatting and hash
    const cleanCode = code.replace(/-/g, '');
    return createHash('sha256').update(cleanCode).digest('hex');
  }
}
