
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { loginWithEmail, signupWithEmail } from '@/app/auth/actions';
import { useState, useTransition } from 'react';
import { Loader2, LogInIcon, UserPlus, ShieldCheck } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
});

type AuthFormProps = {
  mode: 'login' | 'signup';
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter(); // Keep router for potential other uses or signup redirect
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const formSchema = mode === 'login' ? loginSchema : signupSchema;
  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      ...(mode === 'signup' && { confirmPassword: '' }),
    },
  });

  async function onSubmit(values: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (mode === 'login') {
          const result = await loginWithEmail(values as z.infer<typeof loginSchema>);
          // If loginWithEmail now redirects, this part might not be reached on success.
          // The error will still be returned if Supabase auth fails.
          if (result?.error) {
            setError(result.error);
            toast({ variant: 'destructive', title: 'Login Failed', description: result.error });
          } else {
            // This else block might not be hit if server action redirects.
            // The toast for success could be shown optimistically before the action fully completes,
            // or removed if the redirect is fast enough. For now, let's keep it.
            toast({ title: 'Login Initiated...', description: 'Attempting to log you in...', className: 'bg-primary/20 border-primary text-primary-foreground glow-text-primary' });
            // No client-side redirect needed here anymore for login
          }
        } else { // Signup logic remains the same
          const result = await signupWithEmail(values as z.infer<typeof signupSchema>);
           if (result?.error) {
            setError(result.error);
            toast({ variant: 'destructive', title: 'Signup Failed', description: result.error });
          } else {
            toast({ title: 'Account Created!', description: 'Welcome, warrior! Please check your email to verify your account.', className: 'bg-primary/20 border-primary text-primary-foreground glow-text-primary' });
            form.reset();
          }
        }
      } catch (e: any) {
        // This catch block handles errors from the action if it doesn't redirect
        // or if the redirect itself fails (though less likely for `redirect()`).
        const errorMessage = e.message || 'An unexpected error occurred.';
        if (!e.message?.includes('NEXT_REDIRECT')) { // Don't show error for intentional redirects
          setError(errorMessage);
          toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        }
      }
    });
  }

  return (
    <Card className="w-full bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl shadow-primary/30">
      <CardHeader className="text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-primary mb-4 glow-text-primary" />
        <CardTitle className="font-headline text-4xl glow-text-primary">
          {mode === 'login' ? 'Secure Access' : 'Create Your Profile'}
        </CardTitle>
        <CardDescription className="text-muted-foreground text-base">
          {mode === 'login' ? 'Enter your credentials to access the NEET Prep+ portal.' : 'Join the elite ranks of NEET Prep+ aspirants.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 pb-6 px-6 md:px-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base text-muted-foreground">Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your-callsign@domain.com" {...field} className="h-12 text-base input-glow"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base text-muted-foreground">Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter secure password" {...field} className="h-12 text-base input-glow"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {mode === 'signup' && (
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base text-muted-foreground">Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Re-enter password" {...field} className="h-12 text-base input-glow"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {error && (
                <p className="text-sm font-semibold text-destructive text-center py-2 bg-destructive/10 rounded-md">{error}</p>
            )}
            <Button type="submit" className="w-full font-headline font-semibold text-xl py-7 glow-button tracking-wider" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              ) : (
                mode === 'login' ? <LogInIcon className="mr-2 h-6 w-6" /> : <UserPlus className="mr-2 h-6 w-6" />
              )}
              {mode === 'login' ? 'Enter Portal' : 'Register Account'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center pb-8">
        <p className="text-base text-muted-foreground">
          {mode === 'login' ? "New challenger? " : 'Already registered? '}
          <Link href={mode === 'login' ? '/signup' : '/login'} className="font-semibold text-primary hover:text-accent transition-colors duration-300 hover:glow-text-accent">
            {mode === 'login' ? 'Create Account' : 'Login Here'}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
