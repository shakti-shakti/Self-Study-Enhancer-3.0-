
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

type FormMessageState = {
  type: 'error' | 'success' | 'info';
  text: string;
} | null;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null); // For overall action errors
  const [formMessage, setFormMessage] = useState<FormMessageState>(null); // For messages below the form
  const [isSubmitting, setIsSubmitting] = useState(false);


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
    setActionError(null);
    setFormMessage(null);
    setIsSubmitting(true);

    startTransition(async () => {
      try {
        if (mode === 'login') {
          toast({ title: 'Attempting login...', description: 'Please wait.' });
          const result = await loginWithEmail(values as z.infer<typeof loginSchema>);

          if (result?.error) {
            console.warn("[AuthForm] Login error:", result.error); // Changed from console.error
            setActionError(result.error);
            setFormMessage({ type: 'error', text: result.error });
            toast({ variant: 'destructive', title: 'Login Failed', description: result.error });
          } else if (result?.success) {
            toast({ title: 'Login Successful! Redirecting...', description: 'Welcome back!', className: 'bg-primary/20 border-primary text-primary-foreground glow-text-primary' });
            router.push('/dashboard');
            router.refresh();
          } else {
            console.warn("[AuthForm] Login: Unexpected result from server action."); // Changed from console.error
            const errorMsg = 'An unexpected error occurred during login.';
            setActionError(errorMsg);
            setFormMessage({type: 'error', text: errorMsg});
            toast({ variant: 'destructive', title: 'Login Failed', description: errorMsg });
          }
        } else { // Signup logic
          toast({ title: 'Creating account...', description: 'Please wait.' });
          const result = await signupWithEmail(values as z.infer<typeof signupSchema>);

          if (result?.error) {
            console.warn("[AuthForm] Signup error:", result.error); // Changed from console.error
            setActionError(result.error);
            setFormMessage({ type: 'error', text: result.error });
            toast({ variant: 'destructive', title: 'Signup Failed', description: result.error });
          } else if (result?.success && result.message) { // Email verification likely needed
            toast({ title: 'Account Created!', description: result.message, className: 'bg-primary/20 border-primary text-primary-foreground glow-text-primary', duration: 7000 });
            setFormMessage({ type: 'success', text: result.message });
            form.reset();
          } else if (result?.success) { // Auto-login (server action should have redirected)
             // This path might not be hit client-side if server action always redirects on immediate success.
             // If it does, it means signup was successful and a session was created.
            toast({ title: 'Account Created & Logged In!', description: 'Redirecting to dashboard...', className: 'bg-primary/20 border-primary text-primary-foreground glow-text-primary' });
            // The server action `signupWithEmail` should handle the redirect in this case.
            // router.refresh() might be needed if the server doesn't force a full page navigation.
            router.refresh();
          } else {
            console.warn("[AuthForm] Signup: Unexpected result from server action."); // Changed from console.error
            const errorMsg = 'An unexpected error occurred during signup.';
            setActionError(errorMsg);
            setFormMessage({type: 'error', text:errorMsg});
            toast({ variant: 'destructive', title: 'Signup Failed', description: errorMsg });
          }
        }
      } catch (e: any) {
        console.error("[AuthForm] onSubmit general catch error:", e); // Keep as console.error for unexpected client errors
        const errorMsg = e.message || "An unexpected client-side error occurred.";
        setActionError(errorMsg);
        setFormMessage({type: 'error', text: errorMsg});
        toast({ variant: 'destructive', title: 'Operation Failed', description: errorMsg });
      } finally {
        setIsSubmitting(false);
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
            {formMessage && (
                <p className={`text-sm font-semibold text-center py-2 rounded-md ${
                    formMessage.type === 'error' ? 'text-destructive bg-destructive/10' :
                    formMessage.type === 'success' ? 'text-green-500 bg-green-500/10' :
                    'text-blue-500 bg-blue-500/10' // info
                }`}>
                    {formMessage.text}
                </p>
            )}
            <Button type="submit" className="w-full font-headline font-semibold text-xl py-7 glow-button tracking-wider" disabled={isSubmitting}>
              {isSubmitting ? (
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
