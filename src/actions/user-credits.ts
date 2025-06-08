
'use server';

import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/mongodb';
import UserCredit, { type IUserCredit } from '@/models/UserCredit';

const MAX_FREE_CREDITS_PER_MONTH = 10;

export interface ImageGenerationCreditsMetadata {
  freeCredits: number;
  freeCreditsResetMonthYear: string; // Format: "YYYY-MM"
  purchasedCredits: number;
}

const getCurrentMonthYear = (): string => {
  return new Date().toISOString().slice(0, 7); // Extracts "YYYY-MM"
};

/**
 * Retrieves the total number of image generation credits (free + purchased) for the current user from MongoDB.
 * Handles monthly reset for free credits. Initializes credits if they don't exist.
 */
export async function getImageGenerationCredits(): Promise<number> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('User not authenticated to get credits.');
  }

  await dbConnect();
  const currentMonthYear = getCurrentMonthYear();

  try {
    let userCreditDoc = await UserCredit.findOne({ userId });

    if (!userCreditDoc) {
      // First time user for credits or new user
      userCreditDoc = new UserCredit({
        userId,
        freeCredits: MAX_FREE_CREDITS_PER_MONTH,
        freeCreditsResetMonthYear: currentMonthYear,
        purchasedCredits: 0,
      });
      await userCreditDoc.save();
    } else {
      // Check if free credits need reset
      if (userCreditDoc.freeCreditsResetMonthYear !== currentMonthYear) {
        userCreditDoc.freeCredits = MAX_FREE_CREDITS_PER_MONTH;
        userCreditDoc.freeCreditsResetMonthYear = currentMonthYear;
        await userCreditDoc.save();
      }
    }
    return (userCreditDoc.freeCredits || 0) + (userCreditDoc.purchasedCredits || 0);
  } catch (error) {
    console.error('Error getting image generation credits from MongoDB:', error);
    throw new Error('Failed to retrieve image generation credits from server.');
  }
}

/**
 * Records that an image generation has occurred and decrements the user's credit count in MongoDB.
 * Prioritizes using purchased credits first, then free credits.
 * Handles monthly reset logic for free credits internally if needed before decrementing.
 * @returns The new total credit count after decrementing.
 */
export async function recordImageGenerationAndUpdateCredits(): Promise<number> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('User not authenticated to update credits.');
  }

  await dbConnect();
  const currentMonthYear = getCurrentMonthYear();

  try {
    let userCreditDoc = await UserCredit.findOne({ userId });

    if (!userCreditDoc) {
      // Should ideally not happen if getImageGenerationCredits was called, but handle defensively
      userCreditDoc = new UserCredit({
        userId,
        freeCredits: MAX_FREE_CREDITS_PER_MONTH,
        freeCreditsResetMonthYear: currentMonthYear,
        purchasedCredits: 0,
      });
      // No save here, as we'll save after decrementing or throwing error
    } else if (userCreditDoc.freeCreditsResetMonthYear !== currentMonthYear) {
      // Reset free credits if it's a new month before attempting to decrement
      userCreditDoc.freeCredits = MAX_FREE_CREDITS_PER_MONTH;
      userCreditDoc.freeCreditsResetMonthYear = currentMonthYear;
    }
    
    let newFreeCredits = userCreditDoc.freeCredits;
    let newPurchasedCredits = userCreditDoc.purchasedCredits;

    if (newPurchasedCredits > 0) {
      newPurchasedCredits -= 1;
    } else if (newFreeCredits > 0) {
      newFreeCredits -= 1;
    } else {
      throw new Error('No image generation credits remaining.');
    }

    userCreditDoc.freeCredits = newFreeCredits;
    userCreditDoc.purchasedCredits = newPurchasedCredits;
    userCreditDoc.markModified('freeCredits');
    userCreditDoc.markModified('purchasedCredits');
    userCreditDoc.markModified('freeCreditsResetMonthYear'); // In case it was reset
    
    await userCreditDoc.save();

    return newFreeCredits + newPurchasedCredits;
  } catch (error) {
    console.error('Error recording image generation and updating credits in MongoDB:', error);
    if (error instanceof Error && error.message.includes('No image generation credits')) {
        throw error;
    }
    throw new Error('Failed to update image generation credits.');
  }
}

/**
 * Adds purchased credits to the user's account in MongoDB.
 * @param userId The ID of the user.
 * @param creditsToAdd The number of credits purchased.
 * @returns The updated ImageGenerationCreditsMetadata object.
 */
export async function addPurchasedCredits(userId: string, creditsToAdd: number): Promise<ImageGenerationCreditsMetadata> {
  if (!userId) {
    throw new Error('User ID is required to add purchased credits.');
  }
  if (creditsToAdd <= 0) {
    throw new Error('Number of credits to add must be positive.');
  }

  await dbConnect();
  const currentMonthYear = getCurrentMonthYear();

  try {
    let userCreditDoc = await UserCredit.findOne({ userId });

    if (!userCreditDoc) {
      userCreditDoc = new UserCredit({
        userId,
        freeCredits: MAX_FREE_CREDITS_PER_MONTH, // Initialize free credits if first time
        freeCreditsResetMonthYear: currentMonthYear,
        purchasedCredits: creditsToAdd,
      });
    } else {
      userCreditDoc.purchasedCredits = (userCreditDoc.purchasedCredits || 0) + creditsToAdd;
      // Ensure free credits are initialized/reset if needed
      if (userCreditDoc.freeCreditsResetMonthYear !== currentMonthYear) {
        userCreditDoc.freeCredits = MAX_FREE_CREDITS_PER_MONTH;
        userCreditDoc.freeCreditsResetMonthYear = currentMonthYear;
      }
    }
    
    await userCreditDoc.save();

    return {
        freeCredits: userCreditDoc.freeCredits,
        freeCreditsResetMonthYear: userCreditDoc.freeCreditsResetMonthYear,
        purchasedCredits: userCreditDoc.purchasedCredits
    };

  } catch (error) {
    console.error(`Error adding purchased credits for user ${userId} in MongoDB:`, error);
    throw new Error('Failed to add purchased credits.');
  }
}

// Helper types for actions (can be used if components import these specific types)
export type GetImageGenerationCreditsAction = typeof getImageGenerationCredits;
export type RecordImageGenerationAndUpdateCreditsAction = typeof recordImageGenerationAndUpdateCredits;
export type AddPurchasedCreditsAction = typeof addPurchasedCredits;
