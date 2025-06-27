
'use client';

import { CreateInitiativeForm, type CreateInitiativeFormValues } from '@/components/forms/create-initiative-form';
import { InitiativeType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { ModerateCampaignContentOutput } from '@/ai/flows/moderate-campaign-content';
import { createPetitionWithDb } from '@/actions/initiative-actions'; // Import new action
import type { IPetition } from '@/models/Petition'; // Import new type


export default function CreatePetitionPage() {
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (
    data: CreateInitiativeFormValues, 
    moderationResult: ModerateCampaignContentOutput | null,
    cloudinaryImage: { url: string | null; publicId: string | null },
    userId: string
  ) => {
    
    const petitionDataForDb = {
      title: data.title,
      description: data.description,
      category: data.category,
      goal: (data as Extract<CreateInitiativeFormValues, {goal: number}>).goal, // Type assertion
      imageUrl: cloudinaryImage.url || undefined,
      imagePublicId: cloudinaryImage.publicId || undefined,
      location: data.location,
      contentWarning: data.contentWarning,
    };

    try {
      const newPetition : IPetition = await createPetitionWithDb(petitionDataForDb as any, userId);
      toast({
        title: 'Petition Created!',
        description: `Your petition "${newPetition.title}" has been successfully created.`,
      });
      // Assuming newPetition has an _id or similar identifier from MongoDB
      // For now, redirecting to general petitions page
      router.push('/petitions'); 
    } catch (error) {
        console.error('Failed to create petition:', error);
        toast({
            variant: 'destructive',
            title: 'Creation Failed',
            description: error instanceof Error ? error.message : 'Could not create petition. Please try again.',
        });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto py-8"
    >
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-primary mb-3">Create a New Petition</h1>
        <p className="text-lg text-muted-foreground">
          Inspire action and make your voice heard. Fill out the details below to launch your petition.
        </p>
      </header>
      <CreateInitiativeForm type={InitiativeType.Petition} onSubmitWithCloudinary={handleSubmit} />
    </motion.div>
  );
}
