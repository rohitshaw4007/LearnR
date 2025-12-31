import { NextResponse } from 'next/server';

export function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // Public paths jo bina login ke dikhne chahiye
  const isPublicPath = path === '/login' || path === '/signup' || path === '/';

  // Token check karo
  const token = request.cookies.get('token')?.value || '';

  // 1. Agar user login hai aur public page (Login/Signup) par hai -> Dashboard bhej do
  if (isPublicPath && token) {
    // Agar root '/' hai to dashboard mat bhejo, lekin login/signup se bhejo
    if (path !== '/') {
        return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
    }
  }

  // 2. Agar user login NAHI hai aur Protected page (Dashboard/Admin) par hai -> Login bhej do
  if (!isPublicPath && !token) {
    // Sirf protected routes ko filter karo
    if (path.startsWith('/dashboard') || path.startsWith('/admin') || path.startsWith('/profile')) {
        return NextResponse.redirect(new URL('/login', request.nextUrl));
    }
  }
}

// Kin paths par ye middleware chalna chahiye
export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
  ]
}