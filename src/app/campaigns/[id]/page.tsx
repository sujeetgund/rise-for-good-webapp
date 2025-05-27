'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getMockCampaignById, mockSupporters } from '@/lib/mock-data';
import type { Campaign } from '@/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Target, CalendarDays, BadgeCheck, Share2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CampaignDetailPage() {
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState('');
  const [isDonating, setIsDonating] = useState(false);

  useEffect(() => {
    if (id) {
      // Simulate API call
      setTimeout(() => {
        const foundCampaign = getMockCampaignById(id as string);
        setCampaign(foundCampaign || null);
        setIsLoading(false);
      }, 500);
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="h-96 bg-muted rounded-lg mb-8"></div>
        <div className="h-10 w-3/4 bg-muted rounded mb-4"></div>
        <div className="h-6 w-1/2 bg-muted rounded mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
          <div className="h-4 bg-muted rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return <div className="text-center py-20 text-xl text-muted-foreground">Campaign not found.</div>;
  }

  const progressValue = (campaign.raisedAmount / campaign.goalAmount) * 100;

  const handleDonate = async () => {
    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid donation amount." });
      return;
    }
    setIsDonating(true);
    // Simulate donation processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setCampaign(prev => prev ? { 
      ...prev, 
      raisedAmount: prev.raisedAmount + amount,
      donors: prev.donors + 1,
    } : null);
    setDonationAmount('');
    setIsDonating(false);
    toast({
      title: "Donation Successful!",
      description: `Thank you for donating $${amount.toFixed(2)} to "${campaign.title}".`,
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: "Campaign link copied to clipboard. Share it with your friends!",
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          {campaign.imageUrl && (
            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{opacity:1, scale:1}} transition={{delay:0.1}}>
            <Image
              src={campaign.imageUrl}
              alt={campaign.title}
              width={800}
              height={450}
              className="w-full h-auto max-h-[450px] object-cover rounded-lg shadow-xl border border-border"
              data-ai-hint="charity event people"
            />
            </motion.div>
          )}
          
          <motion.div initial={{ opacity:0, y:20 }} animate={{opacity:1, y:0}} transition={{delay:0.2}}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{campaign.title}</CardTitle>
                {campaign.isVerified && <BadgeCheck className="h-8 w-8 text-green-500" title="Verified Campaign" />}
              </div>
              {campaign.contentWarning && (
                <div className="mt-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive-foreground flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                    <span className="text-sm font-medium">{campaign.contentWarning}</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="text-lg text-foreground leading-relaxed space-y-4">
              <p>{campaign.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground pt-4 border-t border-border">
                <div className="flex items-center"><Users className="mr-2 h-5 w-5 text-accent" />Organizer: {campaign.organizer.username}</div>
                <div className="flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-accent" />Created: {new Date(campaign.createdAt).toLocaleDateString()}</div>
                <div className="flex items-center"><DollarSign className="mr-2 h-5 w-5 text-accent" />Category: {campaign.category}</div>
                {campaign.location && <div className="flex items-center"><Target className="mr-2 h-5 w-5 text-accent" />Location: {campaign.location}</div>}
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </div>

        {/* Sidebar Column */}
        <motion.div initial={{ opacity:0, x:20 }} animate={{opacity:1, x:0}} transition={{delay:0.3}} className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Support this Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xl font-bold text-accent">${campaign.raisedAmount.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">raised of ${campaign.goalAmount.toLocaleString()} goal</span>
                </div>
                <Progress value={progressValue} aria-label={`${progressValue.toFixed(0)}% of goal reached`} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-primary" />
                <p className="text-xs text-muted-foreground mt-1">{campaign.donors.toLocaleString()} donors</p>
              </div>
              <div className="space-y-3">
                <Input 
                  type="number" 
                  placeholder="Enter donation amount" 
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="text-base"
                  aria-label="Donation amount"
                />
                <Button onClick={handleDonate} disabled={isDonating} size="lg" className="w-full bg-primary text-primary-foreground btn-glow-primary">
                  {isDonating ? 'Processing...' : 'Donate Now'}
                </Button>
                <Button onClick={handleShare} variant="outline" size="lg" className="w-full btn-glow-accent hover:border-accent">
                  <Share2 className="mr-2 h-5 w-5"/> Share
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Recent Donors</CardTitle>
            </CardHeader>
            <CardContent className="max-h-80 overflow-y-auto space-y-3">
              {mockSupporters.slice(0, 10).map(supporter => ( // Using mockSupporters as donors for example
                <div key={supporter.id} className="flex items-center p-2 bg-secondary rounded-md">
                  <Avatar className="h-10 w-10 mr-3 border-2 border-primary/50">
                    <AvatarImage src={supporter.avatarUrl} alt={supporter.name} data-ai-hint="person user" />
                    <AvatarFallback>{supporter.name.substring(0,1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{supporter.name}</p>
                    <p className="text-xs text-muted-foreground">{Math.random() > 0.3 ? `Donated $${Math.floor(Math.random()*50)+5}` : `Joined ${Math.floor(Math.random()*5)+1}d ago`}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
