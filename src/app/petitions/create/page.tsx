'use client';

import { CreateInitiativeForm } from '@/components/forms/create-initiative-form';
import { InitiativeType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { ModerateCampaignContentOutput } from '@/ai/flows/moderate-campaign-content';

export default function CreatePetitionPage() {
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (data: any, moderationResult?: ModerateCampaignContentOutput) => {
    // TODO: Implement actual submission logic (e.g., API call)
    console.log('Submitting petition:', data);
    console.log('Moderation result:', moderationResult);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: 'Petition Created!',
      description: `Your petition "${data.title}" has been successfully created.`,
    });
    router.push('/petitions'); // Redirect to petitions page or the new petition's page
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto"
    >
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-primary mb-3">Create a New Petition</h1>
        <p className="text-lg text-muted-foreground">
          Inspire action and make your voice heard. Fill out the details below to launch your petition.
        </p>
      </header>
      <CreateInitiativeForm type={InitiativeType.Petition} onSubmit={handleSubmit} />
    </motion.div>
  );
}
