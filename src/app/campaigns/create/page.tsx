'use client';

import { CreateInitiativeForm } from '@/components/forms/create-initiative-form';
import { InitiativeType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { ModerateCampaignContentOutput } from '@/ai/flows/moderate-campaign-content';

export default function CreateCampaignPage() {
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (data: any, moderationResult?: ModerateCampaignContentOutput) => {
    // TODO: Implement actual submission logic (e.g., API call)
    console.log('Submitting campaign:', data);
    console.log('Moderation result:', moderationResult);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: 'Campaign Created!',
      description: `Your campaign "${data.title}" has been successfully created.`,
    });
    router.push('/campaigns'); // Redirect to campaigns page or the new campaign's page
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto"
    >
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-primary mb-3">Start a New Fundraising Campaign</h1>
        <p className="text-lg text-muted-foreground">
          Rally support for a cause you believe in. Provide the details below to launch your fundraiser.
        </p>
      </header>
      <CreateInitiativeForm type={InitiativeType.Campaign} onSubmit={handleSubmit} />
    </motion.div>
  );
}
