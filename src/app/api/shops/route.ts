import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/db';
import Shop from '@/models/Shop';
import User from '@/models/User';
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
    
    // Fetch user owners and build the final formatted list
    const formattedShops = [];
    let pendingCount = 0;
    let blockedCount = 0;
    let activeCount = 0;

    for (const shop of shops) {
      // Find owner of this shop
      const owner = await User.findOne({ shop: shop._id, role: 'owner' });
      
      const status = owner ? owner.status : 'inactive';
      
      if (status === 'pending') pendingCount++;
      else if (status === 'blocked') blockedCount++;
      else if (status === 'active') activeCount++;

      formattedShops.push({
        id: shop._id,
        name: shop.name,
        address: shop.address,
        phone: shop.phone,
        email: shop.email,
        createdAt: shop.createdAt,
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

    if (!action || !shopId) {
      return NextResponse.json({ success: false, error: 'action and shopId are required' }, { status: 400 });
    }

    // Find the owner of this shop
    const owner = await User.findOne({ shop: shopId, role: 'owner' });
    if (!owner && action !== 'delete') {
      return NextResponse.json({ success: false, error: 'Shop owner not found' }, { status: 404 });
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
      console.log('=== ADMIN BLOCK ACTION ===');
      console.log('Shop ID:', shopId);
      console.log('Block Reason received:', reason);
      
      owner.status = 'blocked';
      owner.blockReason = reason || 'Subscription Payment Overdue';
      
      console.log('Owner model before save:', {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        status: owner.status,
        blockReason: owner.blockReason
      });

      await owner.save();
      
      const updatedOwner = await User.findById(owner._id);
      console.log('Owner model after save (fetched fresh):', {
        id: updatedOwner?._id,
        name: updatedOwner?.name,
        email: updatedOwner?.email,
        status: updatedOwner?.status,
        blockReason: updatedOwner?.blockReason
      });

      // Also restrict staff users and mirror block reason
      const updateStaffResult = await User.updateMany(
        { shop: shopId, role: 'staff' },
        { status: 'blocked', blockReason: reason || 'Subscription Payment Overdue' }
      );
      console.log('Staff update result:', updateStaffResult);
      console.log('==========================');

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
