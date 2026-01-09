import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LicensingService } from '../licensing.service';
export declare const RequireFeature: (feature: string) => (target: Record<string, unknown>, key?: string, descriptor?: PropertyDescriptor) => void;
export declare class FeatureGuard implements CanActivate {
    private licensingService;
    private reflector;
    constructor(licensingService: LicensingService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
