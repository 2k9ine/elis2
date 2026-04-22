import { useState, useEffect, useCallback } from 'react';
import { supabase, db } from '../lib/supabase';

/**
 * Hook for events and recitals
 */
export function useEvents(options = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { upcoming, past } = options;

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('events')
        .select('*')
        .order('date', { ascending: upcoming ? true : false });

      // Filter by date
      const today = new Date().toISOString().split('T')[0];
      if (upcoming) {
        query = query.gte('date', today);
      } else if (past) {
        query = query.lt('date', today);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [upcoming, past]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Create event
  const createEvent = async (eventData) => {
    const { data, error } = await db.insert('events', eventData);
    if (!error) await fetchEvents();
    return { data, error };
  };

  // Update event
  const updateEvent = async (id, updates) => {
    const { data, error } = await db.update('events', id, updates);
    if (!error) await fetchEvents();
    return { data, error };
  };

  // Delete event
  const deleteEvent = async (id) => {
    const { success, error } = await db.remove('events', id);
    if (success) await fetchEvents();
    return { success, error };
  };

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent
  };
}

/**
 * Hook for event participants
 */
export function useEventParticipants(eventId) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchParticipants = useCallback(async () => {
    if (!eventId) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('event_students')
        .select(`
          *,
          students(id, name, course, level, parent_name, parent_phone)
        `)
        .eq('event_id', eventId)
        .order('created_at');

      if (fetchError) throw fetchError;

      setParticipants(data || []);
    } catch (err) {
      console.error('Error fetching event participants:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Add participant
  const addParticipant = async (studentId, repertoire = '') => {
    const { data, error } = await db.insert('event_students', {
      event_id: eventId,
      student_id: studentId,
      repertoire,
      confirmed: false
    });
    if (!error) await fetchParticipants();
    return { data, error };
  };

  // Update participant
  const updateParticipant = async (id, updates) => {
    const { data, error } = await db.update('event_students', id, updates);
    if (!error) await fetchParticipants();
    return { data, error };
  };

  // Remove participant
  const removeParticipant = async (id) => {
    const { success, error } = await db.remove('event_students', id);
    if (success) await fetchParticipants();
    return { success, error };
  };

  // Confirm attendance
  const confirmAttendance = async (id) => {
    return updateParticipant(id, { confirmed: true });
  };

  return {
    participants,
    loading,
    error,
    refetch: fetchParticipants,
    addParticipant,
    updateParticipant,
    removeParticipant,
    confirmAttendance
  };
}

/**
 * Hook for event statistics
 */
export function useEventStats() {
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    byType: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*');

      if (fetchError) throw fetchError;

      const today = new Date().toISOString().split('T')[0];
      const events = data || [];

      // Count by type
      const byType = {};
      events.forEach(event => {
        byType[event.type] = (byType[event.type] || 0) + 1;
      });

      setStats({
        total: events.length,
        upcoming: events.filter(e => e.date >= today).length,
        byType
      });
    } catch (err) {
      console.error('Error fetching event stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { ...stats, loading, error, refetch: fetchStats };
}
