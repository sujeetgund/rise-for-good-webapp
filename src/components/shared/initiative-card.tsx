import Link from 'next/link';
import Image from 'next/image';
import type { Initiative, Petition, Campaign } from '@/types';
import { InitiativeType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Target, DollarSign, Edit3, TrendingUp } from 'lucide-react';

interface InitiativeCardProps {
  item: Initiative;
  type: InitiativeType;
}

export function InitiativeCard({ item, type }: InitiativeCardProps) {
  const isPetition = type === InitiativeType.Petition;
  const petition = isPetition ? (item as Petition) : null;
  const campaign = !isPetition ? (item as Campaign) : null;

  const detailUrl = `/${type}s/${item.id}`;

  const progressValue = petition 
    ? (petition.supporters / petition.goal) * 100 
    : campaign 
    ? (campaign.raisedAmount / campaign.goalAmount) * 100 
    : 0;

  return (
    <Card className="overflow-hidden h-full flex flex-col hover:shadow-xl transition-shadow duration-300 hover:border-primary/50">
      <CardHeader className="p-0">
        {item.imageUrl && (
          <Link href={detailUrl} className="block">
            <Image
              src={item.imageUrl}
              alt={item.title}
              width={600}
              height={300}
              className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
              data-ai-hint={type === InitiativeType.Petition ? "petition protest" : "charity fundraiser"}
            />
          </Link>
        )}
        <div className="p-6">
          <CardTitle className="text-xl font-bold leading-tight hover:text-primary transition-colors">
            <Link href={detailUrl}>{item.title}</Link>
          </CardTitle>
          <CardDescription className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-6 pt-0">
        <div className="space-y-3 text-sm">
          <div className="flex items-center text-muted-foreground">
            {isPetition ? <Edit3 className="mr-2 h-4 w-4 text-primary" /> : <Users className="mr-2 h-4 w-4 text-primary" />}
            <span>{isPetition ? `By: ${petition?.author.username}` : `Organizer: ${campaign?.organizer.username}`}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <TrendingUp className="mr-2 h-4 w-4 text-accent" />
            <span>Category: {item.category}</span>
          </div>
          {isPetition && petition && (
            <>
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                <span>{petition.supporters.toLocaleString()} supporters</span>
              </div>
              <div className="flex items-center">
                <Target className="mr-2 h-4 w-4" />
                <span>Goal: {petition.goal.toLocaleString()}</span>
              </div>
            </>
          )}
          {campaign && (
            <>
              <div className="flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                <span>Raised: ${campaign.raisedAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center">
                <Target className="mr-2 h-4 w-4" />
                <span>Goal: ${campaign.goalAmount.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
        { (petition || campaign) && 
          <div className="mt-4">
            <Progress value={progressValue} aria-label={`${progressValue.toFixed(0)}% progress`} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-primary" />
            <p className="text-xs text-muted-foreground mt-1 text-right">{progressValue.toFixed(0)}% Reached</p>
          </div>
        }
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button asChild className="w-full bg-primary text-primary-foreground btn-glow-primary">
          <Link href={detailUrl}>{isPetition ? 'View Petition' : 'Support Campaign'}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
