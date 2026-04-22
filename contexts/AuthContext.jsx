import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, auth } from '../lib/supabase';
import { ROLES } from '../lib/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load role + profile from user_roles table.
   * This mirrors is_admin() and get_teacher_id() RLS functions exactly.
   *
   * One-time Supabase setup:
   *   Admin:   INSERT INTO user_roles (user_id, role) VALUES ('<uid>', 'admin');
   *   Teacher: INSERT INTO user_roles (user_id, role, teacher_id)
   *              VALUES ('<uid>', 'teacher', '<teachers.id>');
   */
  const loadUserProfile = useCallback(async (userId) => {
    try {
      // Check user_roles table (same source the RLS policies use)
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role, teacher_id')
        .eq('user_id', userId)
        .single();

      if (roleRow?.role === ROLES.ADMIN) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setProfile({
          id: userId,
          name: authUser?.user_metadata?.name || authUser?.email || 'Admin',
          email: authUser?.email,
          role: ROLES.ADMIN,
          type: 'admin'
        });
        return;
      }

      if (roleRow?.role === ROLES.TEACHER && roleRow.teacher_id) {
        const { data: teacher } = await supabase
          .from('teachers')
          .select('*')
          .eq('id', roleRow.teacher_id)
          .single();

        if (teacher) {
          setProfile({ ...teacher, role: ROLES.TEACHER, type: 'teacher' });
          return;
        }
      }

      // Fallback: direct teachers table lookup (handles legacy setups)
      const { data: teacher } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (teacher) {
        setProfile({ ...teacher, role: ROLES.TEACHER, type: 'teacher' });
        return;
      }

      console.warn('No role found for user', userId, '— see SETUP.md');
      setProfile(null);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const { session } = await auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = auth.onAuthChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  const signIn = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const { data, error: signInError } = await auth.signIn(email, password);
      if (signInError) throw signInError;
      if (data?.user) {
        setUser(data.user);
        await loadUserProfile(data.user.id);
      }
      return { success: true, error: null };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await auth.signOut();
      setUser(null);
      setProfile(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => profile?.role === ROLES.ADMIN;
  const isTeacher = () => profile?.role === ROLES.TEACHER;
  const getTeacherId = () => (profile?.type === 'teacher' ? profile.id : null);
  const canAccessStudent = (studentTeacherId) => {
    if (isAdmin()) return true;
    if (isTeacher()) return studentTeacherId === getTeacherId();
    return false;
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading, error,
      signIn, signOut,
      isAdmin, isTeacher, getTeacherId, canAccessStudent,
      isAuthenticated: !!user && !!profile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export default AuthContext;
