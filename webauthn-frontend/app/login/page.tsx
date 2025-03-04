'use client';

import { useState, useEffect } from 'react';
import { loginUser } from '../utils/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleLogin = async () => {
        try {
            if (!username) throw new Error('Please enter a username');
            await loginUser(username);
            setMessage('Successfully logged in! Redirecting...');
            setTimeout(() => router.push('/'), 2000);
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    // Animation keyframes
    useEffect(() => {
        const styleTag = document.createElement('style');
        styleTag.innerHTML = `
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulseGlow {
        0% { box-shadow: 0 0 5px rgba(139, 92, 246, 0.2); }
        50% { box-shadow: 0 0 15px rgba(139, 92, 246, 0.4); }
        100% { box-shadow: 0 0 5px rgba(139, 92, 246, 0.2); }
      }
    `;
        document.head.appendChild(styleTag);
        return () => document.head.removeChild(styleTag);
    }, []);

    // Header styles
    const header = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        position: 'sticky' as const,
        top: 0,
        zIndex: 1000,
    };

    const logoContainer = {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
    };

    const logoText = {
        fontWeight: '700',
        fontSize: '22px',
        letterSpacing: '-0.5px',
    };

    const logoTextPurple = {
        color: '#8b5cf6',
    };

    const logoTextPink = {
        color: '#ec4899',
    };

    // Enhanced styles
    const loginContainer = {
        display: 'flex',
        flexDirection: 'column' as const,
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8fafc, #e5e7eb)',
    };

    const loginMain = {
        flex: '1 1 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
    };

    const loginCard = {
        background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
        padding: '2.5rem',
        borderRadius: '1.5rem',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.1)',
        width: '100%',
        maxWidth: '28rem',
        border: '1px solid rgba(139, 92, 246, 0.1)',
        animation: 'fadeInUp 0.5s ease-out',
    };

    const loginHeading = {
        fontSize: '2rem',
        fontWeight: '800',
        marginBottom: '2rem',
        textAlign: 'center' as const,
        background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
    };

    const inputField = {
        width: '100%',
        padding: '1rem',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '0.75rem',
        marginBottom: '1.5rem',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.3s ease',
        background: 'rgba(255, 255, 255, 0.9)',
        ':focus': {
            borderColor: '#8b5cf6',
            boxShadow: '0 0 8px rgba(139, 92, 246, 0.2)',
        },
    };

    const loginButton = {
        width: '100%',
        padding: '1rem',
        background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
        color: 'white',
        border: 'none',
        borderRadius: '9999px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
        transition: 'all 0.3s ease',
        animation: 'pulseGlow 2s infinite',
    };

    const messageText = {
        marginTop: '1.5rem',
        textAlign: 'center' as const,
        fontSize: '0.875rem',
        fontWeight: '500',
    };

    const successMessage = { color: '#059669' };
    const errorMessage = { color: '#dc2626' };

    const linkStyle = {
        color: '#8b5cf6',
        textDecoration: 'underline',
        fontWeight: '500',
        marginTop: '1rem',
        display: 'block',
        textAlign: 'center' as const,
    };

    return (
        <div style={loginContainer}>
            <header style={header}>
                <Link href="/" style={{ textDecoration: 'none' }}>
                    <div style={logoContainer}>
                        <div style={logoText}>
                            <span style={logoTextPurple}>Poll</span>
                            <span style={logoTextPink}>swap</span>
                        </div>
                    </div>
                </Link>
            </header>

            <main style={loginMain}>
                <div style={loginCard}>
                    <h1 style={loginHeading}>Login with Passkey</h1>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        style={inputField}
                    />
                    <button
                        onClick={handleLogin}
                        style={loginButton}
                        onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.5)')}
                        onMouseOut={(e) => (e.currentTarget.style.boxShadow = '0 4px 14px rgba(139, 92, 246, 0.3)')}
                    >
                        Login
                    </button>
                    {message && (
                        <p
                            style={{
                                ...messageText,
                                ...(message.includes('Error') ? errorMessage : successMessage),
                            }}
                        >
                            {message}
                        </p>
                    )}
                    <Link href="/register" style={linkStyle}>
                        Don't have an account? Register here
                    </Link>
                </div>
            </main>

            <footer
                style={{
                    padding: '16px',
                    textAlign: 'center' as const,
                    borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                    background: 'rgba(255, 255, 255, 0.8)',
                }}
            >
                <div style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    © 2025 Pollswap • Built with ❤️
                </div>
            </footer>
        </div>
    );
}