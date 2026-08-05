import React from 'react';
import { useAIMatching } from '../features/campaigns/hooks/use-ai-matching';

export function CreateCampaign() {
  const mutation = useAIMatching();
  const [formData, setFormData] = React.useState({
    description: '',
    budget: 0,
    location: '',
    niche: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: name === 'budget' ? Number(value) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await mutation.mutateAsync({
        businessDescription: formData.description,
        budget: formData.budget,
        location: formData.location,
        niche: formData.niche,
      });

      // The result contains matched publisher IDs
      console.log('Matched Publishers:', result.data.matched_publisher_ids);
      // TODO: Redirect to the booking page with these IDs, or auto-populate the selection
    } catch (error) {
      // Show toast error — replace with your toast implementation
      console.error('AI matching failed', error);
    }
  };

  return (
    <div>
      <h1>Create Campaign</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Business Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Budget</label>
          <input
            name="budget"
            type="number"
            value={formData.budget}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Location</label>
          <input name="location" value={formData.location} onChange={handleChange} required />
        </div>

        <div>
          <label>Niche</label>
          <input name="niche" value={formData.niche} onChange={handleChange} required />
        </div>

        <button type="submit" disabled={mutation.isLoading}>
          {mutation.isLoading ? 'Matching...' : 'Create & Match'}
        </button>
      </form>

      {mutation.isError && (
        <div role="alert">Something went wrong while matching: {String(mutation.error)}</div>
      )}

      {mutation.isSuccess && (
        <div>
          <h2>AI Suggestions</h2>
          <pre>{JSON.stringify(mutation.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
