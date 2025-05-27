'use client';

import { useUser, UserProfile as ClerkUserProfile } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockPetitions, mockCampaigns } from '@/lib/mock-data'; // Assuming user specific data would be fetched
import { InitiativeCard } from '@/components/shared/initiative-card';
import { InitiativeType } from '@/types';
import { ListChecks, HandHeart, DollarSign, Settings, Edit, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();

  // Mock data - in a real app, this would be fetched based on the logged-in user
  const userPetitions = mockPetitions.filter(p => p.author.id === 'user1').slice(0,2); // Example
  const supportedCampaigns = mockCampaigns.filter(c => c.id === 'camp1' || c.id === 'camp2').slice(0,2); // Example
  const donationHistory = [
    { id: 'don1', campaignTitle: 'Clean Water for Rural Villages', amount: 50, date: new Date(2024, 3, 10).toISOString() },
    { id: 'don2', campaignTitle: 'Tech Kits for Underprivileged Students', amount: 25, date: new Date(2024, 4, 22).toISOString() },
  ];

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by middleware, but as a fallback:
    return <div className="text-center py-20">Please log in to view your profile.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row items-center gap-6 p-6 bg-card rounded-lg shadow-lg">
        <Image 
            src={user.imageUrl || 'https://placehold.co/128x128'} 
            alt={user.fullName || 'User Avatar'} 
            width={128} height={128} 
            className="rounded-full border-4 border-primary shadow-md"
            data-ai-hint="person portrait" 
        />
        <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">{user.fullName || user.username}</h1>
            <p className="text-muted-foreground mt-1">{user.primaryEmailAddress?.emailAddress}</p>
            <p className="text-sm text-muted-foreground">Joined: {user.createdAt?.toLocaleDateString()}</p>
        </div>
        <Button variant="outline" className="ml-auto btn-glow-accent hover:border-accent">
            <Edit className="mr-2 h-4 w-4" /> Edit Profile
        </Button>
      </header>

      <Tabs defaultValue="petitions" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="petitions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <ListChecks className="mr-2 h-4 w-4" /> My Petitions
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <HandHeart className="mr-2 h-4 w-4" /> Supported Initiatives
          </TabsTrigger>
          <TabsTrigger value="donations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <DollarSign className="mr-2 h-4 w-4" /> Donation History
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Settings className="mr-2 h-4 w-4" /> Account Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="petitions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Created Petitions</CardTitle>
              <CardDescription>Petitions you have started.</CardDescription>
            </CardHeader>
            <CardContent>
              {userPetitions.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {userPetitions.map(p => <InitiativeCard key={p.id} item={p} type={InitiativeType.Petition} />)}
                </div>
              ) : <p className="text-muted-foreground">You haven't created any petitions yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Supported Initiatives</CardTitle>
              <CardDescription>Campaigns and petitions you have supported or donated to.</CardDescription>
            </CardHeader>
            <CardContent>
              {supportedCampaigns.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {supportedCampaigns.map(c => <InitiativeCard key={c.id} item={c} type={InitiativeType.Campaign} />)}
                </div>
              ) : <p className="text-muted-foreground">You haven't supported any initiatives yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Donation History</CardTitle>
              <CardDescription>A record of your contributions.</CardDescription>
            </CardHeader>
            <CardContent>
              {donationHistory.length > 0 ? (
                <ul className="space-y-4">
                  {donationHistory.map(d => (
                    <li key={d.id} className="flex justify-between items-center p-4 bg-secondary rounded-md shadow-sm">
                      <div>
                        <p className="font-semibold">{d.campaignTitle}</p>
                        <p className="text-sm text-muted-foreground">{new Date(d.date).toLocaleDateString()}</p>
                      </div>
                      <p className="text-lg font-bold text-accent">${d.amount.toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground">You haven't made any donations yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account details and preferences.</CardDescription>
                </CardHeader>
                <CardContent className="max-w-xl">
                    <ClerkUserProfile routing="path" path="/profile">
                        <ClerkUserProfile.Page label="Account" url="account" labelIcon={<Settings className="h-4 w-4" />} />
                        <ClerkUserProfile.Page label="Security" url="security" labelIcon={<Settings className="h-4 w-4" />} />
                    </ClerkUserProfile>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
