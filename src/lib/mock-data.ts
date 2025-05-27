import type { UserProfile, Petition, Campaign } from '@/types';

const mockUsers: UserProfile[] = [
  { id: 'user1', username: 'ActivistAnna', email: 'anna@example.com', createdAt: new Date(2023, 0, 15).toISOString(), avatarUrl: 'https://placehold.co/100x100' },
  { id: 'user2', username: 'EcoWarriorMax', email: 'max@example.com', createdAt: new Date(2023, 1, 20).toISOString(), avatarUrl: 'https://placehold.co/100x100' },
  { id: 'user3', username: 'CommunityChris', email: 'chris@example.com', createdAt: new Date(2023, 2, 10).toISOString(), avatarUrl: 'https://placehold.co/100x100' },
];

export const mockPetitions: Petition[] = [
  {
    id: 'pet1',
    title: 'Protect Our Local Forests',
    description: 'A petition to designate the Willow Creek Woods as a protected nature reserve to prevent deforestation and preserve local wildlife habitats.',
    imageUrl: 'https://placehold.co/600x400',
    category: 'Environment',
    author: mockUsers[0],
    supporters: 1250,
    goal: 2000,
    createdAt: new Date(2024, 4, 1).toISOString(),
    location: 'Willow Creek',
    status: 'active',
  },
  {
    id: 'pet2',
    title: 'Improve School Lunch Programs',
    description: 'We urge the local school district to provide healthier, more nutritious meal options for students across all public schools.',
    imageUrl: 'https://placehold.co/600x400',
    category: 'Education',
    author: mockUsers[1],
    supporters: 850,
    goal: 1000,
    createdAt: new Date(2024, 3, 15).toISOString(),
    location: 'Springfield',
    status: 'active',
  },
  {
    id: 'pet3',
    title: 'Fund Public Art Installations',
    description: 'Support local artists and beautify our city by allocating funds for public art projects in downtown areas.',
    category: 'Community Development',
    author: mockUsers[2],
    supporters: 300,
    goal: 500,
    createdAt: new Date(2024, 5, 10).toISOString(),
    status: 'active',
  },
];

export const mockCampaigns: Campaign[] = [
  {
    id: 'camp1',
    title: 'Clean Water for Rural Villages',
    description: 'Help us build wells and provide water purification systems for three remote villages currently lacking access to clean drinking water.',
    imageUrl: 'https://placehold.co/600x400',
    category: 'Community Projects',
    organizer: mockUsers[1],
    raisedAmount: 7500,
    goalAmount: 10000,
    donors: 150,
    createdAt: new Date(2024, 2, 20).toISOString(),
    location: 'Global',
    status: 'active',
    isVerified: true,
  },
  {
    id: 'camp2',
    title: 'Tech Kits for Underprivileged Students',
    description: 'Provide laptops and internet access to students from low-income families to bridge the digital divide in education.',
    imageUrl: 'https://placehold.co/600x400',
    category: 'Education',
    organizer: mockUsers[0],
    raisedAmount: 3200,
    goalAmount: 5000,
    donors: 80,
    createdAt: new Date(2024, 4, 5).toISOString(),
    location: 'Online',
    status: 'active',
    isVerified: true,
  },
  {
    id: 'camp3',
    title: 'Support Local Animal Shelter',
    description: 'Our local animal shelter is in urgent need of funds for medical supplies, food, and facility repairs. Help us care for homeless animals.',
    category: 'Non-Profit Support',
    organizer: mockUsers[2],
    raisedAmount: 1800,
    goalAmount: 3000,
    donors: 95,
    createdAt: new Date(2024, 5, 1).toISOString(),
    isVerified: false,
    status: 'active',
  },
];

export const mockSupporters = Array.from({ length: 20 }, (_, i) => ({
  id: `supporter${i + 1}`,
  name: `Supporter ${i + 1}`,
  avatarUrl: `https://placehold.co/50x50?text=S${i+1}`,
  contribution: Math.random() > 0.5 ? `Signed Petition` : `Donated $${Math.floor(Math.random() * 100) + 5}`
}));

export const getMockUserById = (id: string) => mockUsers.find(u => u.id === id);
export const getMockPetitionById = (id: string) => mockPetitions.find(p => p.id === id);
export const getMockCampaignById = (id: string) => mockCampaigns.find(c => c.id === c.id);
