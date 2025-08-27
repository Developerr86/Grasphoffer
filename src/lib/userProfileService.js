import { supabase } from './supabase';

/**
 * User Profile Service
 * Handles reading/updating public.user_profiles for the current user
 */

export const getUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, email, full_name, created_at, updated_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data; // may be null if row not created yet
};

export const updateFullName = async (fullName) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Upsert so we handle first-time users where the trigger didn't run yet
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })
    .select('id, email, full_name')
    .single();

  if (error) throw error;
  return data;
};

export const getDisplayName = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    const profile = await getUserProfile();
    if (profile && profile.full_name && profile.full_name.trim() !== '') {
      return profile.full_name;
    }
  } catch (e) {
    // fall back to email on any error
  }
  return user.email;
};

