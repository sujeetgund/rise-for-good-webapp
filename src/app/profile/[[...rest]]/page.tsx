
'use client';

import { useEffect, useState } from 'react';
import { useUser, UserProfile as ClerkUserProfile, SignOutButton } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockCampaigns as mockSupportedCampaigns } from '@/lib/mock-data'; // Renamed for clarity
import { InitiativeCard } from '@/components/shared/initiative-card';
import { InitiativeType } from '@/types';
import type * as types from '@/types'; // Import all types for mapping
import { ListChecks, HandHeart, DollarSign, Settings, Loader2, LogOut, CreditCard, AlertCircle, ShoppingBag, Megaphone } from 'lucide-react';
import Image from 'next/image';
import { useIsMobile } from '@/hooks/use-mobile';
import { getImageGenerationCredits } from '@/actions/user-credits';
import { getUserPetitionsByAuthorId, getUserCampaignsByOrganizerId, deleteInitiative } from '@/actions/initiative-actions'; 
import type { IPetition } from '@/models/Petition';
import type { ICampaign } from '@/models/Campaign';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [totalImageCredits, setTotalImageCredits] = useState<number | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [creditError, setCreditError] = useState<string | null>(null);

  const [userCreatedPetitions, setUserCreatedPetitions] = useState<IPetition[] | null>(null);
  const [isLoadingUserPetitions, setIsLoadingUserPetitions] = useState(false);
  const [userPetitionsError, setUserPetitionsError] = useState<string | null>(null);

  const [userCreatedCampaigns, setUserCreatedCampaigns] = useState<ICampaign[] | null>(null);
  const [isLoadingUserCampaigns, setIsLoadingUserCampaigns] = useState(false);
  const [userCampaignsError, setUserCampaignsError] = useState<string | null>(null);


  // Mock data - in a real app, this would be fetched based on the logged-in user
  const supportedCampaigns = mockSupportedCampaigns.filter(c => c.id === 'camp1' || c.id === 'camp2').slice(0,2); // Example
  const donationHistory = [
    { id: 'don1', campaignTitle: 'Clean Water for Rural Villages', amount: 50, date: new Date(2024, 3, 10).toISOString() },
    { id: 'don2', campaignTitle: 'Tech Kits for Underprivileged Students', amount: 25, date: new Date(2024, 4, 22).toISOString() },
  ];

  useEffect(() => {
    if (user && isLoaded) {
      const fetchCredits = async () => {
        setIsLoadingCredits(true);
        setCreditError(null);
        try {
          const credits = await getImageGenerationCredits();
          setTotalImageCredits(credits);
        } catch (error) {
          console.error("Failed to fetch image credits on profile:", error);
          setCreditError("Could not load credits.");
        } finally {
          setIsLoadingCredits(false);
        }
      };
      fetchCredits();

      const fetchUserPetitions = async () => {
        setIsLoadingUserPetitions(true);
        setUserPetitionsError(null);
        try {
          const petitions = await getUserPetitionsByAuthorId(user.id);
          setUserCreatedPetitions(petitions);
        } catch (error) {
          console.error("Failed to fetch user petitions:", error);
          setUserPetitionsError(error instanceof Error ? error.message : "Could not load your petitions.");
        } finally {
          setIsLoadingUserPetitions(false);
        }
      };
      fetchUserPetitions();

      const fetchUserCampaigns = async () => {
        setIsLoadingUserCampaigns(true);
        setUserCampaignsError(null);
        try {
          const campaigns = await getUserCampaignsByOrganizerId(user.id);
          setUserCreatedCampaigns(campaigns);
        } catch (error) {
          console.error("Failed to fetch user campaigns:", error);
          setUserCampaignsError(error instanceof Error ? error.message : "Could not load your campaigns.");
        } finally {
          setIsLoadingUserCampaigns(false);
        }
      };
      fetchUserCampaigns();
    }
  }, [user, isLoaded]);

  const handleDeleteInitiative = async (id: string, type: InitiativeType) => {
    try {
      const result = await deleteInitiative({ initiativeId: id, initiativeType: type });
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        });
        if (type === InitiativeType.Petition) {
          setUserCreatedPetitions(prev => prev?.filter(p => p._id.toString() !== id) ?? null);
        } else {
          setUserCreatedCampaigns(prev => prev?.filter(c => c._id.toString() !== id) ?? null);
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    }
  };

  if (!isLoaded || (user && (isLoadingCredits || isLoadingUserPetitions || isLoadingUserCampaigns)) ) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-20">Please log in to view your profile.</div>;
  }

  const mapDbPetitionToCardPetition = (dbPetition: IPetition): types.Petition => {
    const id = typeof dbPetition._id === 'string' ? dbPetition._id : (dbPetition._id as any)?.toString();
    const createdAt = dbPetition.createdAt instanceof Date ? dbPetition.createdAt.toISOString() : (typeof dbPetition.createdAt === 'string' ? dbPetition.createdAt : new Date().toISOString());

    return {
      id: id,
      title: dbPetition.title,
      description: dbPetition.description,
      imageUrl: dbPetition.imageUrl,
      category: dbPetition.category,
      author: {
        id: user.id,
        username: user.username || user.fullName || 'User',
        avatarUrl: user.imageUrl,
        email: user.primaryEmailAddress?.emailAddress || '',
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      },
      supporters: dbPetition.supportersCount,
      goal: dbPetition.goal,
      createdAt: createdAt,
      location: dbPetition.location,
      status: dbPetition.status,
      contentWarning: dbPetition.contentWarning,
    };
  };

  const mapDbCampaignToCardCampaign = (dbCampaign: ICampaign): types.Campaign => {
    const id = typeof dbCampaign._id === 'string' ? dbCampaign._id : (dbCampaign._id as any)?.toString();
    const createdAt = dbCampaign.createdAt instanceof Date ? dbCampaign.createdAt.toISOString() : (typeof dbCampaign.createdAt === 'string' ? dbCampaign.createdAt : new Date().toISOString());

    return {
      id: id,
      title: dbCampaign.title,
      description: dbCampaign.description,
      imageUrl: dbCampaign.imageUrl,
      category: dbCampaign.category,
      organizer: {
        id: user.id,
        username: user.username || user.fullName || 'User',
        avatarUrl: user.imageUrl,
        email: user.primaryEmailAddress?.emailAddress || '',
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      },
      raisedAmount: dbCampaign.raisedAmount,
      goalAmount: dbCampaign.goalAmount,
      donors: dbCampaign.donorsCount,
      createdAt: createdAt,
      location: dbCampaign.location,
      status: dbCampaign.status,
      isVerified: dbCampaign.isVerified,
      contentWarning: dbCampaign.contentWarning,
    };
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 py-8"
    >
      <header className="flex flex-col md:flex-row items-center gap-6 p-6 bg-card rounded-lg shadow-lg">
        <Image 
            src={user.imageUrl || 'https://placehold.co/128x128.png'} 
            alt={user.fullName || 'User Avatar'} 
            width={128} height={128} 
            className="rounded-full border-4 border-primary shadow-md"
            data-ai-hint="person portrait"
        />
        <div className="flex-grow text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">{user.fullName || user.username}</h1>
            <p className="text-muted-foreground mt-1">{user.primaryEmailAddress?.emailAddress}</p>
            <p className="text-sm text-muted-foreground">Joined: {user.createdAt?.toLocaleDateString()}</p>
            <div className="mt-3 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 text-sm">
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2 text-accent" />
                {isLoadingCredits && totalImageCredits === null && <span className="text-muted-foreground">Loading credits...</span>}
                {creditError && <span className="text-destructive flex items-center"><AlertCircle className="h-4 w-4 mr-1"/>{creditError}</span>}
                {totalImageCredits !== null && <span className="text-foreground">Image Credits: {totalImageCredits}</span>}
              </div>
              <Button asChild size="sm" variant="outline" className="btn-glow-accent hover:border-accent text-xs px-2 py-1 h-auto">
                <Link href="/buy-credits">
                    <ShoppingBag className="mr-1.5 h-3 w-3" /> Buy More Credits
                </Link>
              </Button>
            </div>
        </div>
        <div className="mt-4 md:mt-0 md:ml-auto flex flex-col items-center md:items-end gap-2">
            <SignOutButton redirectUrl="/">
                <Button variant="outline" className="w-full md:w-auto btn-glow-accent hover:border-accent">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
            </SignOutButton>
            {isMobile && (
                 <ClerkUserProfile>
                    <ClerkUserProfile.Link path="account">
                        <Button variant="outline" className="w-full md:w-auto">
                            <Settings className="mr-2 h-4 w-4" /> Account Settings
                        </Button>
                    </ClerkUserProfile.Link>
                 </ClerkUserProfile>
            )}
        </div>
      </header>

      <Tabs defaultValue="petitions" className="w-full">
        <TabsList 
          className={cn(
            "bg-muted p-1 rounded-lg", 
            isMobile 
            ? "flex w-full overflow-x-auto no-scrollbar flex-nowrap gap-1 items-center h-12" 
            : "grid w-full grid-cols-5 gap-1 items-center h-12" 
          )}
        >
          <TabsTrigger 
            value="petitions" 
            className={cn(
              "rounded-md transition-colors duration-150", 
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md", 
              "text-muted-foreground hover:text-foreground hover:bg-muted/60", 
              "text-sm px-3 py-2.5 flex-shrink-0 flex items-center gap-1.5 whitespace-nowrap" 
            )}
          >
            <ListChecks className={cn("h-4 w-4")} /> My Petitions
          </TabsTrigger>
          <TabsTrigger 
            value="my-campaigns" 
            className={cn(
              "rounded-md transition-colors duration-150",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
              "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              "text-sm px-3 py-2.5 flex-shrink-0 flex items-center gap-1.5 whitespace-nowrap"
            )}
          >
            <Megaphone className={cn("h-4 w-4")} /> My Campaigns
          </TabsTrigger>
          <TabsTrigger 
            value="supported-initiatives" 
            className={cn(
              "rounded-md transition-colors duration-150",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
              "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              "text-sm px-3 py-2.5 flex-shrink-0 flex items-center gap-1.5 whitespace-nowrap"
            )}
          >
            <HandHeart className={"h-4 w-4"} /> Supported Initiatives
          </TabsTrigger>
          <TabsTrigger 
            value="donations" 
            className={cn(
              "rounded-md transition-colors duration-150",
              "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
              "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              "text-sm px-3 py-2.5 flex-shrink-0 flex items-center gap-1.5 whitespace-nowrap"
            )}
          >
            <DollarSign className={"h-4 w-4"} /> Donation History
          </TabsTrigger>
          {isMobile === undefined || !isMobile ? (
            <TabsTrigger 
              value="settings" 
              className={cn(
                "rounded-md transition-colors duration-150",
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
                "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                "text-sm px-3 py-2.5 flex-shrink-0 flex items-center gap-1.5 whitespace-nowrap"
              )}
            >
              <Settings className={"h-4 w-4"} /> Account Settings
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="petitions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Created Petitions</CardTitle>
              <CardDescription>Petitions you have started.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUserPetitions && (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {userPetitionsError && !isLoadingUserPetitions && (
                <p className="text-destructive text-center py-10">{userPetitionsError}</p>
              )}
              {!isLoadingUserPetitions && !userPetitionsError && userCreatedPetitions && userCreatedPetitions.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {userCreatedPetitions.map(dbPetition => {
                    const cardPetition = mapDbPetitionToCardPetition(dbPetition);
                    return <InitiativeCard 
                              key={cardPetition.id} 
                              item={cardPetition} 
                              type={InitiativeType.Petition} 
                              showActions={true} 
                              onDelete={handleDeleteInitiative}
                            />;
                  })}
                </div>
              ) : null}
              {!isLoadingUserPetitions && !userPetitionsError && (!userCreatedPetitions || userCreatedPetitions.length === 0) && (
                 <p className="text-muted-foreground text-center py-10">You haven't created any petitions yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-campaigns" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Created Campaigns</CardTitle>
              <CardDescription>Fundraising campaigns you have organized.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUserCampaigns && (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {userCampaignsError && !isLoadingUserCampaigns && (
                <p className="text-destructive text-center py-10">{userCampaignsError}</p>
              )}
              {!isLoadingUserCampaigns && !userCampaignsError && userCreatedCampaigns && userCreatedCampaigns.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {userCreatedCampaigns.map(dbCampaign => {
                    const cardCampaign = mapDbCampaignToCardCampaign(dbCampaign);
                    return <InitiativeCard 
                              key={cardCampaign.id} 
                              item={cardCampaign} 
                              type={InitiativeType.Campaign}
                              showActions={true}
                              onDelete={handleDeleteInitiative}
                            />;
                  })}
                </div>
              ) : null}
              {!isLoadingUserCampaigns && !userCampaignsError && (!userCreatedCampaigns || userCreatedCampaigns.length === 0) && (
                 <p className="text-muted-foreground text-center py-10">You haven't created any campaigns yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supported-initiatives" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Supported Initiatives</CardTitle>
              <CardDescription>Campaigns and petitions you have supported or donated to. (Mock data)</CardDescription>
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
              <CardDescription>A record of your contributions. (Mock data)</CardDescription>
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
                      <p className="text-lg font-bold text-accent font-mono">${d.amount.toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground">You haven't made any donations yet.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {isMobile === undefined || !isMobile ? (
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
        ) : null}
      </Tabs>
    </motion.div>
  );
}
