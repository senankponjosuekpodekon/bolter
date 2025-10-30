import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(req: any, createUserDto: CreateUserDto): Promise<any>;
    findAll(query: QueryUserDto): Promise<any[]>;
    getProfile(req: any): Promise<any>;
    findOne(id: string): Promise<any>;
    updateProfile(req: any, updateUserDto: UpdateUserDto): Promise<any>;
    update(req: any, id: string, updateUserDto: UpdateUserDto): Promise<any>;
    remove(req: any, id: string): Promise<any>;
}
