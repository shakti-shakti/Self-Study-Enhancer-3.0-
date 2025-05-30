// src/app/dashboard/smart-doubt-resolver/page.tsx
'use client';

import { useState, useTransition, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { resolveDoubt, type ResolveDoubtInput, type ResolveDoubtOutput } from '@/ai/flows/smart-doubt-resolver';
import { Lightbulb, Loader2, UploadCloud, Sparkles, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import type { TablesInsert } from '@/lib/database.types';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const doubtResolverSchema = z.object({
  questionImage: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, "Please upload one image.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE_BYTES, `Max image size is ${MAX_FILE_SIZE_MB}MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

type DoubtResolverFormData = z.infer<typeof doubtResolverSchema>;

export default function SmartDoubtResolverPage() {
  const [isPending, startTransition] = useTransition();
  const [aiExplanation, setAiExplanation] = useState<ResolveDoubtOutput | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);


  const form = useForm<DoubtResolverFormData>({
    resolver: zodResolver(doubtResolverSchema),
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Trigger validation by setting value for react-hook-form
      form.setValue('questionImage', event.target.files as FileList);
      form.trigger('questionImage'); // Manually trigger validation
    } else {
      setPreviewImage(null);
      form.resetField('questionImage');
    }
  };

  async function onSubmit(values: DoubtResolverFormData) {
    setAiExplanation(null);
    if (!values.questionImage || values.questionImage.length === 0) {
        toast({ variant: 'destructive', title: 'No image selected', description: 'Please upload an image of your question.' });
        return;
    }
    
    const file = values.questionImage[0];
    const reader = new FileReader();

    reader.onloadend = () => {
        const imageDataUri = reader.result as string;
        startTransition(async () => {
          try {
            const input: ResolveDoubtInput = { questionImage: imageDataUri };
            const result = await resolveDoubt(input);
            setAiExplanation(result);

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const logEntry: TablesInsert<'doubt_resolution_logs'> = {
                    user_id: user.id,
                    question_image_data_uri: imageDataUri, // Storing for potential review/history, consider size implications
                    explanation: result.explanation
                };
                await supabase.from('doubt_resolution_logs').insert(logEntry);
            }

            toast({
              title: 'Explanation Ready!',
              description: 'AI has analyzed your question.',
              className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary',
            });
          } catch (error: any) {
            toast({
              variant: 'destructive',
              title: 'Error resolving doubt',
              description: error.message || 'An unexpected error occurred.',
            });
          }
        });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-10">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold glow-text-primary mb-3 flex items-center justify-center">
          <Lightbulb className="mr-4 h-10 w-10" /> Smart Doubt Resolver
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Stuck on a tough question? Upload an image and let AI provide a step-by-step explanation or find a matching solution.
        </p>
      </header>

      <Card className="max-w-2xl mx-auto interactive-card p-2 md:p-4 shadow-xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <UploadCloud className="mr-3 h-8 w-8 text-primary" /> Upload Your Question
          </CardTitle>
          <CardDescription>
            Snap a photo of the problem and let our AI guide you through it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="questionImage"
                render={({ fieldState }) => ( // field is not directly used here as we use a ref
                  <FormItem>
                    <FormLabel className="text-base font-medium">Question Image</FormLabel>
                    <FormControl>
                      <div
                        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-input hover:border-primary rounded-md cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="space-y-1 text-center">
                          {previewImage ? (
                            <Image src={previewImage} alt="Question preview" width={200} height={200} className="mx-auto max-h-48 w-auto object-contain rounded-md shadow-md" />
                          ) : (
                            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                          )}
                          <div className="flex text-sm text-muted-foreground">
                            <span className="relative rounded-md font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80">
                              {previewImage ? 'Change image' : 'Upload an image'}
                            </span>
                            <input
                              ref={fileInputRef}
                              id="questionImage"
                              name="questionImage"
                              type="file"
                              accept={ACCEPTED_IMAGE_TYPES.join(',')}
                              className="sr-only"
                              onChange={handleImageChange}
                              onBlur={form.control.getFieldState('questionImage').isTouched ? form.trigger : undefined}
                            />
                            {!previewImage && <p className="pl-1">or drag and drop</p>}
                          </div>
                          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to {MAX_FILE_SIZE_MB}MB</p>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full font-semibold text-lg py-6 glow-button" disabled={isPending || !previewImage || !!form.formState.errors.questionImage}>
                {isPending ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-6 w-6" />
                )}
                Get AI Explanation
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {isPending && !aiExplanation && (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">AI is analyzing your question... this might take a moment.</p>
        </div>
      )}

      {aiExplanation && (
        <Card className="max-w-2xl mx-auto mt-12 interactive-card shadow-xl shadow-accent/10">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl font-headline glow-text-accent">
              <Lightbulb className="mr-3 h-8 w-8" /> AI Explanation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{aiExplanation.explanation}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

    