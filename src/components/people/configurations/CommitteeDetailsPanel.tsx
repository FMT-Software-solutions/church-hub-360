import {
  Calendar,
  Check,
  Clock,
  Edit2,
  Plus,
  Settings,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type {
  Committee,
  CommitteePosition,
} from '../../../types/people-configurations';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface CommitteeDetailsPanelProps {
  selectedCommittee: string | null;
  selectedCommitteeData: Committee | null;

  onUpdateCommittee: (committeeId: string, updates: Partial<Committee>) => void;
}

export function CommitteeDetailsPanel({
  selectedCommittee,
  selectedCommitteeData,

  onUpdateCommittee,
}: CommitteeDetailsPanelProps) {
  const [isAddingPosition, setIsAddingPosition] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(
    null
  );
  const [newPositionName, setNewPositionName] = useState('');
  const [editPositionName, setEditPositionName] = useState('');
  if (!selectedCommitteeData || !selectedCommittee) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a committee to view and manage its details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const generatePositionId = () => {
    return `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleAddPosition = () => {
    if (newPositionName.trim() && selectedCommitteeData) {
      const newPosition: CommitteePosition = {
        id: generatePositionId(),
        name: newPositionName.trim(),
        display_order: selectedCommitteeData.positions.length,
      };

      const updatedPositions = [
        ...selectedCommitteeData.positions,
        newPosition,
      ];
      onUpdateCommittee(selectedCommittee!, { positions: updatedPositions });
      setNewPositionName('');
      setIsAddingPosition(false);
    }
  };

  const handleEditPosition = (positionId: string) => {
    const position = selectedCommitteeData?.positions.find(
      (p) => p.id === positionId
    );
    if (position) {
      setEditPositionName(position.name);
      setEditingPositionId(positionId);
    }
  };

  const handleSaveEditPosition = () => {
    if (editPositionName.trim() && editingPositionId && selectedCommitteeData) {
      const updatedPositions = selectedCommitteeData.positions.map((position) =>
        position.id === editingPositionId
          ? { ...position, name: editPositionName.trim() }
          : position
      );

      onUpdateCommittee(selectedCommittee!, { positions: updatedPositions });
      setEditingPositionId(null);
      setEditPositionName('');
    }
  };

  const handleDeletePosition = (positionId: string) => {
    if (selectedCommitteeData) {
      const updatedPositions = selectedCommitteeData.positions.filter(
        (position) => position.id !== positionId
      );
      onUpdateCommittee(selectedCommittee!, { positions: updatedPositions });
    }
  };

  const handleCancelAdd = () => {
    setIsAddingPosition(false);
    setNewPositionName('');
  };

  const handleCancelEdit = () => {
    setEditingPositionId(null);
    setEditPositionName('');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedCommitteeData.name}
              {!selectedCommitteeData.is_active && (
                <Badge variant="outline" className="text-xs">
                  Inactive
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {selectedCommitteeData.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Committee Positions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Committee Positions</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddingPosition(true)}
                disabled={isAddingPosition}
                className="h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Position
              </Button>
            </div>

            <div>
              {/* Add Position Input */}
              {isAddingPosition && (
                <div className="flex items-center gap-2 p-2 border border-dashed rounded-lg">
                  <Input
                    value={newPositionName}
                    onChange={(e) => setNewPositionName(e.target.value)}
                    placeholder="e.g., Chairperson, Secretary, Treasurer"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPosition();
                      } else if (e.key === 'Escape') {
                        handleCancelAdd();
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddPosition}
                    disabled={!newPositionName.trim()}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelAdd}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Existing Positions */}
              {selectedCommitteeData.positions.length === 0 &&
              !isAddingPosition ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No positions defined. Click "Add Position" to create committee
                  roles.
                </div>
              ) : (
                selectedCommitteeData.positions.map((position) => (
                  <div
                    key={position.id}
                    className="flex items-center gap-2 p-2 border rounded-lg my-2"
                  >
                    {editingPositionId === position.id ? (
                      <>
                        <Input
                          value={editPositionName}
                          onChange={(e) => setEditPositionName(e.target.value)}
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEditPosition();
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveEditPosition}
                          disabled={!editPositionName.trim()}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium">
                          {position.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPosition(position.id)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePosition(position.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Committee Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            {selectedCommitteeData.created_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Created Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedCommitteeData.created_date)}
                  </p>
                </div>
              </div>
            )}

            {selectedCommitteeData.end_date && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">End Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedCommitteeData.end_date)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge
                variant={
                  selectedCommitteeData.is_active ? 'default' : 'secondary'
                }
                className="text-xs"
              >
                {selectedCommitteeData.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
