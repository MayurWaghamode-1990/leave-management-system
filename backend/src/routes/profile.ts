import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get current user profile
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        employeeId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        location: true,
        joiningDate: true,
        status: true,
        gender: true,
        maritalStatus: true,
        country: true,
        designation: true,
        reportingManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const {
      firstName,
      lastName,
      email,
      gender,
      maritalStatus,
      country,
      designation,
      department,
      location,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'First name and last name are required' });
    }

    // Check if email is being changed and if it's already in use
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email: email || undefined,
        gender: gender || undefined,
        maritalStatus: maritalStatus || undefined,
        country: country || undefined,
        designation: designation || undefined,
        department: department || undefined,
        location: location || undefined,
      },
      select: {
        id: true,
        employeeId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        location: true,
        joiningDate: true,
        status: true,
        gender: true,
        maritalStatus: true,
        country: true,
        designation: true,
        reportingManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Change password
router.put('/change-password', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
