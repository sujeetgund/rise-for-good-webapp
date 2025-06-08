
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PETITION_CATEGORIES, CAMPAIGN_CATEGORIES } from "@/lib/constants";
import { InitiativeType } from "@/types";
import {
  moderateCampaignContent,
  ModerateCampaignContentOutput,
} from "@/ai/flows/moderate-campaign-content";
import {
  generateInitiativeImage,
  GenerateInitiativeImageOutput,
} from "@/ai/flows/generate-initiative-image-flow";
import {
  getImageGenerationCredits,
  recordImageGenerationAndUpdateCredits
} from "@/actions/user-credits";
import { uploadImageToCloudinary } from "@/actions/initiative-actions";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, Sparkles, ImagePlus, AlertCircle, LinkIcon, Wand2, CreditCard, UploadCloud } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUser } from "@clerk/nextjs";

const formSchemaBase = z.object({
  title: z
    .string()
    .min(5, { message: "Title must be at least 5 characters." })
    .max(100),
  description: z
    .string()
    .min(20, { message: "Description must be at least 20 characters." })
    .max(5000), // Increased max length
  category: z.string().min(1, { message: "Please select a category." }),
  imageUrl: z // This will hold the dataURI or manual URL initially
    .string()
    .optional()
    .or(z.literal("")), 
  location: z.string().optional(), // Added location
  contentWarning: z.string().optional(),
});

const petitionSchema = formSchemaBase.extend({
  goal: z.coerce
    .number()
    .min(10, { message: "Goal must be at least 10 supporters." }),
});

const campaignSchema = formSchemaBase.extend({
  goalAmount: z.coerce
    .number()
    .min(10, { message: "Goal amount must be at least $10." }),
});

export type CreateInitiativeFormValues = z.infer<typeof petitionSchema> | z.infer<typeof campaignSchema>;

interface CreateInitiativeFormProps {
  type: InitiativeType;
  onSubmitWithCloudinary: (
    data: CreateInitiativeFormValues,
    moderationResult: ModerateCampaignContentOutput | null,
    cloudinaryImageUrl: string | null, // URL from Cloudinary
    userId: string
  ) => Promise<void>;
}

export function CreateInitiativeForm({
  type,
  onSubmitWithCloudinary,
}: CreateInitiativeFormProps) {
  const { toast } = useToast();
  const { user, isSignedIn, isLoaded: isUserLoaded } = useUser();

  const [isModerating, setIsModerating] = useState(false);
  const [moderationResult, setModerationResult] =
    useState<ModerateCampaignContentOutput | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false); // Renamed to avoid conflict

  const [imageInputMode, setImageInputMode] = useState<'manual' | 'ai'>('manual');
  const [manualImageUrlInput, setManualImageUrlInput] = useState("");
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [isGeneratingAIImage, setIsGeneratingAIImage] = useState(false);
  const [isProcessingManualUrl, setIsProcessingManualUrl] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null); // dataURI or manual URL for preview

  const [imageCredits, setImageCredits] = useState<number | null>(null);
  const [isLoadingCredits, setIsLoadingCredits] = useState(true);


  const currentSchema =
    type === InitiativeType.Petition ? petitionSchema : campaignSchema;
  const categories =
    type === InitiativeType.Petition
      ? PETITION_CATEGORIES
      : CAMPAIGN_CATEGORIES;

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      imageUrl: "", // This field will store dataURI or manual URL from input
      location: "",
      contentWarning: "",
      ...(type === InitiativeType.Petition
        ? { goal: 100 }
        : { goalAmount: 1000 }),
    },
  });

  const fetchCredits = async () => {
    if (!isSignedIn) {
      setIsLoadingCredits(false);
      return;
    }
    setIsLoadingCredits(true);
    try {
      const credits = await getImageGenerationCredits();
      setImageCredits(credits);
    } catch (error) {
      console.error("Failed to fetch image credits:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch image generation credits.",
      });
      setImageCredits(0); 
    } finally {
      setIsLoadingCredits(false);
    }
  };

  useEffect(() => {
     if (isUserLoaded) fetchCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, isUserLoaded, user]);


  useEffect(() => {
    // Update imagePreviewUrl if form's imageUrl (dataURI/manual URL) changes
    const currentFormImageUrl = form.getValues("imageUrl");
    if (currentFormImageUrl && currentFormImageUrl !== imagePreviewUrl) {
      // Basic check to prevent loops if it's already the preview
      if(imageInputMode === 'manual' && currentFormImageUrl.startsWith('http')){
         setImagePreviewUrl(currentFormImageUrl);
      } else if (imageInputMode === 'ai' && currentFormImageUrl.startsWith('data:image')) {
         setImagePreviewUrl(currentFormImageUrl);
      }
    }
  }, [form.watch("imageUrl"), imageInputMode]);


  const handleModerateContent = async () => {
    const title = form.getValues("title");
    const description = form.getValues("description");

    if (!title || !description) {
      toast({
        variant: "destructive",
        title: "Missing Content",
        description: "Please fill in the title and description before moderating.",
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
      form.setValue("contentWarning", result.isAppropriate ? "" : result.reasoning.substring(0, 100) + (result.reasoning.length > 100 ? "..." : ""));

      toast({
        title: "Content Moderated",
        description: result.isAppropriate
          ? "Content looks good!"
          : "Content needs review. See suggestions below.",
      });
      if (result.revisedContent && result.isAppropriate === false) {
        const revisedParts = result.revisedContent.split("Description:");
        if (revisedParts[0]) {
          form.setValue("title", revisedParts[0].replace("Title:", "").trim());
        }
        if (revisedParts[1]) {
          form.setValue("description", revisedParts[1].trim());
        }
      }
    } catch (error) {
      console.error("Moderation error:", error);
      toast({ variant: "destructive", title: "Moderation Failed", description: "Could not moderate content at this time." });
    } finally {
      setIsModerating(false);
    }
  };

  const handleGenerateImageWithAI = async () => {
    if (isLoadingCredits || imageCredits === null || imageCredits <= 0) {
      toast({ variant: "destructive", title: "No Credits", description: "You have no AI image generation credits." });
      return;
    }
    if (!aiImagePrompt.trim()) {
      toast({ variant: "destructive", title: "Missing Prompt", description: "Please enter a prompt for image generation." });
      return;
    }
    setIsGeneratingAIImage(true);
    setImagePreviewUrl(null);
    form.setValue("imageUrl", "", { shouldValidate: false }); // Clear any manual URL
    try {
      const result: GenerateInitiativeImageOutput = await generateInitiativeImage({ prompt: aiImagePrompt });
      form.setValue("imageUrl", result.imageDataUri, { shouldValidate: true }); // Store dataURI
      setImagePreviewUrl(result.imageDataUri);
      setManualImageUrlInput("");

      const updatedCredits = await recordImageGenerationAndUpdateCredits();
      setImageCredits(updatedCredits);
      toast({ title: "Image Generated!", description: "AI image ready. Credits updated." });
    } catch (error) {
      console.error("Image generation error:", error);
      let description = "Could not generate image. Please try again.";
       if (error instanceof Error) {
        if (error.message.includes('safety filters')) description = "Prompt blocked by safety filters. Try a different prompt.";
        else if (error.message.includes('No image generation credits')) description = "No AI image credits left.";
        else if (error.message.includes('Failed to update image generation credits')) description = "Image generated, but failed to update credits.";
      }
      toast({ variant: "destructive", title: "AI Image Failed", description });
      form.setValue("imageUrl", "", { shouldValidate: true });
      setImagePreviewUrl(null);
      await fetchCredits();
    } finally {
      setIsGeneratingAIImage(false);
    }
  };

  const handleUseManualImageUrl = () => {
    const url = manualImageUrlInput.trim();
    setIsProcessingManualUrl(true);
    if (!url) {
      toast({ variant: "destructive", title: "Missing URL", description: "Please enter an image URL." });
      form.setValue("imageUrl", "", { shouldValidate: true }); setImagePreviewUrl(null);
      setIsProcessingManualUrl(false); return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast({ variant: "destructive", title: "Invalid URL Format", description: "URL must start with http:// or https://."});
      setIsProcessingManualUrl(false); return;
    }
    form.setValue("imageUrl", url, { shouldValidate: true }); // Store manual URL
    setImagePreviewUrl(url);
    setAiImagePrompt("");
    toast({ title: "Image URL Set", description: "Preview updated with manual URL." });
    setIsProcessingManualUrl(false);
  }

  // This is the function that react-hook-form's handleSubmit will call
  const onFormProcessAndSubmit = async (values: z.infer<typeof currentSchema>) => {
    if (!user?.id) {
      toast({ variant: "destructive", title: "Authentication Error", description: "User not found. Please log in." });
      return;
    }
    setIsSubmittingForm(true);

    let finalImageUrlForDb: string | null = null;
    const imageSourceForUpload = form.getValues("imageUrl"); // This is the dataURI or manual URL

    if (imageSourceForUpload) {
      try {
        toast({ title: "Uploading Image...", description: "Please wait while your image is being uploaded." });
        const uploadResult = await uploadImageToCloudinary(imageSourceForUpload, type, values.title);
        if (uploadResult?.secure_url) {
          finalImageUrlForDb = uploadResult.secure_url;
          toast({ title: "Image Uploaded!", description: "Image successfully uploaded to Cloudinary." });
        } else {
          toast({ variant: "destructive", title: "Image Upload Failed", description: "Could not upload image to Cloudinary. Continuing without image." });
        }
      } catch (error) {
        console.error("Cloudinary upload error during form submission:", error);
        toast({ variant: "destructive", title: "Image Upload Error", description: `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}. Continuing without image.` });
      }
    }
    
    // Handle content warning based on moderation
    let finalContentWarning = values.contentWarning;
    if (!moderationResult?.isAppropriate) {
        if (moderationResult) {
            finalContentWarning = moderationResult.reasoning.substring(0, 150) + (moderationResult.reasoning.length > 150 ? "..." : "");
        } else {
            finalContentWarning = "Content subject to review.";
        }
    } else {
        finalContentWarning = ""; // Clear warning if content is appropriate
    }

    const submissionData = {
        ...values,
        contentWarning: finalContentWarning,
        // imageUrl is already part of `values` from the form. We pass `finalImageUrlForDb` separately.
    };

    await onSubmitWithCloudinary(submissionData, moderationResult, finalImageUrlForDb, user.id);
    setIsSubmittingForm(false);
  };
  
  const canGenerateWithAI = !isLoadingCredits && imageCredits !== null && imageCredits > 0;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onFormProcessAndSubmit)}
        className="space-y-8 p-6 md:p-8 bg-card rounded-lg shadow-xl"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Title</FormLabel>
              <FormControl><Input placeholder={`Enter ${type} title`} {...field} className="text-base" /></FormControl>
              <FormDescription>A clear and concise title for your {type}.</FormDescription>
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
              <FormControl><Textarea placeholder={`Describe your ${type} in detail...`} {...field} rows={8} className="text-base"/></FormControl>
              <FormDescription>Provide all necessary information about your {type}. Be clear and persuasive.</FormDescription>
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
                  <FormControl><SelectTrigger className="text-base"><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                  <SelectContent>{categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold">Location (Optional)</FormLabel>
                <FormControl><Input placeholder="e.g., City, State or Global" {...field} className="text-base" /></FormControl>
                <FormDescription>Where is this {type} focused?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />


          {type === InitiativeType.Petition && (
            <FormField control={form.control} name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Supporter Goal</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 1000" {...field} className="text-base"/></FormControl>
                  <FormDescription>Number of supporters you aim to reach.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {type === InitiativeType.Campaign && (
            <FormField control={form.control} name="goalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">Funding Goal ($)</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 5000" {...field} className="text-base"/></FormControl>
                  <FormDescription>Amount of money you aim to raise.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Hidden FormField for imageUrl to show Zod validation errors if any during programmatic set, though direct user input to it is via tabs. */}
        <FormField control={form.control} name="imageUrl" render={({ fieldState }) => (
            <FormItem className="h-0 m-0 p-0"> {fieldState.error && <FormMessage className="mt-2" />}</FormItem>
        )} />


        <FormItem>
          <FormLabel className="text-lg font-semibold">Initiative Image (Optional)</FormLabel>
          <Tabs value={imageInputMode} onValueChange={(value) => setImageInputMode(value as 'manual' | 'ai')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual"><LinkIcon className="mr-2 h-4 w-4" />URL</TabsTrigger>
              <TabsTrigger value="ai"><Wand2 className="mr-2 h-4 w-4" />AI</TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="mt-4 space-y-3">
              <Input placeholder="Paste image URL here (e.g., https://example.com/image.png)" value={manualImageUrlInput} onChange={(e) => setManualImageUrlInput(e.target.value)} className="text-base" disabled={isProcessingManualUrl || isGeneratingAIImage}/>
              <Button type="button" variant="outline" onClick={handleUseManualImageUrl} disabled={isProcessingManualUrl || isGeneratingAIImage || !manualImageUrlInput.trim()} className="btn-glow-accent hover:border-accent">
                {isProcessingManualUrl ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />} Use this Image
              </Button>
              <FormDescription>Provide a direct link. Preview will appear if valid. Image will be uploaded to our servers.</FormDescription>
            </TabsContent>
            <TabsContent value="ai" className="mt-4 space-y-3">
              <Input id="aiImagePrompt" placeholder="e.g., 'Happy diverse community members collaborating'" value={aiImagePrompt} onChange={(e) => setAiImagePrompt(e.target.value)} className="text-base" disabled={isGeneratingAIImage || isProcessingManualUrl || !canGenerateWithAI}/>
              <div className="flex items-center justify-between mb-2">
                <Button type="button" variant="outline" onClick={handleGenerateImageWithAI} disabled={isGeneratingAIImage || isProcessingManualUrl || isSubmittingForm || !aiImagePrompt.trim() || !canGenerateWithAI} className="btn-glow-accent hover:border-accent">
                  {isGeneratingAIImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Generate Image
                </Button>
                <div className="text-sm text-muted-foreground flex items-center">
                  {isLoadingCredits ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CreditCard className="mr-1 h-4 w-4 text-accent" />} Credits: {imageCredits ?? '...'}
                </div>
              </div>
              {!canGenerateWithAI && !isLoadingCredits && (imageCredits === 0 || imageCredits === null) && (<p className="text-sm text-destructive">No AI image generation credits remaining this month.</p>)}
              {isGeneratingAIImage && <p className="text-sm text-muted-foreground">Generating image, please wait...</p>}
              <FormDescription>Describe image for AI. Uses 1 credit. Image will be uploaded to our servers.</FormDescription>
            </TabsContent>
          </Tabs>
        </FormItem>

        {imagePreviewUrl && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Image Preview (local):</p>
            <Image src={imagePreviewUrl} alt="Initiative image preview" width={300} height={168} className="rounded-md border border-border object-cover" data-ai-hint="initiative preview"
              onError={() => {
                toast({ variant: "destructive", title: "Image Load Error", description: "Could not load preview for the URL." });
                setImagePreviewUrl(null); form.setValue("imageUrl", "", { shouldValidate: true });
              }}/>
          </div>
        )}

        {moderationResult && (
          <Alert variant={moderationResult.isAppropriate ? "default" : "destructive"} className="mt-6">
            {moderationResult.isAppropriate ? <Sparkles className="h-5 w-5 text-accent" /> : <AlertCircle className="h-5 w-5 text-destructive" />}
            <AlertTitle className="font-semibold">{moderationResult.isAppropriate ? "AI Content Check: Approved" : "AI Content Check: Needs Attention"}</AlertTitle>
            <AlertDescription>
              <p className="font-medium">Reasoning: {moderationResult.reasoning}</p>
              {moderationResult.revisedContent && !moderationResult.isAppropriate && (
                  <div className="mt-2 p-3 bg-muted/50 rounded">
                    <p className="font-semibold text-sm">Suggested Revision:</p>
                    <p className="text-xs whitespace-pre-wrap">{moderationResult.revisedContent}</p>
                    <Button type="button" size="sm" variant="link" className="p-0 h-auto text-accent"
                      onClick={() => {
                        const revisedParts = moderationResult.revisedContent!.split("Description:");
                        if (revisedParts[0]) form.setValue("title",revisedParts[0].replace("Title:", "").trim());
                        if (revisedParts[1]) form.setValue("description", revisedParts[1].trim());
                        toast({ title: "Suggestion Applied", description: "Title and description updated."});
                      }}>Apply Suggestion</Button>
                  </div>
                )}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t border-border">
          <Button type="button" variant="outline" onClick={handleModerateContent} disabled={isModerating || isSubmittingForm || isGeneratingAIImage || isProcessingManualUrl} className="btn-glow-accent hover:border-accent w-full sm:w-auto">
            {isModerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Check Content with AI
          </Button>
          <Button type="submit" disabled={isSubmittingForm || isModerating || isGeneratingAIImage || isProcessingManualUrl} className="bg-primary text-primary-foreground btn-glow-primary w-full sm:w-auto">
            {isSubmittingForm ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4"/>} Create {type === InitiativeType.Petition ? "Petition" : "Campaign"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
