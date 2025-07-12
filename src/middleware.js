import { NextResponse } from 'next/server';

export function middleware(request) {
  // Chỉ áp dụng cho API routes (trừ login và socket)
  if (request.nextUrl.pathname.startsWith('/api/') && 
      !request.nextUrl.pathname.startsWith('/api/auth/login') &&
      !request.nextUrl.pathname.startsWith('/api/socket')) {
    
    // Kiểm tra Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Bỏ 'Bearer ' prefix
    
    // Trong thực tế, bạn nên verify JWT token
    // Ở đây chúng ta chỉ kiểm tra token có tồn tại không
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
}; 