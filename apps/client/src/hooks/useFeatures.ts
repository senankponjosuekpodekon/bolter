import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface AvailableFeatures {
  modules: Record<string, boolean>;
}

/**
 * Hook to get available features for current tenant
 * Usage: const { features, isLoading } = useAvailableFeatures();
 */
export function useAvailableFeatures() {
  const { data, isLoading, error } = useQuery<AvailableFeatures>({
    queryKey: ['licensing', 'features'],
    queryFn: async () => {
      const response = await api.get('/licensing/available-features');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    features: data?.modules || {},
    isLoading,
    error,
  };
}

/**
 * Hook to check if a specific feature is available
 * Usage: const hasLoans = useFeature('loans');
 */
export function useFeature(featureName: string): boolean {
  const { features } = useAvailableFeatures();
  return features[featureName] === true;
}

/**
 * Hook to get license information
 */
export function useLicense() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['licensing', 'current'],
    queryFn: async () => {
      const response = await api.get('/licensing/current');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    license: data,
    isLoading,
    error,
  };
}

/**
 * Hook to get remaining limit for a feature
 */
export function useFeatureLimit(featureName: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['licensing', 'limits', featureName],
    queryFn: async () => {
      const response = await api.get(`/licensing/limits/${featureName}`);
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    remaining: data?.remaining || 0,
    limit: data?.limit || 0,
    isLoading,
    error,
  };
}

/**
 * Component to conditionally render based on feature availability
 * Usage: <FeatureGate feature="loans"><LoanComponent /></FeatureGate>
 */
export function FeatureGate({
  feature,
  children,
  fallback,
}: {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const hasFeature = useFeature(feature);
  const { isLoading } = useAvailableFeatures();

  if (isLoading) {
    return <>{children}</>; // Optimistically show while loading
  }

  if (!hasFeature) {
    return (
      <>
        {fallback || (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800">
              The <strong>{feature}</strong> feature is not available in your current plan.
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Please upgrade your license to access this feature.
            </p>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
