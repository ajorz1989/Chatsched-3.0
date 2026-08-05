import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignApi } from '../services/campaign-api';
import { useAuth } from '../../../hooks/useAuth'; // Assuming you have this

export const CAMPAIGNS_QUERY_KEY = 'campaigns';

export function useCampaigns() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [CAMPAIGNS_QUERY_KEY, userId],
    queryFn: () => {
      if (!userId) throw new Error('User not authenticated');
      return campaignApi.getCampaigns(userId);
    },
    enabled: !!userId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => campaignApi.createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CAMPAIGNS_QUERY_KEY] });
    },
  });
}
