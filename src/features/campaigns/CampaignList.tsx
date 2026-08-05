import React, { useMemo } from 'react';
import { useCampaigns } from './hooks/use-campaigns';

type Campaign = any; // replace with your real Campaign type

const CampaignCard: React.FC<{ campaign: Campaign }> = React.memo(function CampaignCard({ campaign }) {
  return (
    <div className="rounded-lg border p-4 hover:shadow-md transition-shadow">
      <h3 className="font-semibold">{campaign.name}</h3>
      <p className="text-sm text-gray-500">Status: {campaign.status}</p>
    </div>
  );
});

export function CampaignList(): JSX.Element {
  const { data: campaigns, isLoading } = useCampaigns();

  const renderedCards = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return null;
    return campaigns.map((campaign) => (
      <CampaignCard key={campaign.id} campaign={campaign} />
    ));
  }, [campaigns]);

  if (isLoading) return <div>Loading campaigns...</div>;
  if (!campaigns || campaigns.length === 0) return <div>No campaigns found.</div>;

  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{renderedCards}</div>;
}
