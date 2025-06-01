
'use server';

import { createClient } from '@/lib/supabase/client'; // Changed to client for re-auth attempt
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

const changePasswordSchema = z.object({
    currentPassword: z.string().min(6, "Current password is required."),
    newPassword: z.string().min(6, "New password must be at least 6 characters."),
});


export async function loginWithEmail(formData: z.infer<typeof loginSchema>): Promise<{ error?: string; success?: boolean }> {
  // For login, we need the server client to manage cookies correctly upon successful sign-in
  const supabaseServer = require('@/lib/supabase/server').createClient();
  console.log("[AuthAction] loginWithEmail called with:", formData.email);
  const validatedFields = loginSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error("[AuthAction] Login validation failed:", validatedFields.error.flatten().fieldErrors);
    return { error: 'Invalid fields submitted.' };
  }

  const { email, password } = validatedFields.data;
  console.log("[AuthAction] Attempting Supabase sign-in for:", email);

  const { error, data } = await supabaseServer.auth.signInWithPassword({
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
  const supabaseServer = require('@/lib/supabase/server').createClient();
  console.log("[AuthAction] signupWithEmail called with:", formData.email);
  const validatedFields = signupSchema.safeParse(formData);
  
  if (!validatedFields.success) {
    console.error("[AuthAction] Signup validation failed:", validatedFields.error.flatten().fieldErrors);
    return { error: 'Invalid fields submitted.' };
  }

  const { email, password } = validatedFields.data;
  const origin = headers().get('origin');
  console.log("[AuthAction] Attempting Supabase signUp for:", email, "with origin:", origin);

  const { data, error } = await supabaseServer.auth.signUp({
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
  
  if (data.session) {
    console.log("[AuthAction] Supabase signUp successful WITH session for:", email, "Redirecting to dashboard.");
    redirect('/dashboard'); 
  }

  if (data.user) {
    console.log("[AuthAction] Supabase signUp successful, user created, email confirmation pending for:", email);
    return { success: true, message: "Account created! Please check your email to verify your account." };
  }
  
  console.error("[AuthAction] Supabase signUp returned no user and no error. This is unexpected.");
  return { error: "An unexpected issue occurred during signup. Please try again." };
}

export async function changePassword(formData: z.infer<typeof changePasswordSchema>): Promise<{ error?: string; success?: boolean }> {
  const supabaseServer = require('@/lib/supabase/server').createClient(); // Use server client for auth operations
  const { data: { user } } = await supabaseServer.auth.getUser();

  if (!user) {
    return { error: "User not authenticated." };
  }

  const validatedFields = changePasswordSchema.safeParse(formData);
  if (!validatedFields.success) {
    console.error("[AuthAction] Change password validation failed:", validatedFields.error.flatten().fieldErrors);
    return { error: 'Invalid fields submitted for password change.' };
  }
  const { currentPassword, newPassword } = validatedFields.data;

  // 1. Attempt to sign in with the current email and the provided "currentPassword"
  // For this re-authentication step, it might be cleaner or necessary to use a client instance temporarily
  // if server-side re-auth flow for an active session is tricky.
  // However, a direct password update on an active session is usually preferred.
  // Let's try to re-verify by signing in:
  // This step is tricky with server client as it relies on cookies.
  // A more direct Supabase approach is to trust the current session and directly update.
  // If strict old password check is needed, a custom flow or client-side pre-check might be better.
  // For now, let's attempt a simpler, direct update.
  // The most secure way for self-serve password change *without* email is to ensure the user *is* logged in.
  // Supabase's updateUser trusts the active session.

  // Re-authenticate by trying to sign in with the old password.
  // This requires a client that can make an independent auth call, not necessarily the server one tied to the request.
  // The Supabase client for browser might be more suitable here if this action is called from client.
  // Since this is a server action, let's use a fresh client instance for this check.
  
  const supabaseTempClient = createClient(); // Using the browser client from lib/supabase/client for this specific re-auth
  const { error: signInError } = await supabaseTempClient.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (signInError) {
    console.warn("[AuthAction] Re-authentication failed for password change:", signInError.message);
    return { error: "Incorrect current password." };
  }
  
  // 2. If re-authentication is successful, update to the new password.
  console.log("[AuthAction] Re-authentication successful. Attempting password update for:", user.email);
  const { error: updateError } = await supabaseServer.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error("[AuthAction] Supabase updateUser (password) error:", updateError.message);
    return { error: `Failed to update password: ${updateError.message}` };
  }

  console.log("[AuthAction] Password updated successfully for:", user.email);
  // It's good practice to sign out other sessions after a password change.
  // await supabaseServer.auth.signOut({ scope: 'others' }); // Optional: sign out other sessions
  return { success: true };
}


export async function logout() {
  const supabaseServer = require('@/lib/supabase/server').createClient();
  console.log("[AuthAction] logout called");
  await supabaseServer.auth.signOut();
  console.log("[AuthAction] Supabase signOut complete, redirecting to /login");
  redirect('/login');
}
