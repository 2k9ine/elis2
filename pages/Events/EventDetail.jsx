import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import Skeleton from '../../components/ui/Skeleton';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Music,
  CheckCircle,
  XCircle,
  MessageCircle,
  Plus,
  Trash2,
  Edit,
  ChevronRight
} from 'lucide-react';
import { EVENT_TYPES } from '../../lib/constants';
import { formatDate } from '../../lib/utils';
import { generateEventMessage, openWhatsApp } from '../../lib/whatsapp';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { success, error: showError } = useToast();

  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEvent();
    loadStudents();
  }, [id]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      const { data: participantsData, error: participantsError } = await supabase
        .from('event_students')
        .select(`
          *,
          students:student_id (*)
        `)
        .eq('event_id', id);

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);
    } catch (err) {
      showError('Failed to load event');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, course, parent_name, parent_phone')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const handleAddParticipant = async (e) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.target);
    const studentId = formData.get('student_id');
    const repertoire = formData.get('repertoire');

    try {
      const { error } = await supabase
        .from('event_students')
        .insert([{
          event_id: id,
          student_id: studentId,
          repertoire
        }]);

      if (error) throw error;

      success('Student added to event');
      setShowAddModal(false);
      loadEvent();
    } catch (err) {
      showError('Failed to add student');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateParticipant = async (participantId, updates) => {
    try {
      const { error } = await supabase
        .from('event_students')
        .update(updates)
        .eq('id', participantId);

      if (error) throw error;
      loadEvent();
    } catch (err) {
      showError('Failed to update participant');
    }
  };

  const handleDeleteParticipant = async (participantId) => {
    if (!confirm('Remove this student from the event?')) return;

    try {
      const { error } = await supabase
        .from('event_students')
        .delete()
        .eq('id', participantId);

      if (error) throw error;
      success('Student removed from event');
      loadEvent();
    } catch (err) {
      showError('Failed to remove student');
    }
  };

  const handleSendWhatsApp = (participant) => {
    const message = generateEventMessage(
      participant.students?.parent_name || 'Parent',
      participant.students?.name,
      event.title,
      formatDate(event.date, 'long'),
      event.time
    );
    openWhatsApp(participant.students?.parent_phone, message);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.target);
    const updates = {
      title: formData.get('title'),
      type: formData.get('type'),
      date: formData.get('date'),
      time: formData.get('time'),
      location: formData.get('location'),
      description: formData.get('description')
    };

    try {
      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      success('Event updated successfully');
      setShowEditModal(false);
      loadEvent();
    } catch (err) {
      showError('Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      success('Event deleted');
      navigate('/events');
    } catch (err) {
      showError('Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8">
        <Skeleton variant="text" className="w-48 h-8 mb-6" />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-4 lg:p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-text-muted">Event not found</p>
            <Button variant="secondary" className="mt-4" onClick={() => navigate('/events')}>
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const confirmedCount = participants.filter(p => p.confirmed).length;
  const availableStudents = students.filter(s => !participants.some(p => p.student_id === s.id));

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">{event.title}</h1>
            <Badge variant="info">
              {EVENT_TYPES.find(t => t.value === event.type)?.label || event.type}
            </Badge>
          </div>
          <p className="text-text-muted mt-2 flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(event.date, 'long')}
            </span>
            {event.time && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {event.time}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.location}
              </span>
            )}
          </p>
        </div>

        {isAdmin() && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowEditModal(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="ghost" onClick={handleDeleteEvent}>
              <Trash2 className="w-4 h-4 text-red-400" />
            </Button>
          </div>
        )}
      </div>

      {/* Description */}
      {event.description && (
        <Card>
          <CardContent className="p-6">
            <p className="text-text-primary whitespace-pre-wrap">{event.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Participants */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            Participants
            <Badge variant="info">{participants.length}</Badge>
          </CardTitle>

          {isAdmin() && availableStudents.length > 0 && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-muted">No students added yet</p>
              {isAdmin() && (
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Student
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg bg-white/5 border border-border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-text-primary">{participant.students?.name}</p>
                      <Badge variant="secondary">{participant.students?.course}</Badge>
                    </div>
                    <p className="text-sm text-text-muted">
                      Parent: {participant.students?.parent_name}
                    </p>
                    {participant.repertoire && (
                      <p className="text-sm text-text-primary mt-1 flex items-center gap-1">
                        <Music className="w-3 h-3" />
                        {participant.repertoire}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Confirmation Toggle */}
                    <button
                      onClick={() => handleUpdateParticipant(participant.id, { confirmed: !participant.confirmed })}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                        participant.confirmed
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-white/5 text-text-muted'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      {participant.confirmed ? 'Confirmed' : 'Confirm'}
                    </button>

                    {/* WhatsApp Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendWhatsApp(participant)}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>

                    {/* Remove Button */}
                    {isAdmin() && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteParticipant(participant.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Participant Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Participant"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="add-participant-form" loading={saving}>
              Add Participant
            </Button>
          </>
        }
      >
        <form id="add-participant-form" onSubmit={handleAddParticipant} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Student *</label>
            <select
              name="student_id"
              required
              className="w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary"
            >
              <option value="">Select Student</option>
              {availableStudents.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.course}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Repertoire (Piece to perform)</label>
            <input
              type="text"
              name="repertoire"
              placeholder="e.g., Für Elise, Havana"
              className="w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </form>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Event"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="edit-event-form" loading={saving}>
              Save Changes
            </Button>
          </>
        }
      >
        <form id="edit-event-form" onSubmit={handleUpdateEvent} className="space-y-4">
          <Input
            label="Event Title *"
            name="title"
            defaultValue={event.title}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Event Type *</label>
            <select
              name="type"
              defaultValue={event.type}
              required
              className="w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary"
            >
              {EVENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date *"
              name="date"
              type="date"
              defaultValue={event.date}
              required
            />
            <Input
              label="Time"
              name="time"
              type="time"
              defaultValue={event.time || ''}
            />
          </div>

          <Input
            label="Location"
            name="location"
            defaultValue={event.location || ''}
            placeholder="e.g., Main Hall"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Description</label>
            <textarea
              name="description"
              rows={4}
              defaultValue={event.description || ''}
              className="w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default EventDetail;
