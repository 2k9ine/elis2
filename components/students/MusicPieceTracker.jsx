import { useState } from 'react';
import { useMusicPieces } from '../../hooks/useStudents';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { Input } from '../ui/Input';
import {
  Music,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { PIECE_STATUS_CONFIG } from '../../lib/constants';
import { formatDate } from '../../lib/utils';

function MusicPieceTracker({ studentId }) {
  const { pieces, loading, addPiece, updatePiece } = useMusicPieces(studentId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPiece, setEditingPiece] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const pieceData = {
      piece_name: formData.get('piece_name'),
      date_started: formData.get('date_started'),
      status: formData.get('status'),
      teacher_notes: formData.get('teacher_notes')
    };

    if (editingPiece) {
      await updatePiece(editingPiece.id, pieceData);
    } else {
      await addPiece(pieceData);
    }

    setModalOpen(false);
    setEditingPiece(null);
  };

  const handleComplete = async (piece) => {
    await updatePiece(piece.id, {
      ...piece,
      status: 'completed',
      date_completed: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-text-primary">Music Piece Progress</h2>
        <Button
          onClick={() => {
            setEditingPiece(null);
            setModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Piece
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-lg animate-pulse" />)}</div>
      ) : pieces.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Music className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">No music pieces recorded yet.</p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => {
                setEditingPiece(null);
                setModalOpen(true);
              }}
            >
              Add First Piece
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pieces.map((piece) => (
            <Card key={piece.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-text-primary text-lg">{piece.piece_name}</h3>
                      <Badge variant={
                        { blue: 'primary', green: 'success', orange: 'warning' }[PIECE_STATUS_CONFIG[piece.status]?.color] || 'default'
                      }>
                        {PIECE_STATUS_CONFIG[piece.status]?.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-text-muted">
                      <span>Started: {formatDate(piece.date_started, 'short')}</span>
                      {piece.date_completed && (
                        <span>Completed: {formatDate(piece.date_completed, 'short')}</span>
                      )}
                    </div>

                    {piece.teacher_notes && (
                      <p className="mt-2 text-sm text-text-muted">{piece.teacher_notes}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {piece.status === 'in-progress' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleComplete(piece)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingPiece(piece);
                        setModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPiece(null);
        }}
        title={editingPiece ? 'Edit Music Piece' : 'Add Music Piece'}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setModalOpen(false);
                setEditingPiece(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="piece-form">
              {editingPiece ? 'Update' : 'Add'}
            </Button>
          </>
        }
      >
        <form id="piece-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Piece Name"
            name="piece_name"
            defaultValue={editingPiece?.piece_name}
            required
            placeholder="e.g., Fur Elise, Havana, Ode to Joy"
          />

          <Input
            label="Date Started"
            name="date_started"
            type="date"
            defaultValue={editingPiece?.date_started || new Date().toISOString().split('T')[0]}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Status</label>
            <select
              name="status"
              defaultValue={editingPiece?.status || 'in-progress'}
              className="w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm"
            >
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="needs-review">Needs Review</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary">Teacher Notes</label>
            <textarea
              name="teacher_notes"
              defaultValue={editingPiece?.teacher_notes}
              placeholder="Add notes about progress..."
              className="w-full bg-white/5 border border-border rounded-md px-3 py-2.5 text-sm min-h-[100px]"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default MusicPieceTracker;
