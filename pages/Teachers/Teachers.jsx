import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeachers } from '../../hooks/useTeachers';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Avatar from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import {
  Users,
  GraduationCap,
  Plus,
  Mail,
  Phone,
  Edit,
  Trash2,
  BookOpen
} from 'lucide-react';
import { COURSES } from '../../lib/constants';
import { formatPhone } from '../../lib/utils';

function Teachers() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { teachers, loading, createTeacher, updateTeacher, deleteTeacher } = useTeachers();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTeacher, setDeletingTeacher] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const teacherData = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      specialization: formData.get('specialization'),
      joined_date: formData.get('joined_date')
    };

    if (editingTeacher) {
      const { error } = await updateTeacher(editingTeacher.id, teacherData);
      if (error) {
        showError('Failed to update teacher');
      } else {
        success('Teacher updated successfully');
        setModalOpen(false);
        setEditingTeacher(null);
      }
    } else {
      const { error } = await createTeacher(teacherData);
      if (error) {
        showError('Failed to create teacher');
      } else {
        success('Teacher created successfully');
        setModalOpen(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!deletingTeacher) return;

    const { success: deleted, error } = await deleteTeacher(deletingTeacher.id);
    if (error) {
      showError('Failed to delete teacher');
    } else {
      success('Teacher deleted successfully');
      setDeleteModalOpen(false);
      setDeletingTeacher(null);
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'Teacher',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={row.photo_url}
            name={value}
            size="sm"
          />
          <div>
            <p className="font-medium text-text-primary">{value}</p>
            <p className="text-sm text-text-muted">{row.specialization}</p>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      title: 'Contact',
      render: (value, row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Mail className="w-4 h-4" />
            {value}
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Phone className="w-4 h-4" />
            {formatPhone(row.phone)}
          </div>
        </div>
      )
    },
    {
      key: 'student_count',
      title: 'Students',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-text-muted" />
          <span>{value || 0}</span>
        </div>
      )
    },
    {
      key: 'joined_date',
      title: 'Joined',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      title: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/teachers/${row.id}`)}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingTeacher(row);
              setModalOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300"
            onClick={() => {
              setDeletingTeacher(row);
              setDeleteModalOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Teachers</h1>
          <p className="text-text-muted">Manage teachers and their assignments.</p>
        </div>

        <Button
          onClick={() => {
            setEditingTeacher(null);
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Teacher
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Teachers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={teachers}
            loading={loading}
            emptyMessage="No teachers found"
          />
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTeacher(null);
        }}
        title={editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setEditingTeacher(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="teacher-form">
              {editingTeacher ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <form id="teacher-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            name="name"
            defaultValue={editingTeacher?.name}
            required
          />

          <Input
            label="Email"
            name="email"
            type="email"
            defaultValue={editingTeacher?.email}
            required
          />

          <Input
            label="Phone"
            name="phone"
            defaultValue={editingTeacher?.phone}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Specialization</label>
            <select
              name="specialization"
              defaultValue={editingTeacher?.specialization}
              required
              className="w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm"
            >
              <option value="">Select Specialization</option>
              {COURSES.map(course => (
                <option key={course.value} value={course.label}>{course.label}</option>
              ))}
            </select>
          </div>

          <Input
            label="Joined Date"
            name="joined_date"
            type="date"
            defaultValue={editingTeacher?.joined_date}
            required
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingTeacher(null);
        }}
        title="Delete Teacher"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeletingTeacher(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-text-primary">
          Are you sure you want to delete {deletingTeacher?.name}? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

export default Teachers;
