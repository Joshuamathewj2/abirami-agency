'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/db';

export async function registerUserAction(formData: FormData) {
  const fullName = formData.get('fullName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!fullName || !email || !password || !confirmPassword) {
    return { success: false, error: 'All fields are required.' };
  }

  if (password !== confirmPassword) {
    return { success: false, error: 'Passwords do not match.' };
  }

  try {
    const supabase = await createClient();
    
    // Sign up the user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }
    
    if (!data.user) {
      return { success: false, error: 'Signup failed to return user data.' };
    }

    // Determine user role
    const adminEmails = process.env.ADMIN_EMAILS 
      ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
      : ['admin@abirami.agency', 'admin@example.com', 'admin@abiramiagency.com', 'parryware@abirami.agency', 'joshuamathewj2@gmail.com'];
      
    const role = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'customer';

    // Insert user profile into 'profiles' table using supabaseAdmin (bypassing RLS)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: data.user.id,
        full_name: fullName,
        email: email,
        role: role,
        created_at: new Date().toISOString(),
        phone: null
      });

    if (profileError) {
      console.error('Failed to create profile row in db:', profileError);
      // If profile insert failed, it might be because the row already exists or another schema constraint.
      // But auth.user was created successfully.
    }

    return { success: true };
  } catch (err: any) {
    console.error('Registration failed:', err);
    return { success: false, error: err.message || 'An error occurred during registration.' };
  }
}

export async function getUserRoleAction(userId: string) {
  try {
    const { error, data } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (error || !data) {
      return { success: false, role: 'customer' };
    }
    return { success: true, role: data.role };
  } catch (err) {
    console.error('Error fetching role:', err);
    return { success: false, role: 'customer' };
  }
}
