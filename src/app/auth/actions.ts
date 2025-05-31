
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
});

export async function loginWithEmail(formData: z.infer<typeof loginSchema>): Promise<{ error?: string; success?: boolean }> {
  console.log("loginWithEmail server action started");
  const supabase = createClient();
  const validatedFields = loginSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error("Login validation failed:", validatedFields.error.flatten());
    return { error: 'Invalid fields.' };
  }

  const { email, password } = validatedFields.data;
  console.log("Attempting Supabase sign-in for:", email);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Supabase signInWithPassword error:", error.message);
    return { error: error.message };
  }
  
  console.log("Supabase signInWithPassword successful for:", email);
  return { success: true };
}

export async function signupWithEmail(formData: z.infer<typeof signupSchema>) {
  const supabase = createClient();
  const validatedFields = signupSchema.safeParse(formData);
  
  if (!validatedFields.success) {
    return { error: 'Invalid fields.' };
  }

  const { email, password } = validatedFields.data;
  const origin = headers().get('origin');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }
  if (data.user && data.user.identities && data.user.identities.length === 0) {
     return { error: "User already exists with this email. Try logging in." };
  }

  return { error: null, success: true }; // Should indicate success or need for verification
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
