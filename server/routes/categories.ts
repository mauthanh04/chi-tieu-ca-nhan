import { Router, Response } from 'express';
import { db, Category } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get categories
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const categories = db.getCategories().filter((c) => c.user_id === req.userId);
  return res.json({ categories });
});

// Create category
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { name, type, parent_id } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Vui lòng điền tên danh mục và loại (thu/chi)' });
    }

    if (type !== 'thu' && type !== 'chi') {
      return res.status(400).json({ message: 'Loại danh mục phải là "thu" hoặc "chi"' });
    }

    const categories = db.getCategories();

    // Verify parent_id if provided
    let validParentId: string | null = null;
    if (parent_id) {
      const parent = categories.find((c) => c.id === parent_id && c.user_id === req.userId);
      if (!parent) {
        return res.status(400).json({ message: 'Danh mục cha không hợp lệ' });
      }
      if (parent.type !== type) {
        return res.status(400).json({ message: 'Danh mục con phải cùng loại (thu/chi) với danh mục cha' });
      }
      validParentId = parent.id;
    }

    const existing = categories.find(
      (c) =>
        c.user_id === req.userId &&
        c.name.toLowerCase() === name.trim().toLowerCase() &&
        c.type === type &&
        (c.parent_id || null) === (validParentId || null)
    );

    if (existing) {
      return res.status(400).json({ message: 'Danh mục này đã tồn tại' });
    }

    const newCategory: Category = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: req.userId!,
      name: name.trim(),
      type,
      parent_id: validParentId,
      created_at: new Date().toISOString(),
    };

    db.executeTransaction(() => {
      categories.push(newCategory);
    });

    return res.status(201).json({
      message: 'Tạo danh mục thành công',
      category: newCategory,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi tạo danh mục' });
  }
});

// Update category
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, parent_id } = req.body;

    const categories = db.getCategories();
    const category = categories.find((c) => c.id === id && c.user_id === req.userId);

    if (!category) {
      return res.status(404).json({ message: 'Danh mục không tồn tại' });
    }

    if (name) category.name = name.trim();
    if (type && (type === 'thu' || type === 'chi')) category.type = type;

    if (parent_id !== undefined) {
      if (parent_id === null || parent_id === '') {
        category.parent_id = null;
      } else {
        if (parent_id === id) {
          return res.status(400).json({ message: 'Danh mục không thể là cha của chính nó' });
        }
        const parent = categories.find((c) => c.id === parent_id && c.user_id === req.userId);
        if (!parent) {
          return res.status(400).json({ message: 'Danh mục cha không tồn tại' });
        }
        category.parent_id = parent.id;
      }
    }

    db.save();

    return res.json({
      message: 'Cập nhật danh mục thành công',
      category,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi sửa danh mục' });
  }
});

// Delete category
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const categories = db.getCategories();
    const targetCat = categories.find((c) => c.id === id && c.user_id === req.userId);

    if (!targetCat) {
      return res.status(404).json({ message: 'Danh mục không tồn tại' });
    }

    db.executeTransaction(() => {
      // Find all child category IDs if this is a parent category
      const idsToDelete = new Set<string>();
      idsToDelete.add(id);

      categories.forEach((c) => {
        if (c.parent_id === id && c.user_id === req.userId) {
          idsToDelete.add(c.id);
        }
      });

      // Filter out all deleted categories
      const remaining = categories.filter((c) => !idsToDelete.has(c.id));
      // mutate categories array in place
      categories.length = 0;
      categories.push(...remaining);
    });

    return res.json({ message: 'Xóa danh mục thành công' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi xóa danh mục' });
  }
});

export default router;
