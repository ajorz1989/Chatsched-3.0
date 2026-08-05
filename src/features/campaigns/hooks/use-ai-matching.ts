import { useMutation } from '@tanstack/react-query';
import { matchCampaignWithAI, MatchRequest } from '../services/ai-campaign-service';
import { useAuth } from '../../../hooks/useAuth';

export function useAIMatching() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: (params: Omit<MatchRequest, 'userId'>) => {
      if (!user) throw new Error('User not authenticated');
      return matchCampaignWithAI({
        ...params,
        userId: user.id,
      });
    },
    onSuccess: (data) => {
      console.log('[AI] Match complete. Job ID:', data.jobId);
      if (data.fallbackUsed) {
        // Optionally notify the user that AI was unavailable
        console.warn('[AI] Fallback logic was used.');
      }
    },
    onError: (error) => {
      // User-friendly error handling (we'll show a toast in the UI)
      console.error('[AI] Matching failed:', error);
    },
  });
}
