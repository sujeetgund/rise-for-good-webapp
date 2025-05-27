'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { getMockPetitionById, mockSupporters } from '@/lib/mock-data';
import type { Petition } from '@/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Target, CalendarDays, Edit3, Share2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PetitionDetailPage() {
  const params = useParams();
  const { id } = params;
  const { toast } = useToast();
  const [petition, setPetition] = useState<Petition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    if (id) {
      // Simulate API call
      setTimeout(() => {
        const foundPetition = getMockPetitionById(id as string);
        setPetition(foundPetition || null);
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

  if (!petition) {
    return <div className="text-center py-20 text-xl text-muted-foreground">Petition not found.</div>;
  }
  
  const progressValue = (petition.supporters / petition.goal) * 100;

  const handleSignPetition = () => {
    if (!hasSigned) {
      setPetition(prev => prev ? { ...prev, supporters: prev.supporters + 1 } : null);
      setHasSigned(true);
      toast({
        title: "Petition Signed!",
        description: `Thank you for supporting "${petition.title}".`,
      });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: "Petition link copied to clipboard. Share it with your friends!",
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
          {petition.imageUrl && (
            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{opacity:1, scale:1}} transition={{delay:0.1}}>
            <Image
              src={petition.imageUrl}
              alt={petition.title}
              width={800}
              height={450}
              className="w-full h-auto max-h-[450px] object-cover rounded-lg shadow-xl border border-border"
              data-ai-hint="protest people"
            />
            </motion.div>
          )}
          
          <motion.div initial={{ opacity:0, y:20 }} animate={{opacity:1, y:0}} transition={{delay:0.2}}>
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{petition.title}</CardTitle>
              {petition.contentWarning && (
                <div className="mt-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive-foreground flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                    <span className="text-sm font-medium">{petition.contentWarning}</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="text-lg text-foreground leading-relaxed space-y-4">
              <p>{petition.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground pt-4 border-t border-border">
                <div className="flex items-center"><Edit3 className="mr-2 h-5 w-5 text-accent" />Authored by: {petition.author.username}</div>
                <div className="flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-accent" />Created: {new Date(petition.createdAt).toLocaleDateString()}</div>
                <div className="flex items-center"><Users className="mr-2 h-5 w-5 text-accent" />Category: {petition.category}</div>
                {petition.location && <div className="flex items-center"><Target className="mr-2 h-5 w-5 text-accent" />Location: {petition.location}</div>}
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </div>

        {/* Sidebar Column */}
        <motion.div initial={{ opacity:0, x:20 }} animate={{opacity:1, x:0}} transition={{delay:0.3}} className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Support this Petition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xl font-bold text-accent">{petition.supporters.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">signed of {petition.goal.toLocaleString()} goal</span>
                </div>
                <Progress value={progressValue} aria-label={`${progressValue.toFixed(0)}% of goal reached`} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-primary" />
              </div>
              <Button onClick={handleSignPetition} disabled={hasSigned} size="lg" className="w-full bg-primary text-primary-foreground btn-glow-primary mb-3">
                {hasSigned ? 'Thank You for Signing!' : 'Sign this Petition'}
              </Button>
              <Button onClick={handleShare} variant="outline" size="lg" className="w-full btn-glow-accent hover:border-accent">
                <Share2 className="mr-2 h-5 w-5"/> Share
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Recent Supporters</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto space-y-3">
              {mockSupporters.slice(0, 10).map(supporter => (
                <div key={supporter.id} className="flex items-center p-2 bg-secondary rounded-md">
                  <Avatar className="h-10 w-10 mr-3 border-2 border-primary/50">
                    <AvatarImage src={supporter.avatarUrl} alt={supporter.name} data-ai-hint="person user" />
                    <AvatarFallback>{supporter.name.substring(0,1)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{supporter.name}</p>
                    <p className="text-xs text-muted-foreground">{Math.random() > 0.3 ? 'Signed recently' : `Joined ${Math.floor(Math.random()*5)+1}h ago`}</p>
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
