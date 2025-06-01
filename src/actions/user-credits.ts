
'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import type { User } from '@clerk/nextjs/server';

const MAX_CREDITS_PER_MONTH = 10;

interface ImageGenerationCredits {
  count: number;
  resetMonthYear: string; // Format: "YYYY-MM"
}

const getCurrentMonthYear = (): string => {
  return new Date().toISOString().slice(0, 7); // Extracts "YYYY-MM"
};

/**
 * Retrieves the number of image generation credits for the current user.
 * If it's a new month or the user has no credit data, it resets credits to the max amount.
 * Updates Clerk user publicMetadata if a reset occurs.
 */
export async function getImageGenerationCredits(): Promise<number> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('User not authenticated.');
  }

  const client = await clerkClient()

  try {
    const user: User = await client.users.getUser(userId);
    const currentMonthYear = getCurrentMonthYear();
    const existingPublicMetadata = user.publicMetadata || {};
    let creditsData = existingPublicMetadata?.imageGenerationCredits as ImageGenerationCredits | undefined;

    if (!creditsData || creditsData.resetMonthYear !== currentMonthYear) {
      // Reset credits for the new month or if no data exists
      const newCreditsData: ImageGenerationCredits = {
        count: MAX_CREDITS_PER_MONTH,
        resetMonthYear: currentMonthYear,
      };
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...existingPublicMetadata,
          imageGenerationCredits: newCreditsData,
        },
      });
      return newCreditsData.count;
    }
    return creditsData.count;
  } catch (error) {
    console.error('Error getting image generation credits from Clerk:', error);
    // Re-throw a new error to ensure the client-side catch block handles it properly.
    throw new Error('Failed to retrieve image generation credits from server.');
  }
}

/**
 * Records that an image generation has occurred and decrements the user's credit count.
 * Handles monthly reset logic internally if needed before decrementing.
 * @returns The new credit count after decrementing.
 */
export async function recordImageGenerationAndUpdateCredits(): Promise<number> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('User not authenticated.');
  }

  const client = await clerkClient()

  try {
    const user: User = await client.users.getUser(userId);
    const currentMonthYear = getCurrentMonthYear();
    const existingPublicMetadata = user.publicMetadata || {};
    let creditsData = existingPublicMetadata?.imageGenerationCredits as ImageGenerationCredits | undefined;

    let currentCountBeforeDecrement: number;

    if (!creditsData || creditsData.resetMonthYear !== currentMonthYear) {
      // Credits should reset for the new month or if no data exists
      currentCountBeforeDecrement = MAX_CREDITS_PER_MONTH;
    } else {
      currentCountBeforeDecrement = creditsData.count;
    }

    if (currentCountBeforeDecrement <= 0) {
      // This should ideally be caught by the UI before calling this action
      // but as a safeguard:
      // Update metadata to ensure it reflects 0 for the current month if it was a reset scenario
       if (!creditsData || creditsData.resetMonthYear !== currentMonthYear) {
         await client.users.updateUserMetadata(userId, {
            publicMetadata: {
              ...existingPublicMetadata,
              imageGenerationCredits: { count: 0, resetMonthYear: currentMonthYear },
            },
          });
       }
      throw new Error('No image generation credits remaining for this month.');
    }

    const newCount = currentCountBeforeDecrement - 1;
    const newCreditsData: ImageGenerationCredits = {
      count: newCount,
      resetMonthYear: currentMonthYear,
    };

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...existingPublicMetadata,
        imageGenerationCredits: newCreditsData,
      },
    });

    return newCount;
  } catch (error) {
    console.error('Error recording image generation and updating credits:', error);
    // If an error occurs during decrement, it's safer to assume the credit was not used
    // Re-fetch to get the most accurate count or return a state indicating error.
    // For simplicity, we'll re-throw, and client can re-fetch or handle.
    if (error instanceof Error && error.message.includes('No image generation credits')) {
        throw error;
    }
    throw new Error('Failed to update image generation credits.');
  }
}

// Helper to ensure the types are correctly inferred by components using these actions
export type GetImageGenerationCreditsAction = typeof getImageGenerationCredits;
export type RecordImageGenerationAndUpdateCreditsAction = typeof recordImageGenerationAndUpdateCredits;
