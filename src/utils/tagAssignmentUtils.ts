import type { MemberTagAssignment } from '@/hooks/useMemberTagAssignments';

export interface TagAssignmentChange {
  tagId: string;
  action: 'add' | 'update' | 'delete';
  value?: any;
  assignmentId?: string;
  tagItemId?: string;
}

export interface TagAssignmentComparison {
  changes: TagAssignmentChange[];
  hasChanges: boolean;
}

/**
 * Compare current tag assignments with new tag values to determine what changes need to be made
 * @param currentAssignments - Current member tag assignments from the database
 * @param newTagValues - New tag values from the form
 * @returns Object containing the changes that need to be made
 */
export function compareTagAssignments(
  currentAssignments: Record<string, MemberTagAssignment | null>,
  newTagValues: Record<string, any>
): TagAssignmentComparison {
  const changes: TagAssignmentChange[] = [];

  // Get all unique tag IDs from both current and new values
  const allTagIds = new Set([
    ...Object.keys(currentAssignments),
    ...Object.keys(newTagValues)
  ]);

  allTagIds.forEach(tagId => {
    const currentAssignment = currentAssignments[tagId];
    const newValue = newTagValues[tagId];

    // Check if the new value is empty/null/undefined
    const hasNewValue = newValue !== null && newValue !== undefined && newValue !== '';
    const hasCurrentValue = currentAssignment !== null && currentAssignment !== undefined;

    if (hasNewValue && !hasCurrentValue) {
      // Add new assignment
      changes.push({
        tagId,
        action: 'add',
        value: newValue
      });
    } else if (!hasNewValue && hasCurrentValue) {
      // Delete existing assignment
      changes.push({
        tagId,
        action: 'delete',
        assignmentId: currentAssignment.id
      });
    } else if (hasNewValue && hasCurrentValue) {
      // Check if tag item has changed
      const currentTagItemId = currentAssignment.tag_item_id;
      
      // For tag assignments, we compare the tag_item_id
      // newValue should be the tag_item_id or array of tag_item_ids
      const newTagItemId = Array.isArray(newValue) ? newValue[0] : newValue;
      
      if (currentTagItemId !== newTagItemId) {
        changes.push({
          tagId,
          action: 'update',
          value: newValue,
          assignmentId: currentAssignment.id
        });
      }
    }
  });

  return {
    changes,
    hasChanges: changes.length > 0
  };
}

/**
 * Group tag assignment changes by action type for bulk operations
 * @param changes - Array of tag assignment changes
 * @returns Object with changes grouped by action type
 */
export function groupChangesByAction(changes: TagAssignmentChange[]) {
  return {
    toAdd: changes.filter(change => change.action === 'add'),
    toUpdate: changes.filter(change => change.action === 'update'),
    toDelete: changes.filter(change => change.action === 'delete')
  };
}