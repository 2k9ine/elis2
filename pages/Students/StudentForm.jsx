import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Music,
  Award,
  DollarSign,
  FileText,
  Upload,
  Save,
  Loader2
} from 'lucide-react';
import { COURSES, LEVELS, TRINITY_GRADES, NATIONALITIES } from '../../lib/constants';
import { useTeachers } from '../../hooks/useTeachers';
import { supabase } from '../../lib/supabase';

function StudentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { success, error: showError } = useToast();
  const { teachers } = useTeachers();

  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    dob: '',
    nationality: '',
    enrolled_date: new Date().toISOString().split('T')[0],
    course: '',
    teacher_id: '',
    level: 'beginner',
    trinity_grade_current: '',
    monthly_fee: '',
    discount_percent: '0',
    notes: '',
    photo_url: '',
    active: true
  });

  // Load student data if editing
  useEffect(() => {
    if (isEditMode) {
      loadStudent();
    }
  }, [id]);

  const loadStudent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          ...data,
          dob: data.dob || '',
          discount_percent: data.discount_percent?.toString() || '0',
          monthly_fee: data.monthly_fee?.toString() || ''
        });
      }
    } catch (err) {
      showError('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `students/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('student-photos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, photo_url: publicUrl }));
      success('Photo uploaded successfully');
    } catch (err) {
      showError('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        monthly_fee: parseFloat(formData.monthly_fee) || 0,
        discount_percent: parseFloat(formData.discount_percent) || 0
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('students')
          .update(payload)
          .eq('id', id);

        if (error) throw error;
        success('Student updated successfully');
      } else {
        const { data, error } = await supabase
          .from('students')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        success('Student added successfully');
        navigate(`/students/${data.id}`);
        return;
      }

      navigate('/students');
    } catch (err) {
      showError(err.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin()) {
    return (
      <div className="p-4 lg:p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-text-muted">Only administrators can add or edit students.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {isEditMode ? 'Edit Student' : 'Add New Student'}
          </h1>
          <p className="text-text-muted">
            {isEditMode ? 'Update student information.' : 'Register a new student to Eli\'s Learning.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-brand-400" />
              Profile Photo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar
                src={formData.photo_url}
                name={formData.name || 'New Student'}
                size="2xl"
              />
              <div className="space-y-2">
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    loading={uploadingPhoto}
                    disabled={uploadingPhoto}
                    as="span"
                  >
                    {formData.photo_url ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                </label>
                <p className="text-sm text-text-muted">
                  Recommended: Square image, at least 200x200px
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-brand-400" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Student's full name"
              />

              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g., +971 50 123 4567"
              />

              <Input
                label="Date of Birth"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">Nationality</label>
                <select
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary"
                >
                  <option value="">Select Nationality</option>
                  {NATIONALITIES.map(nat => (
                    <option key={nat} value={nat}>{nat}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Enrollment Date *"
                name="enrolled_date"
                type="date"
                value={formData.enrolled_date}
                onChange={handleChange}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Parent/Guardian Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-brand-400" />
              Parent/Guardian Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Parent/Guardian Name"
                name="parent_name"
                value={formData.parent_name}
                onChange={handleChange}
                placeholder="Parent's full name"
              />

              <Input
                label="Parent Phone *"
                name="parent_phone"
                value={formData.parent_phone}
                onChange={handleChange}
                required
                placeholder="e.g., +971 50 123 4567"
              />

              <Input
                label="Parent Email"
                name="parent_email"
                type="email"
                value={formData.parent_email}
                onChange={handleChange}
                placeholder="parent@email.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Course Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-brand-400" />
              Course Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">Course *</label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary"
                >
                  <option value="">Select Course</option>
                  {COURSES.map(course => (
                    <option key={course.value} value={course.value}>{course.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">Assigned Teacher *</label>
                <select
                  name="teacher_id"
                  value={formData.teacher_id}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">Level</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary"
                >
                  {LEVELS.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-primary">Current Trinity Grade</label>
                <select
                  name="trinity_grade_current"
                  value={formData.trinity_grade_current}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary"
                >
                  <option value="">Not Started</option>
                  {TRINITY_GRADES.map(grade => (
                    <option key={grade.value} value={grade.value}>{grade.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fee Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-brand-400" />
              Fee Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Monthly Fee (AED) *"
                name="monthly_fee"
                type="number"
                value={formData.monthly_fee}
                onChange={handleChange}
                required
                min="0"
                placeholder="e.g., 500"
              />

              <Input
                label="Discount %"
                name="discount_percent"
                type="number"
                value={formData.discount_percent}
                onChange={handleChange}
                min="0"
                max="100"
                placeholder="e.g., 10"
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="active"
                  id="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-border bg-white/5 text-brand-500 focus:ring-brand-500"
                />
                <label htmlFor="active" className="text-text-primary">Active Student</label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-400" />
              Additional Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Any additional information about the student..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            loading={saving}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isEditMode ? 'Save Changes' : 'Add Student'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/students')}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default StudentForm;
