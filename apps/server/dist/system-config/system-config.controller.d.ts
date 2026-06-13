import { SystemConfigService } from './system-config.service';
export declare class SystemConfigController {
    private readonly service;
    constructor(service: SystemConfigService);
    findAll(): Promise<import("./system-config.service").SystemConfigEntry[]>;
    findOne(key: string): Promise<import("./system-config.service").SystemConfigEntry>;
    upsert(key: string, body: Record<string, unknown>, req: {
        user: {
            id: string;
        };
    }): Promise<import("./system-config.service").SystemConfigEntry>;
    remove(key: string): Promise<void>;
}
