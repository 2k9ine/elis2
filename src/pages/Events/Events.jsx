import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents, useEventStats } from '../../hooks/useEvents';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  Calendar,
  Plus,
  Users,
  Music,
  Award,
  ChevronRight
} from 'lucide-react';
import { EVENT_TYPES } from '../../lib/constants';
import { formatDate } from '../../lib/utils';

function Events() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const { events, loading, createEvent, upcoming: upcomingEvents } = useEvents({ upcoming: true });
  const { stats } = useEventStats();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const columns = [
    {
      key: 'title',
      title: 'Event',
      render: (value, row) => (
        <div>
          <p className="font-medium text-text-primary">{value}</p>
          <p className="text-sm text-text-muted">{row.description?.substring(0, 50)}...</p>
        </div>
      )
    },
    {
      key: 'type',
      title: 'Type',
      render: (value) => (
        <Badge variant="info">
          {EVENT_TYPES.find(t => t.value === value)?.label || value}
        </Badge>
      )
    },
    {
      key: 'date',
      title: 'Date',
      render: (value) => formatDate(value, 'long')
    },
    {
      key: 'actions',
      title: '',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/events/${row.id}`)}
        >
          Manage
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const eventData = {
      title: formData.get('title'),
      type: formData.get('type'),
      date: formData.get('date'),
      description: formData.get('description')
    };

    const { data, error } = await createEvent(eventData);
    if (error) {
      showError('Failed to create event');
    } else {
      success('Event created successfully');
      setModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Events & Recitals</h1>
          <p className="text-text-muted">Manage school events, recitals, and performances.</p>
        </div>

        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-text-muted">Total Events</p>
            <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-text-muted">Upcoming</p>
            <p className="text-2xl font-bold text-green-400">{stats.upcoming}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-text-muted">Recitals</p>
            <p className="text-2xl font-bold text-purple-400">{stats.byType?.recital || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-text-muted">Workshops</p>
            <p className="text-2xl font-bold text-blue-400">{stats.byType?.workshop || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-400" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.slice(0, 6).map(event => (
                <div
                  key={event.id}
                  className="p-4 rounded-lg bg-white/5 border border-border hover:border-brand-500/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-text-primary">{event.title}</p>
                      <p className="text-sm text-text-muted mt-1">
                        {formatDate(event.date, 'long')}
                      </p>
                    </div>
                    <Badge variant="info">
                      {EVENT_TYPES.find(t => t.value === event.type)?.label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Events */}
      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={events}
            loading={loading}
            emptyMessage="No events found"
          />
        </CardContent>
      </Card>

      {/* Create Event Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Event"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="event-form">Create</Button>
          </>
        }
      >
        <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Event Title"
            name="title"
            required
            placeholder="e.g., Annual Concert 2024"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Event Type</label>
            <select
              name="type"
              required
              className="w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm"
            >
              {EVENT_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <Input
            label="Date"
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Description</label>
            <textarea
              name="description"
              rows={4}
              className="w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm"
              placeholder="Event description..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default Events;
