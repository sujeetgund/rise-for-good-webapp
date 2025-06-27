
'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import cloudinary from '@/lib/cloudinary';
import dbConnect from '@/lib/mongodb';
import PetitionModel, { type IPetition, type IPetitionDocument } from '@/models/Petition';
import CampaignModel, { type ICampaign, type ICampaignDocument } from '@/models/Campaign';
import { InitiativeType } from '@/types'; // Assuming InitiativeType is still relevant
import type * as types from '@/types'; // Import all types for mapping

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

export async function uploadImageToCloudinary(
  imageFile: string, // base64 data URI or public URL
  initiativeType: InitiativeType,
  initiativeTitle: string
): Promise<CloudinaryUploadResult | null> {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    console.error('Cloudinary cloud name not configured. Skipping upload.');
    return null;
  }

  // Create a more descriptive public_id
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeTitle = initiativeTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const publicId = `riseforgood/${initiativeType}s/${safeTitle}-${timestamp}`;

  try {
    const result = await cloudinary.uploader.upload(imageFile, {
      folder: `riseforgood/${initiativeType}s`,
      public_id: publicId.substring(0,100), // public_id has length limits
      overwrite: true,
      resource_type: 'image',
    });
    return { secure_url: result.secure_url, public_id: result.public_id };
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    // Consider more specific error handling or re-throwing if needed
    if (error instanceof Error) {
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
    throw new Error('Cloudinary upload failed due to an unknown error.');
  }
}

// --- Petition Actions ---
export type CreatePetitionData = Omit<IPetition, '_id' | 'authorId' | 'supportersCount' | 'status' | 'createdAt' | 'updatedAt'>;


export async function createPetitionWithDb(
  data: CreatePetitionData,
  authorId: string
): Promise<IPetition> {
  await dbConnect();

  const newPetition = new PetitionModel({
    ...data,
    authorId,
    supportersCount: 0, // Mongoose model uses supportersCount
    status: 'active', // Default status
  });

  try {
    const savedPetition: IPetitionDocument = await newPetition.save();
    // Convert Mongoose document to plain object if needed, or ensure it's serializable
    return JSON.parse(JSON.stringify(savedPetition.toObject()));
  } catch (error) {
    console.error('Error saving petition to MongoDB:', error);
    if (error instanceof Error) {
        throw new Error(`MongoDB save failed: ${error.message}`);
    }
    throw new Error('MongoDB save failed due to an unknown error.');
  }
}

export async function getUserPetitionsByAuthorId(authorId: string): Promise<IPetition[]> {
  if (!authorId) {
    throw new Error('Author ID is required to fetch petitions.');
  }
  await dbConnect();
  try {
    const petitions: IPetitionDocument[] = await PetitionModel.find({ authorId }).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(petitions)) as IPetition[];
  } catch (error) {
    console.error(`Error fetching petitions for author ${authorId} from MongoDB:`, error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch user petitions: ${error.message}`);
    }
    throw new Error('Failed to fetch user petitions due to an unknown error.');
  }
}

const client = await clerkClient()
export async function getPetitionByIdFromDb(id: string): Promise<types.Petition | null> {
  if (!id) {
    console.error('Petition ID is required.');
    return null;
  }
  await dbConnect();
  try {
    const dbPetition: IPetitionDocument | null = await PetitionModel.findById(id).lean();
    if (!dbPetition) {
      return null;
    }

    // Fetch author details from Clerk
    let authorProfile: types.UserProfile;
    try {
      const authorClerk = await client.users.getUser(dbPetition.authorId);
      authorProfile = {
        id: authorClerk.id,
        username: authorClerk.username || authorClerk.firstName || authorClerk.emailAddresses[0]?.emailAddress || 'Unknown User',
        avatarUrl: authorClerk.imageUrl,
        email: authorClerk.primaryEmailAddress?.emailAddress || '',
        createdAt: authorClerk.createdAt ? new Date(authorClerk.createdAt).toISOString() : new Date().toISOString(),
      };
    } catch (clerkError) {
      console.error(`Failed to fetch author ${dbPetition.authorId} from Clerk:`, clerkError);
      // Fallback author profile
      authorProfile = {
        id: dbPetition.authorId,
        username: 'Unknown User',
        email: '',
        createdAt: new Date().toISOString(),
      };
    }
    
    const petitionId = (dbPetition._id as any)?.toString();

    // Map IPetitionDocument to types.Petition
    const frontendPetition: types.Petition = {
      id: petitionId,
      title: dbPetition.title,
      description: dbPetition.description,
      imageUrl: dbPetition.imageUrl,
      category: dbPetition.category,
      author: authorProfile,
      supporters: dbPetition.supportersCount, // Map supportersCount to supporters
      goal: dbPetition.goal,
      createdAt: dbPetition.createdAt ? new Date(dbPetition.createdAt).toISOString() : new Date().toISOString(),
      location: dbPetition.location,
      status: dbPetition.status,
      contentWarning: dbPetition.contentWarning,
    };
    return frontendPetition;
  } catch (error) {
    console.error(`Error fetching petition with ID ${id} from MongoDB:`, error);
    if (error instanceof Error && error.name === 'CastError') { // Handle invalid ID format
      return null;
    }
    // Consider re-throwing or returning a more specific error object if needed
    throw new Error(`Failed to fetch petition: ${error instanceof Error ? error.message : 'Unknown database error'}`);
  }
}


// --- Campaign Actions ---
export type CreateCampaignData = Omit<ICampaign, '_id' | 'organizerId' | 'raisedAmount' | 'donorsCount' | 'status' | 'isVerified' | 'createdAt' | 'updatedAt'>;


export async function createCampaignWithDb(
  data: CreateCampaignData,
  organizerId: string
): Promise<ICampaign> {
  await dbConnect();

  const newCampaign = new CampaignModel({
    ...data,
    organizerId,
    raisedAmount: 0,
    donorsCount: 0,
    status: 'active', // Default status
    isVerified: false, // Default verification status
  });

  try {
    const savedCampaign: ICampaignDocument = await newCampaign.save();
    return JSON.parse(JSON.stringify(savedCampaign.toObject()));
  } catch (error) {
    console.error('Error saving campaign to MongoDB:', error);
     if (error instanceof Error) {
        throw new Error(`MongoDB save failed: ${error.message}`);
    }
    throw new Error('MongoDB save failed due to an unknown error.');
  }
}

export async function getUserCampaignsByOrganizerId(organizerId: string): Promise<ICampaign[]> {
  if (!organizerId) {
    throw new Error('Organizer ID is required to fetch campaigns.');
  }
  await dbConnect();
  try {
    const campaigns: ICampaignDocument[] = await CampaignModel.find({ organizerId }).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(campaigns)) as ICampaign[];
  } catch (error) {
    console.error(`Error fetching campaigns for organizer ${organizerId} from MongoDB:`, error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch user campaigns: ${error.message}`);
    }
    throw new Error('Failed to fetch user campaigns due to an unknown error.');
  }
}

export async function getCampaignByIdFromDb(id: string): Promise<types.Campaign | null> {
  if (!id) {
    console.error('Campaign ID is required.');
    return null;
  }
  await dbConnect();
  try {
    const dbCampaign: ICampaignDocument | null = await CampaignModel.findById(id).lean();
    if (!dbCampaign) {
      return null;
    }

    // Fetch organizer details from Clerk
    let organizerProfile: types.UserProfile;
    try {
      const organizerClerk = await client.users.getUser(dbCampaign.organizerId);
      organizerProfile = {
        id: organizerClerk.id,
        username: organizerClerk.username || organizerClerk.firstName || organizerClerk.emailAddresses[0]?.emailAddress || 'Unknown User',
        avatarUrl: organizerClerk.imageUrl,
        email: organizerClerk.primaryEmailAddress?.emailAddress || '',
        createdAt: organizerClerk.createdAt ? new Date(organizerClerk.createdAt).toISOString() : new Date().toISOString(),
      };
    } catch (clerkError) {
      console.error(`Failed to fetch organizer ${dbCampaign.organizerId} from Clerk:`, clerkError);
      // Fallback organizer profile
      organizerProfile = {
        id: dbCampaign.organizerId,
        username: 'Unknown User',
        email: '',
        createdAt: new Date().toISOString(),
      };
    }
    
    const campaignId = (dbCampaign._id as any)?.toString();

    // Map ICampaignDocument to types.Campaign
    const frontendCampaign: types.Campaign = {
      id: campaignId,
      title: dbCampaign.title,
      description: dbCampaign.description,
      imageUrl: dbCampaign.imageUrl,
      category: dbCampaign.category,
      organizer: organizerProfile,
      raisedAmount: dbCampaign.raisedAmount,
      goalAmount: dbCampaign.goalAmount,
      donors: dbCampaign.donorsCount, // Map donorsCount to donors
      createdAt: dbCampaign.createdAt ? new Date(dbCampaign.createdAt).toISOString() : new Date().toISOString(),
      location: dbCampaign.location,
      status: dbCampaign.status,
      isVerified: dbCampaign.isVerified,
      contentWarning: dbCampaign.contentWarning,
    };
    return frontendCampaign;
  } catch (error) {
    console.error(`Error fetching campaign with ID ${id} from MongoDB:`, error);
    if (error instanceof Error && error.name === 'CastError') { // Handle invalid ID format
      return null;
    }
    throw new Error(`Failed to fetch campaign: ${error instanceof Error ? error.message : 'Unknown database error'}`);
  }
}

export async function deleteInitiative({
  initiativeId,
  initiativeType,
}: {
  initiativeId: string;
  initiativeType: InitiativeType;
}): Promise<{ success: boolean; message: string }> {
  const { userId } = auth();
  if (!userId) {
    throw new Error('You must be logged in to delete an initiative.');
  }

  await dbConnect();

  try {
    if (initiativeType === InitiativeType.Petition) {
      const petition = await PetitionModel.findById(initiativeId);
      if (!petition) {
        throw new Error('Petition not found.');
      }
      if (petition.authorId !== userId) {
        throw new Error('You are not authorized to delete this petition.');
      }

      // Delete image from Cloudinary if it exists
      if (petition.imagePublicId) {
        await cloudinary.uploader.destroy(petition.imagePublicId);
      }
      await PetitionModel.findByIdAndDelete(initiativeId);

    } else { // Campaign
      const campaign = await CampaignModel.findById(initiativeId);
      if (!campaign) {
        throw new Error('Campaign not found.');
      }
      if (campaign.organizerId !== userId) {
        throw new Error('You are not authorized to delete this campaign.');
      }
      
      // Delete image from Cloudinary if it exists
      if (campaign.imagePublicId) {
        await cloudinary.uploader.destroy(campaign.imagePublicId);
      }
      await CampaignModel.findByIdAndDelete(initiativeId);
    }
    
    return { success: true, message: `${initiativeType} deleted successfully.` };

  } catch (error) {
    console.error(`Error deleting ${initiativeType}:`, error);
    const message = error instanceof Error ? error.message : `Failed to delete ${initiativeType}.`;
    // We throw here so react-query can catch it
    throw new Error(message);
  }
}
