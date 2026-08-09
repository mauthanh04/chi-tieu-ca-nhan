import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, User } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'quan-ly-chi-tieu-jwt-secret-key-2026';

// Register
router.post('/register', (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Email không hợp lệ' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu tối thiểu phải có 6 ký tự' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Mật khẩu nhập lại không khớp' });
    }

    const users = db.getUsers();
    const existingUser = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existingUser) {
      return res.status(400).json({ message: 'Email này đã được đăng ký' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const now = new Date().toISOString();
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newUser: User = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      created_at: now,
      updated_at: now,
    };

    db.executeTransaction(() => {
      users.push(newUser);
      db.createDefaultCategoriesForUser(userId);
    });

    return res.status(201).json({
      message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi server khi đăng ký' });
  }
});

// Login
router.post('/login', (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập Email và Mật khẩu' });
    }

    const users = db.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi server khi đăng nhập' });
  }
});

// Get Me
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const users = db.getUsers();
  const user = users.find((u) => u.id === req.userId);

  if (!user) {
    return res.status(404).json({ message: 'Người dùng không tồn tại' });
  }

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

// Logout
router.post('/logout', authenticateToken, (req: AuthRequest, res: Response) => {
  return res.json({ message: 'Đăng xuất thành công' });
});

// Change Password
router.post('/change-password', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mật khẩu' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải tối thiểu 6 ký tự' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới không trùng khớp' });
    }

    const users = db.getUsers();
    const user = users.find((u) => u.id === req.userId);

    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác' });
    }

    const salt = bcrypt.genSaltSync(10);
    user.password_hash = bcrypt.hashSync(newPassword, salt);
    user.updated_at = new Date().toISOString();

    db.save();

    return res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Lỗi khi đổi mật khẩu' });
  }
});

export default router;
