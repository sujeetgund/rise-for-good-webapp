
'use client';

import { CreateInitiativeForm, type CreateInitiativeFormValues } from '@/components/forms/create-initiative-form';
import { InitiativeType } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import type { ModerateCampaignContentOutput } from '@/ai/flows/moderate-campaign-content';
import { createCampaignWithDb } from '@/actions/initiative-actions'; // Import new action
import type { ICampaign } from '@/models/Campaign'; // Import new type

export default function CreateCampaignPage() {
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (
    data: CreateInitiativeFormValues,
    moderationResult: ModerateCampaignContentOutput | null,
    cloudinaryImageUrl: string | null, // URL from Cloudinary
    userId: string
  ) => {

    const campaignDataForDb = {
      title: data.title,
      description: data.description,
      category: data.category,
      goalAmount: (data as Extract<CreateInitiativeFormValues, {goalAmount: number}>).goalAmount, // Type assertion
      imageUrl: cloudinaryImageUrl || undefined, // Use Cloudinary URL, or undefined if null
      location: data.location,
      contentWarning: data.contentWarning,
    };
    
    try {
      const newCampaign : ICampaign = await createCampaignWithDb(campaignDataForDb, userId);
      toast({
        title: 'Campaign Created!',
        description: `Your campaign "${newCampaign.title}" has been successfully created.`,
      });
      // Assuming newCampaign has an _id or similar identifier from MongoDB
      // For now, redirecting to general campaigns page
      router.push('/campaigns'); 
    } catch (error) {
      console.error('Failed to create campaign:', error);
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'Could not create campaign. Please try again.',
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
        <h1 className="text-4xl font-bold text-primary mb-3">Start a New Fundraising Campaign</h1>
        <p className="text-lg text-muted-foreground">
          Rally support for a cause you believe in. Provide the details below to launch your fundraiser.
        </p>
      </header>
      <CreateInitiativeForm type={InitiativeType.Campaign} onSubmitWithCloudinary={handleSubmit} />
    </motion.div>
  );
}
