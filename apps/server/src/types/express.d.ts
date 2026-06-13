import { Tenant } from '../tenants/tenants.service';

declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }
  }
}
