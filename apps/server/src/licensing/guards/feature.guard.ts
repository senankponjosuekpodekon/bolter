import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LicensingService } from '../licensing.service';

/**
 * Decorator to require a specific feature
 * Usage: @RequireFeature('loans')
 */
export const RequireFeature = (feature: string) => {
  return (target: Record<string, unknown>, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata('requireFeature', feature, descriptor?.value || target);
  };
};

/**
 * Guard to check if feature is available for tenant
 */
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private licensingService: LicensingService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required feature from metadata
    const requiredFeature = this.reflector.get<string>(
      'requireFeature',
      context.getHandler(),
    );

    if (!requiredFeature) {
      return true; // No feature requirement
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenant_id;

    if (!tenantId) {
      throw new BadRequestException('No tenant associated with user');
    }

    // Check if feature is available
    const hasFeature = await this.licensingService.hasFeature(tenantId, requiredFeature);

    if (!hasFeature) {
      throw new BadRequestException(
        `Feature "${requiredFeature}" is not available for your license tier. Please upgrade to access this feature.`,
      );
    }

    return true;
  }
}
