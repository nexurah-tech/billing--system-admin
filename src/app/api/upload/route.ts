import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-admin';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authorization
    if (!verifyAdminSession(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'Only image files are allowed' }, { status: 400 });
    }

    // 3. Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    const fileUri = `data:${file.type};base64,${base64Data}`;

    // 4. Upload to Cloudinary securely
    const uploadResult = await cloudinary.uploader.upload(fileUri, {
      folder: 'billing-qr-codes',
    });

    // 5. Return the secure URL
    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.secure_url,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload image file' },
      { status: 500 }
    );
  }
}
