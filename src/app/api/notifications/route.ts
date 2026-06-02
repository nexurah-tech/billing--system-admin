import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import Notification from '@/models/Notification';
import Shop from '@/models/Shop';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-admin';

// Helper to verify admin session
function verifyAdminSession(request: NextRequest): boolean {
  const sessionToken = request.cookies.get('admin_session')?.value;
  if (!sessionToken) return false;

  try {
    const decoded = jwt.verify(sessionToken, JWT_SECRET) as any;
    return decoded && decoded.role === 'super-admin';
  } catch (err) {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdminSession(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Fetch all sent admin notifications
    const notifications = await Notification.find().sort({ createdAt: -1 });

    const formattedNotifications = [];
    for (const n of notifications) {
      let targetName = 'Global Broadcast';
      if (n.targetShop) {
        const shop = await Shop.findById(n.targetShop);
        targetName = shop ? shop.name : 'Unknown Shop';
      }

      formattedNotifications.push({
        id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        targetName,
        createdAt: n.createdAt,
      });
    }

    return NextResponse.json({ success: true, notifications: formattedNotifications });
  } catch (error: any) {
    console.error('Fetch admin notifications error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdminSession(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { title, message, type, targetShopId } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'Title and message are required' }, { status: 400 });
    }

    const notification = new Notification({
      title,
      message,
      type: type || 'info',
      targetShop: targetShopId || null,
      readBy: [],
    });

    await notification.save();

    return NextResponse.json({
      success: true,
      message: targetShopId ? 'Direct notification sent successfully' : 'Global broadcast sent successfully',
      notification,
    });
  } catch (error: any) {
    console.error('Dispatch notification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch notification' },
      { status: 500 }
    );
  }
}
