'use client';

import { useState, useEffect } from 'react';
import { registerUser } from '../utils/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const router = useRouter();

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

    const handleRegister = async () => {
        try {
            if (!username) throw new Error('Please enter a username');
            await registerUser(username);
            setMessage('Successfully registered! Redirecting to login...');
            setTimeout(() => router.push('/login'), 2000);
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    // Styles
    const registerContainer = {
        display: 'flex',
        flexDirection: 'column' as const,
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8fafc, #e5e7eb)',
    };

    const registerMain = {
        flex: '1 1 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
    };

    const registerCard = {
        background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
        padding: '2.5rem',
        borderRadius: '1.5rem',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.1)',
        width: '100%',
        maxWidth: '28rem',
        border: '1px solid rgba(139, 92, 246, 0.1)',
        animation: 'fadeInUp 0.5s ease-out',
    };

    const registerHeading = {
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

    const registerButton = {
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

    // Uniswap-inspired navbar styles
    const navbar = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 16px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        position: 'sticky' as const,
        top: 0,
        zIndex: 1000,
    };

    const navLeft = {
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
    };

    const navRight = {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
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

    const navTabs = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    };

    const navTab = {
        padding: '8px 12px',
        fontWeight: '500',
        fontSize: '16px',
        color: '#374151',
        textDecoration: 'none',
        borderRadius: '12px',
        transition: 'all 0.2s ease',
    };

    const navTabHover = {
        backgroundColor: 'rgba(243, 244, 246, 0.8)',
        color: '#111827',
    };

    const getAppButton = {
        color: '#111827',
        fontWeight: '500',
        padding: '8px 16px',
        borderRadius: '12px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s ease',
    };

    const connectButton = {
        background: 'linear-gradient(90deg, #fc72ff, #8b5cf6)',
        color: 'white',
        fontWeight: '600',
        padding: '8px 16px',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.2s ease',
    };

    const footer = {
        padding: '16px',
        textAlign: 'center' as const,
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        background: 'rgba(255, 255, 255, 0.8)',
    };

    return (
        <div style={registerContainer}>
            <nav style={navbar}>
                <div style={navLeft}>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <div style={logoContainer}>
                            <div style={logoText}>
                                <span style={logoTextPurple}>Poll</span>
                                <span style={logoTextPink}>swap</span>
                            </div>
                        </div>
                    </Link>
                    <div style={navTabs}>
                        <Link href="/"
                              style={navTab}
                              onMouseOver={(e) => Object.assign(e.currentTarget.style, navTabHover)}
                              onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = '';
                                  e.currentTarget.style.color = '#374151';
                              }}
                        >
                            Explore
                        </Link>
                        <Link href="/polls/new"
                              style={navTab}
                              onMouseOver={(e) => Object.assign(e.currentTarget.style, navTabHover)}
                              onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = '';
                                  e.currentTarget.style.color = '#374151';
                              }}
                        >
                            Create
                        </Link>
                        <Link href="/polls/manage"
                              style={navTab}
                              onMouseOver={(e) => Object.assign(e.currentTarget.style, navTabHover)}
                              onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = '';
                                  e.currentTarget.style.color = '#374151';
                              }}
                        >
                            Manage
                        </Link>
                    </div>
                </div>

                <div style={navRight}>
                    <Link href="/login" style={{ textDecoration: 'none' }}>
                        <button style={getAppButton}>
                            Login
                        </button>
                    </Link>
                    <Link href="/register" style={{ textDecoration: 'none' }}>
                        <button style={{...connectButton, background: 'linear-gradient(90deg, #ec4899, #f472b6)'}}>
                            Register
                        </button>
                    </Link>
                </div>
            </nav>

            <main style={registerMain}>
                <div style={registerCard}>
                    <h1 style={registerHeading}>Register with Passkey</h1>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        style={inputField}
                    />
                    <button
                        onClick={handleRegister}
                        style={registerButton}
                        onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.5)')}
                        onMouseOut={(e) => (e.currentTarget.style.boxShadow = '0 4px 14px rgba(139, 92, 246, 0.3)')}
                    >
                        Register
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
                    <Link href="/login" style={linkStyle}>
                        Already have an account? Login here
                    </Link>
                </div>
            </main>

            <footer style={footer}>
                <div style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                    © 2025 Pollswap • Built with ❤️
                </div>
            </footer>
        </div>
    );
}