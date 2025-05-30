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
import { Loader2, LogInIcon, UserPlus } from 'lucide-react';

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
  const router = useRouter();
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
          if (result?.error) {
            setError(result.error);
            toast({ variant: 'destructive', title: 'Login Failed', description: result.error });
          } else {
            toast({ title: 'Login Successful', description: 'Redirecting to dashboard...', className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary' });
            router.push('/dashboard');
            router.refresh(); 
          }
        } else {
          const result = await signupWithEmail(values as z.infer<typeof signupSchema>);
           if (result?.error) {
            setError(result.error);
            toast({ variant: 'destructive', title: 'Signup Failed', description: result.error });
          } else {
            toast({ title: 'Signup Successful', description: 'Please check your email to confirm your account.', className: 'bg-primary/10 border-primary text-primary-foreground glow-text-primary' });
            form.reset();
          }
        }
      } catch (e: any) {
        const errorMessage = e.message || 'An unexpected error occurred.';
        setError(errorMessage);
        toast({ variant: 'destructive', title: 'Error', description: errorMessage });
      }
    });
  }

  return (
    <Card className="w-full shadow-xl shadow-primary/20 border-border/50 interactive-card">
      <CardHeader>
        <CardTitle className="font-headline text-3xl glow-text-primary">
          {mode === 'login' ? 'Welcome Back, Warrior!' : 'Join the Ranks!'}
        </CardTitle>
        <CardDescription>
          {mode === 'login' ? 'Enter the arena and continue your NEET conquest.' : 'Forge your legend. Sign up for NEET Prep+.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your-battle-tag@example.com" {...field} className="border-2 border-input focus:border-primary"/>
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="border-2 border-input focus:border-primary"/>
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
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="border-2 border-input focus:border-primary"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full font-semibold text-lg py-6 glow-button" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                mode === 'login' ? <LogInIcon className="mr-2 h-5 w-5" /> : <UserPlus className="mr-2 h-5 w-5" />
              )}
              {mode === 'login' ? 'Login to Arena' : 'Create Account'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <Link href={mode === 'login' ? '/signup' : '/login'} className="font-medium text-primary hover:underline hover:glow-text-primary">
            {mode === 'login' ? 'Sign Up' : 'Login'}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
