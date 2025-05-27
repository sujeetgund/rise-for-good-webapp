export interface UserProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  email: string;
  createdAt: string;
}

export interface Petition {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  category: string;
  author: UserProfile;
  supporters: number;
  goal: number;
  createdAt: string;
  location?: string;
  status: 'active' | 'completed' | 'draft';
  contentWarning?: string;
}

export interface Campaign {
  id:string;
  title: string;
  description: string;
  imageUrl?: string;
  category: string;
  organizer: UserProfile;
  raisedAmount: number;
  goalAmount: number;
  donors: number;
  createdAt: string;
  location?: string;
  status: 'active' | 'completed' | 'draft';
  isVerified: boolean;
  contentWarning?: string;
}

export type Initiative = Petition | Campaign;

export enum InitiativeType {
  Petition = 'petition',
  Campaign = 'campaign',
}
