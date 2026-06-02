import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200 }
  );

  // Clear HTTPOnly session cookie
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
