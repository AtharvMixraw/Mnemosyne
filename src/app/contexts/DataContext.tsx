'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { appCache } from '../../../lib/cache';

interface Profile {
  id: string;
  email: string;
  name: string;
  about: string;
  linkedin: string;
  avatar_url: string;
}

interface Experience {
  id: string;
  heading: string;
  content: string;
  position: string;
  mode: string;
  selected: boolean;
  created_at: string;
  user_id: string;
  profiles?: {
    id: string;
    name: string;
    avatar_url: string;
    about: string;
    linkedin: string;
  };
}

interface DataContextType {
  // Profile
  profile: Profile | null;
  fetchProfile: (userId: string, force?: boolean) => Promise<Profile | null>;
  updateProfileCache: (profile: Profile) => void;
  
  // Experiences
  experiences: Experience[];
  userExperiences: Experience[];
  fetchExperiences: (force?: boolean) => Promise<Experience[]>;
  fetchUserExperiences: (userId: string, force?: boolean) => Promise<Experience[]>;
  updateExperienceCache: (experience: Experience) => void;
  removeExperienceFromCache: (experienceId: string) => void;
  
  // Loading states
  profileLoading: boolean;
  experiencesLoading: boolean;
  
  // Cache management
  clearCache: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [userExperiences, setUserExperiences] = useState<Experience[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [experiencesLoading, setExperiencesLoading] = useState(false);

  // Fetch profile with caching
  const fetchProfile = useCallback(async (userId: string, force = false): Promise<Profile | null> => {
    const cacheKey = `profile_${userId}`;
    
    if (!force) {
      const cached = appCache.getStaleWhileRevalidate<Profile>(cacheKey);
      if (cached.data && !cached.isStale) {
        setProfile(cached.data);
        return cached.data;
      }
      if (cached.data) {
        setProfile(cached.data);
        // Continue to fetch fresh data in background
      }
    }

    try {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      let profileData: Profile;

      if (!data) {
        // Create default profile
        const { data: { user } } = await supabase.auth.getUser();
        profileData = {
          id: userId,
          email: user?.email ?? '',
          name: '',
          about: '',
          linkedin: '',
          avatar_url: ''
        };

        await supabase.from('profiles').insert([profileData]);
      } else {
        profileData = data;
      }

      // Cache the profile
      appCache.set(cacheKey, profileData);
      setProfile(profileData);
      return profileData;

    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Fetch all experiences with caching
  const fetchExperiences = useCallback(async (force = false): Promise<Experience[]> => {
    const cacheKey = 'all_experiences';
    
    if (!force) {
      const cached = appCache.getStaleWhileRevalidate<Experience[]>(cacheKey);
      if (cached.data && !cached.isStale) {
        setExperiences(cached.data);
        return cached.data;
      }
      if (cached.data) {
        setExperiences(cached.data);
        // Continue to fetch fresh data in background
      }
    }

    try {
      setExperiencesLoading(true);
      const { data, error } = await supabase
        .from('interview_experiences')
        .select(`
          *,
          profiles!user_id (
            id,
            name,
            avatar_url,
            about,
            linkedin
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const experiencesData = data as Experience[] || [];
      
      // Cache the experiences
      appCache.set(cacheKey, experiencesData);
      setExperiences(experiencesData);
      return experiencesData;

    } catch (error) {
      console.error('Error fetching experiences:', error);
      return [];
    } finally {
      setExperiencesLoading(false);
    }
  }, []);

  // Fetch user-specific experiences
  const fetchUserExperiences = useCallback(async (userId: string, force = false): Promise<Experience[]> => {
    const cacheKey = `user_experiences_${userId}`;
    
    if (!force) {
      const cached = appCache.getStaleWhileRevalidate<Experience[]>(cacheKey);
      if (cached.data && !cached.isStale) {
        setUserExperiences(cached.data);
        return cached.data;
      }
      if (cached.data) {
        setUserExperiences(cached.data);
      }
    }

    try {
      const { data, error } = await supabase
        .from('interview_experiences')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userExperiencesData = data as Experience[] || [];
      
      // Cache the user experiences
      appCache.set(cacheKey, userExperiencesData);
      setUserExperiences(userExperiencesData);
      return userExperiencesData;

    } catch (error) {
      console.error('Error fetching user experiences:', error);
      return [];
    }
  }, []);

  // Update profile cache
  const updateProfileCache = useCallback((newProfile: Profile) => {
    const cacheKey = `profile_${newProfile.id}`;
    appCache.set(cacheKey, newProfile);
    setProfile(newProfile);
  }, []);

  // Update experience cache
  const updateExperienceCache = useCallback((experience: Experience) => {
    // Update all experiences cache
    const allExperiences = appCache.get<Experience[]>('all_experiences') || [];
    const updatedAllExperiences = allExperiences.map((exp) => 
      exp.id === experience.id ? experience : exp
    ) as Experience[];
    
    if (!allExperiences.find((exp) => exp.id === experience.id)) {
      updatedAllExperiences.unshift(experience);
    }
    
    appCache.set('all_experiences', updatedAllExperiences);
    setExperiences(updatedAllExperiences);

    // Update user experiences cache if applicable
    const userExperiences = appCache.get<Experience[]>(`user_experiences_${experience.user_id}`) || [];
    const updatedUserExperiences = userExperiences.map((exp) => 
      exp.id === experience.id ? experience : exp
    ) as Experience[];
    
    if (!userExperiences.find((exp: { id: string; }) => exp.id === experience.id)) {
      updatedUserExperiences.unshift(experience);
    }
    
    appCache.set(`user_experiences_${experience.user_id}`, updatedUserExperiences);
    setUserExperiences(updatedUserExperiences);
  }, []);

  // Remove experience from cache
  const removeExperienceFromCache = useCallback(async (experienceId: string) => {
    // Remove from all experiences
    const allExperiences = appCache.get<Experience[]>('all_experiences') || [];
    const updatedAllExperiences = allExperiences.filter((exp: { id: string; }) => exp.id !== experienceId);
    appCache.set('all_experiences', updatedAllExperiences);
    setExperiences(updatedAllExperiences);

    // Remove from user experiences (we need to check all user caches or use the current user)
    const currentUserExperiences = userExperiences.filter((exp) => exp.id !== experienceId) as Experience[];
    setUserExperiences(currentUserExperiences);
    
    // Update cache for current user
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      appCache.set(`user_experiences_${session.user.id}`, currentUserExperiences);
    }
  }, [userExperiences]);

  // Clear all cache
  const clearCache = useCallback(() => {
    appCache.clear();
    setProfile(null);
    setExperiences([]);
    setUserExperiences([]);
  }, []);

  const value: DataContextType = {
    profile,
    fetchProfile,
    updateProfileCache,
    experiences,
    userExperiences,
    fetchExperiences,
    fetchUserExperiences,
    updateExperienceCache,
    removeExperienceFromCache,
    profileLoading,
    experiencesLoading,
    clearCache,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

