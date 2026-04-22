import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudents } from '../../hooks/useStudents';
import { useTeachers } from '../../hooks/useTeachers';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, Pagination } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Phone,
  Mail
} from 'lucide-react';
import { COURSES, LEVELS, TRINITY_GRADES, FEE_STATUS_CONFIG } from '../../lib/constants';
import { formatPhone } from '../../lib/utils';
import CSVImport from '../../components/students/CSVImport';

function StudentList() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { teachers } = useTeachers();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    course: '',
    teacher_id: '',
    level: '',
    fee_status: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState({ column: 'name', ascending: true });
  // page state lives inside the hook – use pagination.setPage

  const { students, loading, pagination, refetch } = useStudents({
    search,
    filters: Object.keys(filters).some(k => filters[k]) ? filters : undefined,
    sort
  });

  const handleSort = (column, direction) => {
    setSort({ column, ascending: direction === 'asc' });
  };

  const columns = [
    {
      key: 'name',
      title: 'Student',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={row.photo_url}
            name={value}
            size="sm"
          />
          <div>
            <p className="font-medium text-text-primary">{value}</p>
            <p className="text-sm text-text-muted">{row.course}</p>
          </div>
        </div>
      )
    },
    {
      key: 'teachers',
      title: 'Teacher',
      render: (value) => value?.name || '-'
    },
    {
      key: 'level',
      title: 'Level',
      sortable: true,
      render: (value) => {
        const level = LEVELS.find(l => l.value === value);
        return level ? (
          <Badge variant={level.color === 'green' ? 'success' : level.color === 'purple' ? 'purple' : 'primary'}>
            {level.label}
          </Badge>
        ) : '-';
      }
    },
    {
      key: 'parent_phone',
      title: 'Contact',
      render: (value, row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm text-text-muted">
            <Phone className="w-3 h-3" />
            {formatPhone(value)}
          </div>
          {row.parent_email && (
            <div className="flex items-center gap-1 text-sm text-text-muted">
              <Mail className="w-3 h-3" />
              {row.parent_email}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'trinity_grade_current',
      title: 'Trinity',
      render: (value) => value ? (
        <Badge variant="info">{TRINITY_GRADES.find(g => g.value === value)?.label || value}</Badge>
      ) : (
        <span className="text-text-muted">-</span>
      )
    },
    {
      key: 'actions',
      title: '',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/students/${row.id}`)}
          >
            View
          </Button>
          {isAdmin() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/students/${row.id}/edit`);
              }}
            >
              Edit
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Students</h1>
          <p className="text-text-muted">
            Manage student records and view their progress.
          </p>
        </div>

        <div className="flex gap-2">
          {isAdmin() && (
            <CSVImport onImportComplete={refetch} />
          )}
          <Button onClick={() => navigate('/students/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by name, phone, or parent..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-border rounded-md pl-10 pr-4 py-2 text-sm text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
              <Select
                placeholder="Filter by Course"
                value={filters.course}
                onChange={(e) => setFilters({ ...filters, course: e.target.value })}
                options={[{ value: '', label: 'All Courses' }, ...COURSES]}
              />

              {isAdmin() && (
                <Select
                  placeholder="Filter by Teacher"
                  value={filters.teacher_id}
                  onChange={(e) => setFilters({ ...filters, teacher_id: e.target.value })}
                  options={[
                    { value: '', label: 'All Teachers' },
                    ...teachers.map(t => ({ value: t.id, label: t.name }))
                  ]}
                />
              )}

              <Select
                placeholder="Filter by Level"
                value={filters.level}
                onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                options={[{ value: '', label: 'All Levels' }, ...LEVELS]}
              />

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setFilters({ course: '', teacher_id: '', level: '', fee_status: '' });
                    setSearch('');
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={students}
            loading={loading}
            sortable={true}
            onSort={handleSort}
            sortColumn={sort.column}
            sortDirection={sort.ascending ? 'asc' : 'desc'}
            onRowClick={(row) => navigate(`/students/${row.id}`)}
            emptyMessage="No students found matching your criteria"
          />

          {pagination.total > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={Math.ceil(pagination.total / pagination.perPage)}
              onPageChange={pagination.setPage}
              totalItems={pagination.total}
              itemsPerPage={pagination.perPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default StudentList;
