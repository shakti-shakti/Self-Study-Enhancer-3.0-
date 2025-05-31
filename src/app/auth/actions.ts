
'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
});


export async function loginWithEmail(formData: z.infer<typeof loginSchema>): Promise<{ error?: string; success?: boolean }> {
  console.log("[AuthAction] loginWithEmail called with:", formData.email);
  const supabase = createClient();
  const validatedFields = loginSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error("[AuthAction] Login validation failed:", validatedFields.error.flatten().fieldErrors);
    return { error: 'Invalid fields submitted.' };
  }

  const { email, password } = validatedFields.data;
  console.log("[AuthAction] Attempting Supabase sign-in for:", email);

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[AuthAction] Supabase signInWithPassword error:", error.message);
    return { error: error.message };
  }
  
  if (!data.session) {
    console.error("[AuthAction] Supabase signInWithPassword returned no session, though no error.");
    return { error: "Login failed: No session returned from Supabase." };
  }

  console.log("[AuthAction] Supabase signInWithPassword successful for:", email);
  return { success: true };
}

export async function signupWithEmail(formData: z.infer<typeof signupSchema>): Promise<{ error?: string; success?: boolean; message?: string }> {
  console.log("[AuthAction] signupWithEmail called with:", formData.email);
  const supabase = createClient();
  const validatedFields = signupSchema.safeParse(formData);
  
  if (!validatedFields.success) {
    console.error("[AuthAction] Signup validation failed:", validatedFields.error.flatten().fieldErrors);
    return { error: 'Invalid fields submitted.' };
  }

  const { email, password } = validatedFields.data;
  const origin = headers().get('origin');
  console.log("[AuthAction] Attempting Supabase signUp for:", email, "with origin:", origin);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("[AuthAction] Supabase signUp error:", error.message);
    if (error.message.includes("User already registered")) {
        return { error: "This email is already registered. Please try logging in." };
    }
    return { error: error.message };
  }

  if (data.user && data.user.identities && data.user.identities.length === 0) {
     console.warn("[AuthAction] Supabase signUp: User might already exist (no identities). Email:", email);
     return { error: "User already exists with this email. Try logging in." };
  }
  
  // Check if a session is immediately available (email confirmation might be off or auto-confirmed)
  if (data.session) {
    console.log("[AuthAction] Supabase signUp successful WITH session for:", email, "Redirecting to dashboard.");
    redirect('/dashboard'); // Auto-login and redirect
  }

  // If no session, but user created, email confirmation is likely pending
  if (data.user) {
    console.log("[AuthAction] Supabase signUp successful, user created, email confirmation pending for:", email);
    return { success: true, message: "Account created! Please check your email to verify your account." };
  }
  
  console.error("[AuthAction] Supabase signUp returned no user and no error. This is unexpected.");
  return { error: "An unexpected issue occurred during signup. Please try again." };
}

export async function logout() {
  console.log("[AuthAction] logout called");
  const supabase = createClient();
  await supabase.auth.signOut();
  console.log("[AuthAction] Supabase signOut complete, redirecting to /login");
  redirect('/login');
}
