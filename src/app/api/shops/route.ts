import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import Shop from '@/models/Shop';
import User from '@/models/User';
import Payment from '@/models/Payment';
import SystemConfig from '@/models/SystemConfig';
import { sendWhatsAppApprovalMessage } from '@/lib/whatsapp';

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

    // Fetch all shops
    const shops = await Shop.find().sort({ createdAt: -1 });
    
    // Fetch global config
    let qrConfig = await SystemConfig.findOne();
    if (!qrConfig) {
      qrConfig = await SystemConfig.create({
        paymentQrCodeUrl: 'https://res.cloudinary.com/dihkz12e6/image/upload/v1700000000/mock-qr.png',
        whatsappNumber: '+919600950190'
      });
    }

    // Fetch user owners and build the final formatted list
    const formattedShops = [];
    let pendingCount = 0;
    let blockedCount = 0;
    let activeCount = 0;

    let paidCount = 0;
    let graceCount = 0;
    let overdueCount = 0;

    const now = new Date();

    for (const shop of shops) {
      // Find owner of this shop
      const owner = await User.findOne({ shop: shop._id, role: 'owner' });
      
      const status = owner ? owner.status : 'inactive';
      
      if (status === 'pending') pendingCount++;
      else if (status === 'blocked') blockedCount++;
      else if (status === 'active') activeCount++;

      // Compute subscription payment states
      const expiresAt = new Date(shop.subscriptionExpiresAt || now);
      const diffTime = now.getTime() - expiresAt.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let isExpired = now > expiresAt;
      let isGracePeriod = isExpired && diffDays <= 3;
      let isSuspended = isExpired && diffDays > 3;

      if (isSuspended) overdueCount++;
      else if (isGracePeriod) graceCount++;
      else paidCount++;

      formattedShops.push({
        id: shop._id,
        name: shop.name,
        address: shop.address,
        phone: shop.phone,
        email: shop.email,
        createdAt: shop.createdAt,
        subscriptionStatus: shop.subscriptionStatus || 'trialing',
        subscriptionExpiresAt: shop.subscriptionExpiresAt,
        lastPaymentDate: shop.lastPaymentDate,
        lastActiveAt: shop.lastActiveAt || shop.updatedAt,
        trialEndsAt: shop.trialEndsAt,
        isExpired,
        isGracePeriod,
        isSuspended,
        graceDaysLeft: isGracePeriod ? Math.max(0, 3 - diffDays) : 0,
        owner: owner ? {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          status: owner.status,
        } : null,
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalShops: shops.length,
        active: activeCount,
        pending: pendingCount,
        blocked: blockedCount,
        paid: paidCount,
        grace: graceCount,
        overdue: overdueCount,
      },
      qrConfig: {
        paymentQrCodeUrl: qrConfig.paymentQrCodeUrl,
        whatsappNumber: qrConfig.whatsappNumber,
      },
      shops: formattedShops,
    });
  } catch (error: any) {
    console.error('Fetch shops error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch shops' },
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
    const { action, shopId } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'action is required' }, { status: 400 });
    }

    // Handle global QR update action (does not require shopId)
    if (action === 'update-qr') {
      const { paymentQrCodeUrl, whatsappNumber } = body;
      let qrConfig = await SystemConfig.findOne();
      if (!qrConfig) {
        qrConfig = new SystemConfig();
      }
      if (paymentQrCodeUrl) qrConfig.paymentQrCodeUrl = paymentQrCodeUrl;
      if (whatsappNumber) qrConfig.whatsappNumber = whatsappNumber;
      await qrConfig.save();

      return NextResponse.json({ success: true, message: 'QR Code configurations updated successfully.' });
    }

    if (!shopId) {
      return NextResponse.json({ success: false, error: 'shopId is required' }, { status: 400 });
    }

    // Find the owner of this shop
    const owner = await User.findOne({ shop: shopId, role: 'owner' });
    if (!owner && action !== 'delete' && action !== 'record-payment') {
      return NextResponse.json({ success: false, error: 'Shop owner not found' }, { status: 404 });
    }

    // Record manual subscription payment
    if (action === 'record-payment') {
      const { amount, paymentMethod, referenceId, notes } = body;
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return NextResponse.json({ success: false, error: 'Shop not found' }, { status: 404 });
      }

      const paymentAmt = Number(amount) || 199;
      const now = new Date();
      const currentExpiry = shop.subscriptionExpiresAt ? new Date(shop.subscriptionExpiresAt) : now;
      
      // If current expiry is in the future, stack the renewal. Otherwise start from now.
      const billingPeriodStart = currentExpiry > now ? currentExpiry : now;
      const billingPeriodEnd = new Date(billingPeriodStart.getTime() + 30 * 24 * 60 * 60 * 1000); // add 30 days

      // Log Payment transaction
      const paymentLog = await Payment.create({
        shop: shopId,
        amount: paymentAmt,
        paymentDate: now,
        billingPeriodStart,
        billingPeriodEnd,
        status: 'paid',
        paymentMethod: paymentMethod || 'manual',
        referenceId: referenceId || '',
        notes: notes || 'Manual administrative payment entry',
      });

      // Update shop details
      shop.subscriptionStatus = 'active';
      shop.subscriptionExpiresAt = billingPeriodEnd;
      shop.lastPaymentDate = now;
      await shop.save();

      // Automatically unblock owner/staff users if blocked for subscription
      if (owner && (owner.status === 'blocked' || owner.blockReason?.includes('Subscription'))) {
        owner.status = 'active';
        owner.blockReason = '';
        await owner.save();

        await User.updateMany(
          { shop: shopId, role: 'staff', status: 'blocked' },
          { status: 'active', blockReason: '' }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Payment logged and subscription extended successfully.',
        payment: paymentLog
      });
    }

    if (action === 'approve') {
      if (!owner) {
        return NextResponse.json({ success: false, error: 'Shop owner not found' }, { status: 404 });
      }
      owner.status = 'active';
      await owner.save();
      
      // Also update any staff users status if pending
      await User.updateMany({ shop: shopId, status: 'pending' }, { status: 'active' });

      // Dispatch WhatsApp Approval Notification via Twilio
      try {
        const shop = await Shop.findById(shopId);
        if (shop && shop.phone) {
          await sendWhatsAppApprovalMessage(shop.phone, owner.name);
        }
      } catch (waErr) {
        console.error('Failed to dispatch WhatsApp approval notification:', waErr);
      }

      return NextResponse.json({ success: true, message: 'Shop approved successfully and WhatsApp notification dispatched.' });
    } 
    
    if (action === 'block') {
      if (!owner) {
        return NextResponse.json({ success: false, error: 'Shop owner not found' }, { status: 404 });
      }
      const { reason } = body;
      
      owner.status = 'blocked';
      owner.blockReason = reason || 'Subscription Payment Overdue';
      await owner.save();
      
      // Also restrict staff users and mirror block reason
      await User.updateMany(
        { shop: shopId, role: 'staff' },
        { status: 'blocked', blockReason: reason || 'Subscription Payment Overdue' }
      );

      return NextResponse.json({ success: true, message: 'Shop blocked successfully' });
    } 
    
    if (action === 'unblock') {
      if (!owner) {
        return NextResponse.json({ success: false, error: 'Shop owner not found' }, { status: 404 });
      }
      owner.status = 'active';
      owner.blockReason = '';
      await owner.save();

      // Also restore staff users and clear block reason
      await User.updateMany(
        { shop: shopId, role: 'staff' },
        { status: 'active', blockReason: '' }
      );

      return NextResponse.json({ success: true, message: 'Shop access restored successfully' });
    } 
    
    if (action === 'reject') {
      if (!owner) {
        return NextResponse.json({ success: false, error: 'Shop owner not found' }, { status: 404 });
      }
      owner.status = 'rejected';
      await owner.save();

      // Mirror reject status to all users of this shop
      await User.updateMany({ shop: shopId }, { status: 'rejected' });

      return NextResponse.json({ success: true, message: 'Shop registration rejected successfully' });
    }

    if (action === 'delete') {
      // Delete all users of this shop
      await User.deleteMany({ shop: shopId });
      // Delete the shop
      await Shop.findByIdAndDelete(shopId);

      return NextResponse.json({ success: true, message: 'Shop and associated accounts deleted successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Update shop error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update shop' },
      { status: 500 }
    );
  }
}
