import { SupabaseService } from '../supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private supabase;
    constructor(supabase: SupabaseService);
    create(data: CreateUserDto): Promise<any>;
    findAll(params?: {
        skip?: number;
        take?: number;
    }): Promise<any[]>;
    findById(id: string): Promise<any | null>;
    findByEmail(email: string): Promise<any | null>;
    update(id: string, updateData: UpdateUserDto): Promise<any>;
    remove(id: string): Promise<any>;
    setRefreshToken(userId: string, refreshToken: string): Promise<void>;
    removeRefreshToken(userId: string): Promise<void>;
    private hashPassword;
    private generateAccountNumber;
    private mapUser;
}
