import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(req: any, createUserDto: CreateUserDto): Promise<import("./users.service").User>;
    findAll(req: any, query: QueryUserDto): Promise<import("./users.service").User[]>;
    getProfile(req: any): Promise<import("./users.service").User>;
    findOne(id: string): Promise<import("./users.service").User>;
    updateProfile(req: any, updateUserDto: UpdateUserDto): Promise<import("./users.service").User>;
    update(req: any, id: string, updateUserDto: UpdateUserDto): Promise<import("./users.service").User>;
    remove(req: any, id: string): Promise<import("./users.service").User>;
}
