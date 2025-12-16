import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { User } from '../../users/users.service';
declare const LocalStrategy_base: new (...args: any[]) => Strategy;
export declare class LocalStrategy extends LocalStrategy_base {
    private authService;
    constructor(authService: AuthService);
    validate(email: string, password: string): Promise<Omit<User, 'password' | 'refreshToken'>>;
}
export {};
