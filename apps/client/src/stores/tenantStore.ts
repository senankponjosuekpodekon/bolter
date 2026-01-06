import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
  contact_email?: string;
  status: string;
}

interface TenantStore {
  tenant: TenantInfo | null;
  setTenant: (tenant: TenantInfo) => void;
  clearTenant: () => void;
}

export const useTenantStore = create<TenantStore>()(
  persist(
    (set) => ({
      tenant: null,
      setTenant: (tenant: TenantInfo) => set({ tenant }),
      clearTenant: () => set({ tenant: null }),
    }),
    {
      name: 'tenant-storage',
    },
  ),
);
