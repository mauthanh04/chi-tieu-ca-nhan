import React from 'react';
import { Category } from '../types';

export interface CategoryTreeNode extends Category {
  children: Category[];
}

export function buildCategoryTree(categories: Category[], type?: 'thu' | 'chi'): CategoryTreeNode[] {
  const filtered = type ? categories.filter((c) => c.type === type) : categories;
  const parentMap = new Map<string, CategoryTreeNode>();
  const parents: CategoryTreeNode[] = [];

  // First pass: identify all parent categories (no parent_id or parent_id not in list)
  filtered.forEach((c) => {
    if (!c.parent_id) {
      const node: CategoryTreeNode = { ...c, children: [] };
      parentMap.set(c.id, node);
      parents.push(node);
    }
  });

  // Second pass: attach child categories
  filtered.forEach((c) => {
    if (c.parent_id) {
      const parent = parentMap.get(c.parent_id);
      if (parent) {
        parent.children.push(c);
      } else {
        // Fallback: if parent not found, treat as top level
        const node: CategoryTreeNode = { ...c, children: [] };
        parents.push(node);
      }
    }
  });

  return parents;
}

export function getCategoryDisplayName(categoryId: string, categories: Category[]): string {
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return 'Danh mục không tồn tại';

  if (cat.parent_id) {
    const parent = categories.find((p) => p.id === cat.parent_id);
    if (parent) {
      return `${parent.name} > ${cat.name}`;
    }
  }

  return cat.name;
}
