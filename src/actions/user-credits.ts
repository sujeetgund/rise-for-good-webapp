
'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import type { User } from '@clerk/nextjs/server';

const MAX_FREE_CREDITS_PER_MONTH = 10;

interface ImageGenerationCreditsMetadata {
  freeCredits: number;
  freeCreditsResetMonthYear: string; // Format: "YYYY-MM"
  purchasedCredits: number;
}

const getCurrentMonthYear = (): string => {
  return new Date().toISOString().slice(0, 7); // Extracts "YYYY-MM"
};

/**
 * Retrieves the total number of image generation credits (free + purchased) for the current user.
 * Handles monthly reset for free credits. Initializes credits if they don't exist.
 */
export async function getImageGenerationCredits(): Promise<number> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('User not authenticated to get credits.');
  }

  const client = await clerkClient();

  try {
    const user: User = await client.users.getUser(userId);
    const currentMonthYear = getCurrentMonthYear();
    const existingPublicMetadata = user.publicMetadata || {};
    let creditsData = existingPublicMetadata?.imageGenerationCredits as ImageGenerationCreditsMetadata | undefined;

    let needsUpdate = false;

    if (!creditsData) {
      creditsData = {
        freeCredits: MAX_FREE_CREDITS_PER_MONTH,
        freeCreditsResetMonthYear: currentMonthYear,
        purchasedCredits: 0,
      };
      needsUpdate = true;
    } else {
      if (creditsData.freeCreditsResetMonthYear !== currentMonthYear) {
        creditsData.freeCredits = MAX_FREE_CREDITS_PER_MONTH;
        creditsData.freeCreditsResetMonthYear = currentMonthYear;
        needsUpdate = true;
      }
      // Ensure purchasedCredits exists
      if (typeof creditsData.purchasedCredits !== 'number') {
        creditsData.purchasedCredits = 0;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...existingPublicMetadata,
          imageGenerationCredits: creditsData,
        },
      });
    }
    return (creditsData.freeCredits || 0) + (creditsData.purchasedCredits || 0);
  } catch (error) {
    console.error('Error getting image generation credits from Clerk:', error);
    throw new Error('Failed to retrieve image generation credits from server.');
  }
}

/**
 * Records that an image generation has occurred and decrements the user's credit count.
 * Prioritizes using purchased credits first, then free credits.
 * Handles monthly reset logic for free credits internally if needed before decrementing.
 * @returns The new total credit count after decrementing.
 */
export async function recordImageGenerationAndUpdateCredits(): Promise<number> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('User not authenticated to update credits.');
  }

  const client = await clerkClient();

  try {
    const user: User = await client.users.getUser(userId);
    const currentMonthYear = getCurrentMonthYear();
    const existingPublicMetadata = user.publicMetadata || {};
    let creditsData = existingPublicMetadata?.imageGenerationCredits as ImageGenerationCreditsMetadata | undefined;

    // Ensure credits data exists and free credits are reset if it's a new month
    if (!creditsData || creditsData.freeCreditsResetMonthYear !== currentMonthYear) {
      const currentPurchased = creditsData?.purchasedCredits || 0;
      creditsData = {
        freeCredits: MAX_FREE_CREDITS_PER_MONTH,
        freeCreditsResetMonthYear: currentMonthYear,
        purchasedCredits: currentPurchased, // Preserve purchased credits
      };
      // Update metadata immediately if reset happened
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { ...existingPublicMetadata, imageGenerationCredits: creditsData },
      });
    } else {
       // Ensure purchasedCredits is a number
      if (typeof creditsData.purchasedCredits !== 'number') {
        creditsData.purchasedCredits = 0;
      }
      if (typeof creditsData.freeCredits !== 'number') {
        creditsData.freeCredits = 0; // Should be MAX_FREE_CREDITS_PER_MONTH if reset, but as a fallback
      }
    }


    let newFreeCredits = creditsData.freeCredits;
    let newPurchasedCredits = creditsData.purchasedCredits;

    if (newPurchasedCredits > 0) {
      newPurchasedCredits -= 1;
    } else if (newFreeCredits > 0) {
      newFreeCredits -= 1;
    } else {
      throw new Error('No image generation credits remaining.');
    }

    const newCreditsData: ImageGenerationCreditsMetadata = {
      freeCredits: newFreeCredits,
      freeCreditsResetMonthYear: currentMonthYear, // Ensure this is current
      purchasedCredits: newPurchasedCredits,
    };

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...existingPublicMetadata,
        imageGenerationCredits: newCreditsData,
      },
    });

    return newFreeCredits + newPurchasedCredits;
  } catch (error) {
    console.error('Error recording image generation and updating credits:', error);
    if (error instanceof Error && error.message.includes('No image generation credits')) {
        throw error;
    }
    throw new Error('Failed to update image generation credits.');
  }
}

/**
 * Adds purchased credits to the user's account.
 * @param userId The ID of the user.
 * @param creditsToAdd The number of credits purchased.
 */
export async function addPurchasedCredits(userId: string, creditsToAdd: number): Promise<ImageGenerationCreditsMetadata> {
  if (!userId) {
    throw new Error('User ID is required to add purchased credits.');
  }
  if (creditsToAdd <= 0) {
    throw new Error('Number of credits to add must be positive.');
  }

  const client = await clerkClient();
  try {
    const user: User = await client.users.getUser(userId);
    const currentMonthYear = getCurrentMonthYear();
    const existingPublicMetadata = user.publicMetadata || {};
    let creditsData = existingPublicMetadata?.imageGenerationCredits as ImageGenerationCreditsMetadata | undefined;

    if (!creditsData) {
      creditsData = {
        freeCredits: MAX_FREE_CREDITS_PER_MONTH, // Initialize free credits if first time
        freeCreditsResetMonthYear: currentMonthYear,
        purchasedCredits: 0,
      };
    }

    // Ensure purchasedCredits is a number, default to 0 if not
    const currentPurchased = typeof creditsData.purchasedCredits === 'number' ? creditsData.purchasedCredits : 0;

    const newCreditsData: ImageGenerationCreditsMetadata = {
      freeCredits: creditsData.freeCredits || MAX_FREE_CREDITS_PER_MONTH,
      freeCreditsResetMonthYear: creditsData.freeCreditsResetMonthYear || currentMonthYear,
      purchasedCredits: currentPurchased + creditsToAdd,
    };

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...existingPublicMetadata,
        imageGenerationCredits: newCreditsData,
      },
    });
    return newCreditsData;
  } catch (error) {
    console.error(`Error adding purchased credits for user ${userId}:`, error);
    throw new Error('Failed to add purchased credits.');
  }
}

// Helper types for actions
export type GetImageGenerationCreditsAction = typeof getImageGenerationCredits;
export type RecordImageGenerationAndUpdateCreditsAction = typeof recordImageGenerationAndUpdateCredits;
export type AddPurchasedCreditsAction = typeof addPurchasedCredits;
