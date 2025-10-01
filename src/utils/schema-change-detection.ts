import type { TagsSchema, TagCategory, TagItem } from '../types/people-configurations';

/**
 * Deep comparison utility for detecting changes in schema objects
 * Optimized for performance with early returns and shallow checks where possible
 */

export interface SchemaChanges {
  hasChanges: boolean;
  changedCategories: Set<string>;
  changedItems: Map<string, Set<string>>; // categoryKey -> Set of item IDs
  addedCategories: Set<string>;
  deletedCategories: Set<string>;
  addedItems: Map<string, Set<string>>;
  deletedItems: Map<string, Set<string>>;
}



/**
 * Compare two tag items for changes
 */
function compareTagItems(item1: TagItem, item2: TagItem): boolean {
  return (
    item1.name === item2.name &&
    item1.description === item2.description &&
    item1.color === item2.color &&
    item1.is_active === item2.is_active &&
    item1.display_order === item2.display_order
  );
}

/**
 * Compare two tag categories for changes (excluding items)
 */
function compareTagCategories(cat1: TagCategory, cat2: TagCategory): boolean {
  return (
    cat1.name === cat2.name &&
    cat1.description === cat2.description &&
    cat1.display_order === cat2.display_order &&
    cat1.is_required === cat2.is_required &&
    cat1.component_style === cat2.component_style &&
    cat1.is_active === cat2.is_active
  );
}

/**
 * Efficiently detect changes between two tags schemas
 * Returns detailed information about what changed
 */
export function detectSchemaChanges(
  originalSchema: TagsSchema | null,
  currentSchema: TagsSchema | null
): SchemaChanges {
  const changes: SchemaChanges = {
    hasChanges: false,
    changedCategories: new Set(),
    changedItems: new Map(),
    addedCategories: new Set(),
    deletedCategories: new Set(),
    addedItems: new Map(),
    deletedItems: new Map(),
  };

  // Handle null cases
  if (!originalSchema && !currentSchema) {
    return changes;
  }

  if (!originalSchema || !currentSchema) {
    changes.hasChanges = true;
    return changes;
  }

  const originalCategories = originalSchema.categories || {};
  const currentCategories = currentSchema.categories || {};

  const originalCategoryKeys = new Set(Object.keys(originalCategories));
  const currentCategoryKeys = new Set(Object.keys(currentCategories));

  // Find added and deleted categories
  for (const key of currentCategoryKeys) {
    if (!originalCategoryKeys.has(key)) {
      changes.addedCategories.add(key);
      changes.hasChanges = true;
    }
  }

  for (const key of originalCategoryKeys) {
    if (!currentCategoryKeys.has(key)) {
      changes.deletedCategories.add(key);
      changes.hasChanges = true;
    }
  }

  // Compare existing categories
  for (const categoryKey of currentCategoryKeys) {
    if (originalCategoryKeys.has(categoryKey)) {
      const originalCategory = originalCategories[categoryKey];
      const currentCategory = currentCategories[categoryKey];

      // Check category properties
      if (!compareTagCategories(originalCategory, currentCategory)) {
        changes.changedCategories.add(categoryKey);
        changes.hasChanges = true;
      }

      // Compare items within the category
      const originalItems = new Map(originalCategory.items.map(item => [item.id, item]));
      const currentItems = new Map(currentCategory.items.map(item => [item.id, item]));

      const originalItemIds = new Set(originalItems.keys());
      const currentItemIds = new Set(currentItems.keys());

      // Find added items
      const addedItemIds = new Set<string>();
      for (const itemId of currentItemIds) {
        if (!originalItemIds.has(itemId)) {
          addedItemIds.add(itemId);
          changes.hasChanges = true;
        }
      }
      if (addedItemIds.size > 0) {
        changes.addedItems.set(categoryKey, addedItemIds);
      }

      // Find deleted items
      const deletedItemIds = new Set<string>();
      for (const itemId of originalItemIds) {
        if (!currentItemIds.has(itemId)) {
          deletedItemIds.add(itemId);
          changes.hasChanges = true;
        }
      }
      if (deletedItemIds.size > 0) {
        changes.deletedItems.set(categoryKey, deletedItemIds);
      }

      // Find changed items
      const changedItemIds = new Set<string>();
      for (const itemId of currentItemIds) {
        if (originalItemIds.has(itemId)) {
          const originalItem = originalItems.get(itemId)!;
          const currentItem = currentItems.get(itemId)!;
          
          if (!compareTagItems(originalItem, currentItem)) {
            changedItemIds.add(itemId);
            changes.hasChanges = true;
          }
        }
      }
      if (changedItemIds.size > 0) {
        changes.changedItems.set(categoryKey, changedItemIds);
      }
    }
  }

  return changes;
}

/**
 * Simple boolean check for whether schemas have any changes
 * Optimized for performance when only a boolean result is needed
 */
export function hasSchemaChanges(
  originalSchema: TagsSchema | null,
  currentSchema: TagsSchema | null
): boolean {
  // Quick reference equality check
  if (originalSchema === currentSchema) return false;
  
  // Handle null cases
  if (!originalSchema && !currentSchema) return false;
  if (!originalSchema || !currentSchema) return true;

  const originalCategories = originalSchema.categories || {};
  const currentCategories = currentSchema.categories || {};

  const originalKeys = Object.keys(originalCategories);
  const currentKeys = Object.keys(currentCategories);

  // Quick length check
  if (originalKeys.length !== currentKeys.length) return true;

  // Check for added/removed categories
  const originalKeySet = new Set(originalKeys);
  for (const key of currentKeys) {
    if (!originalKeySet.has(key)) return true;
  }

  // Compare each category
  for (const categoryKey of currentKeys) {
    const originalCategory = originalCategories[categoryKey];
    const currentCategory = currentCategories[categoryKey];

    // Compare category properties
    if (!compareTagCategories(originalCategory, currentCategory)) {
      return true;
    }

    // Quick items length check
    if (originalCategory.items.length !== currentCategory.items.length) {
      return true;
    }

    // Compare items
    const originalItemsMap = new Map(originalCategory.items.map(item => [item.id, item]));
    
    for (const currentItem of currentCategory.items) {
      const originalItem = originalItemsMap.get(currentItem.id);
      if (!originalItem || !compareTagItems(originalItem, currentItem)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get a summary of changes for display purposes
 */
export function getChangesSummary(changes: SchemaChanges): string {
  if (!changes.hasChanges) return 'No changes';

  const parts: string[] = [];

  if (changes.addedCategories.size > 0) {
    parts.push(`${changes.addedCategories.size} category(ies) added`);
  }

  if (changes.deletedCategories.size > 0) {
    parts.push(`${changes.deletedCategories.size} category(ies) deleted`);
  }

  if (changes.changedCategories.size > 0) {
    parts.push(`${changes.changedCategories.size} category(ies) modified`);
  }

  const totalAddedItems = Array.from(changes.addedItems.values())
    .reduce((sum, set) => sum + set.size, 0);
  if (totalAddedItems > 0) {
    parts.push(`${totalAddedItems} item(s) added`);
  }

  const totalDeletedItems = Array.from(changes.deletedItems.values())
    .reduce((sum, set) => sum + set.size, 0);
  if (totalDeletedItems > 0) {
    parts.push(`${totalDeletedItems} item(s) deleted`);
  }

  const totalChangedItems = Array.from(changes.changedItems.values())
    .reduce((sum, set) => sum + set.size, 0);
  if (totalChangedItems > 0) {
    parts.push(`${totalChangedItems} item(s) modified`);
  }

  return parts.join(', ');
}