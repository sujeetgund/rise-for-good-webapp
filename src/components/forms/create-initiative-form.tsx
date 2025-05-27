'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PETITION_CATEGORIES, CAMPAIGN_CATEGORIES } from '@/lib/constants';
import { InitiativeType } from '@/types';
import { moderateCampaignContent, ModerateCampaignContentOutput } from '@/ai/flows/moderate-campaign-content';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchemaBase = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }).max(100),
  description: z.string().min(20, { message: 'Description must be at least 20 characters.' }).max(2000),
  category: z.string().min(1, { message: 'Please select a category.' }),
  imageUrl: z.string().url({ message: 'Please enter a valid image URL.' }).optional().or(z.literal('')),
});

const petitionSchema = formSchemaBase.extend({
  goal: z.coerce.number().min(10, { message: 'Goal must be at least 10 supporters.' }),
});

const campaignSchema = formSchemaBase.extend({
  goalAmount: z.coerce.number().min(10, { message: 'Goal amount must be at least $10.' }),
  isVerified: z.boolean().default(false).optional(), // Assuming verification is manual or separate
});

interface CreateInitiativeFormProps {
  type: InitiativeType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any, moderationResult?: ModerateCampaignContentOutput) => Promise<void>; 
}

export function CreateInitiativeForm({ type, onSubmit }: CreateInitiativeFormProps) {
  const { toast } = useToast();
  const [isModerating, setIsModerating] = useState(false);
  const [moderationResult, setModerationResult] = useState<ModerateCampaignContentOutput | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentSchema = type === InitiativeType.Petition ? petitionSchema : campaignSchema;
  const categories = type === InitiativeType.Petition ? PETITION_CATEGORIES : CAMPAIGN_CATEGORIES;

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      imageUrl: '',
      ...(type === InitiativeType.Petition ? { goal: 100 } : { goalAmount: 1000, isVerified: false }),
    },
  });

  const handleModerateContent = async () => {
    const title = form.getValues('title');
    const description = form.getValues('description');

    if (!title || !description) {
      toast({
        variant: 'destructive',
        title: 'Missing Content',
        description: 'Please fill in the title and description before moderating.',
      });
      return;
    }

    setIsModerating(true);
    setModerationResult(null);
    try {
      const result = await moderateCampaignContent({
        content: `Title: ${title}\nDescription: ${description}`,
        contentType: type,
      });
      setModerationResult(result);
      toast({
        title: 'Content Moderated',
        description: result.isAppropriate ? 'Content looks good!' : 'Content needs review. See suggestions below.',
      });
      if (result.revisedContent && result.isAppropriate === false) {
         const revisedParts = result.revisedContent.split('Description:');
         if (revisedParts[0]) {
            form.setValue('title', revisedParts[0].replace('Title:','').trim());
         }
         if (revisedParts[1]) {
            form.setValue('description', revisedParts[1].trim());
         }
      }
    } catch (error) {
      console.error('Moderation error:', error);
      toast({
        variant: 'destructive',
        title: 'Moderation Failed',
        description: 'Could not moderate content at this time.',
      });
    } finally {
      setIsModerating(false);
    }
  };

  const onFormSubmit = async (values: z.infer<typeof currentSchema>) => {
    setIsSubmitting(true);
    if (!moderationResult?.isAppropriate && type !== 'admin-override') { // type can be used for admin override logic
        if (moderationResult && !moderationResult.isAppropriate) {
             toast({
                variant: 'destructive',
                title: 'Content Not Approved',
                description: 'Please address the moderation feedback before submitting, or use the AI suggested revision.',
            });
            setIsSubmitting(false);
            return;
        }
        // If not moderated yet, prompt user
        toast({
            variant: 'default',
            title: 'Moderation Required',
            description: 'Please moderate the content using the "Check Content with AI" button before submitting.',
        });
        setIsSubmitting(false);
        return;
    }
    await onSubmit(values, moderationResult ?? undefined);
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8 p-6 md:p-8 bg-card rounded-lg shadow-xl">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Title</FormLabel>
              <FormControl>
                <Input placeholder={`Enter ${type} title`} {...field} className="text-base"/>
              </FormControl>
              <FormDescription>
                A clear and concise title for your {type}.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Description</FormLabel>
              <FormControl>
                <Textarea placeholder={`Describe your ${type} in detail...`} {...field} rows={8} className="text-base"/>
              </FormControl>
              <FormDescription>
                Provide all necessary information about your {type}. Be clear and persuasive.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold">Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="text-base">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {type === InitiativeType.Petition && (
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Supporter Goal</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 1000" {...field} className="text-base"/>
                  </FormControl>
                  <FormDescription>
                    Number of supporters you aim to reach.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {type === InitiativeType.Campaign && (
            <FormField
              control={form.control}
              name="goalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Funding Goal ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 5000" {...field} className="text-base"/>
                  </FormControl>
                  <FormDescription>
                    Amount of money you aim to raise.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Image URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.png" {...field} className="text-base"/>
              </FormControl>
              <FormDescription>
                A relevant image can increase engagement.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {moderationResult && (
          <Alert variant={moderationResult.isAppropriate ? "default" : "destructive"} className="mt-6">
             <Sparkles className="h-5 w-5 text-accent" />
            <AlertTitle className="font-semibold">
              {moderationResult.isAppropriate ? "AI Content Check: Approved" : "AI Content Check: Needs Attention"}
            </AlertTitle>
            <AlertDescription>
              <p className="font-medium">Reasoning: {moderationResult.reasoning}</p>
              {moderationResult.revisedContent && !moderationResult.isAppropriate && (
                <div className="mt-2 p-3 bg-muted/50 rounded">
                  <p className="font-semibold text-sm">Suggested Revision:</p>
                  <p className="text-xs whitespace-pre-wrap">{moderationResult.revisedContent}</p>
                  <Button type="button" size="sm" variant="link" className="p-0 h-auto text-accent" onClick={() => {
                     const revisedParts = moderationResult.revisedContent!.split('Description:');
                     if (revisedParts[0]) form.setValue('title', revisedParts[0].replace('Title:','').trim());
                     if (revisedParts[1]) form.setValue('description', revisedParts[1].trim());
                     toast({ title: 'Suggestion Applied', description: 'Title and description updated with AI suggestion.' });
                  }}>Apply Suggestion</Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleModerateContent}
            disabled={isModerating || isSubmitting}
            className="btn-glow-accent hover:border-accent w-full sm:w-auto"
          >
            {isModerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Check Content with AI
          </Button>
          <Button type="submit" disabled={isSubmitting || isModerating} className="bg-primary text-primary-foreground btn-glow-primary w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create {type === InitiativeType.Petition ? 'Petition' : 'Campaign'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
