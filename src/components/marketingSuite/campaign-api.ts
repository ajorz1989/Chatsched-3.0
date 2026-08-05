import { supabase, safeQuery } from '../../../lib/api-client';
import type { Campaign, CampaignInsert } from '../types';

export const campaignApi = {
  getCampaigns: (userId: string) => 
    safeQuery(() => 
      supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    ),

  createCampaign: (data: CampaignInsert) =>
    safeQuery(() => 
      supabase.from('campaigns').insert(data).select().single()
    ),
};
