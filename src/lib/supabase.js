import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'your-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Auth helper functions
export const auth = {
  // Sign in with email/password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Listen for auth changes
  onAuthChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Get current user
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  }
};

// Database helper functions with error handling
export const db = {
  // Generic fetch with error handling
  fetch: async (table, options = {}) => {
    try {
      let query = supabase.from(table).select(options.select || '*');

      if (options.eq) {
        query = query.eq(options.eq.column, options.eq.value);
      }

      if (options.in) {
        query = query.in(options.in.column, options.in.values);
      }

      if (options.order) {
        query = query.order(options.order.column, {
          ascending: options.order.ascending ?? true
        });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.range) {
        query = query.range(options.range.from, options.range.to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error(`Error fetching from ${table}:`, error);
      return { data: null, error };
    }
  },

  // Insert with error handling
  insert: async (table, payload) => {
    try {
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error(`Error inserting into ${table}:`, error);
      return { data: null, error };
    }
  },

  // Update with error handling
  update: async (table, id, payload) => {
    try {
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error(`Error updating ${table}:`, error);
      return { data: null, error };
    }
  },

  // Delete with error handling
  remove: async (table, id) => {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      return { success: false, error };
    }
  },

  // Realtime subscription
  subscribe: (table, callback, filter = null) => {
    const subscription = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...(filter && { filter: `${filter.column}=eq.${filter.value}` })
        },
        callback
      )
      .subscribe();

    return subscription;
  },

  // Unsubscribe from realtime
  unsubscribe: (subscription) => {
    subscription.unsubscribe();
  }
};

// Storage helper functions
export const storage = {
  // Upload file
  upload: async (bucket, path, file) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return { url: publicUrl, error: null };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { url: null, error };
    }
  },

  // Delete file
  remove: async (bucket, path) => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('Error removing file:', error);
      return { success: false, error };
    }
  }
};

export default supabase;
