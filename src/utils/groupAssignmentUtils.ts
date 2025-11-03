import type { GroupAssignment } from '@/components/people/groups';

export interface GroupAssignmentChange {
  groupId: string;
  action: 'add' | 'delete' | 'update';
  position?: string;
  assignmentId?: string;
}

export interface GroupAssignmentComparison {
  changes: GroupAssignmentChange[];
  hasChanges: boolean;
}

/**
 * Compare current group assignments with new assignments to determine changes
 */
export function compareGroupAssignments(
  currentAssignments: Array<{
    id: string;
    group_id: string;
    position: string | null;
  }>,
  newAssignments: GroupAssignment[]
): GroupAssignmentComparison {
  const changes: GroupAssignmentChange[] = [];

  // Create maps for easier lookup
  const currentMap = new Map(
    currentAssignments.map(assignment => [
      assignment.group_id,
      { id: assignment.id, position: assignment.position }
    ])
  );
  
  const newMap = new Map(
    newAssignments.map(assignment => [
      assignment.groupId,
      { position: assignment.position || null }
    ])
  );

  // Find deletions (in current but not in new)
  for (const [groupId, current] of currentMap) {
    if (!newMap.has(groupId)) {
      changes.push({
        groupId,
        action: 'delete',
        assignmentId: current.id,
      });
    }
  }

  // Find additions and updates
  for (const [groupId, newAssignment] of newMap) {
    const current = currentMap.get(groupId);
    
    if (!current) {
      // New assignment
      changes.push({
        groupId,
        action: 'add',
        position: newAssignment.position || undefined,
      });
    } else if (current.position !== newAssignment.position) {
      // Position changed
      changes.push({
        groupId,
        action: 'update',
        position: newAssignment.position || undefined,
        assignmentId: current.id,
      });
    }
  }

  return {
    changes,
    hasChanges: changes.length > 0,
  };
}