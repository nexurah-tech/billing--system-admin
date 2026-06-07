import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import Payment from '@/models/Payment';
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

    // Fetch payments and populate shop details manually (or via ref)
    const payments = await Payment.find().sort({ createdAt: -1 });
    const formattedPayments = [];

    for (const payment of payments) {
      const shop = await Shop.findById(payment.shop);
      formattedPayments.push({
        id: payment._id,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        billingPeriodStart: payment.billingPeriodStart,
        billingPeriodEnd: payment.billingPeriodEnd,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        referenceId: payment.referenceId || '',
        notes: payment.notes || '',
        shop: shop ? {
          id: shop._id,
          name: shop.name,
          phone: shop.phone,
          email: shop.email,
        } : null,
      });
    }

    return NextResponse.json({
      success: true,
      payments: formattedPayments,
    });
  } catch (error: any) {
    console.error('Fetch payments audit error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch payments audit log' },
      { status: 500 }
    );
  }
}
