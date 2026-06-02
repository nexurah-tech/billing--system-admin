import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-admin';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'nexurahadmin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nexurah123@';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Generate Admin Session JWT
    const token = jwt.sign(
      { role: 'super-admin', username },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const response = NextResponse.json(
      { success: true, message: 'Login successful' },
      { status: 200 }
    );

    // Set HTTPOnly cookie for secure session authentication
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Login failed' },
      { status: 500 }
    );
  }
}
