import '../styles/globals.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated for protected routes
    const token = localStorage.getItem('token');
    const protectedRoutes = ['/game', '/gacha', '/profile', '/characters', '/shop'];
    const isProtectedRoute = protectedRoutes.some(route => router.pathname.startsWith(route));
    
    if (isProtectedRoute && !token) {
      router.push('/auth/login');
    }
  }, [router.pathname]);

  return <Component {...pageProps} />;
}

export default MyApp;