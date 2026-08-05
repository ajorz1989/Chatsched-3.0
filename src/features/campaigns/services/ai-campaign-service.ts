import { supabase } from '../../../lib/supabase/client';

interface MatchRequest {
  campaignId?: string;
  userId: string;
  businessDescription: string;
  budget: number;
  location: string;
  niche: string;
}

interface MatchResponse {
  success: boolean;
  jobId: string;
  data: {
    matched_publisher_ids: string[];
    reasoning: string;
    suggested_budget_allocation?: Array<{ publisher_id: string; suggested_amount: number }>;
  };
  fallbackUsed: boolean;
}

export async function matchCampaignWithAI(params: MatchRequest): Promise<MatchResponse> {
  // Call the Supabase Edge Function
  const { data, error } = await supabase.functions.invoke('ai-orchestrator', {
    body: JSON.stringify(params),
  });

  if (error) {
    console.error('AI Orchestrator Error:', error);
    throw new Error('Failed to get AI match. Please try again.');
  }

  return data as MatchResponse;
}
