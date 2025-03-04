'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePolls } from '../../hooks/usePolls';
import { useAuthStore } from '../../store';
import { checkAuthStatus } from '../../utils/auth';

export default function ManagePolls() {
    const [message, setMessage] = useState('');
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);
    const router = useRouter();
    const { isLoggedIn } = useAuthStore();

    const {
        polls,
        isLoading,
        error,
        fetchPolls,
        resetPolls,
        closePoll
    } = usePolls({ creator: 'me' });

    // Check authentication on page load
    useEffect(() => {
        const verifyAuth = async () => {
            const isAuthenticated = await checkAuthStatus();
            if (!isAuthenticated) {
                router.push('/login');
            }
        };

        verifyAuth();
    }, [router]);

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
      @keyframes shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
      }
    `;
        document.head.appendChild(styleTag);
        return () => document.head.removeChild(styleTag);
    }, []);

    // Format the created date to a readable format
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Handle closing a poll
    const handleClose = async (pollId: string) => {
        try {
            setActionInProgress(pollId);
            setMessage('');

            const success = await closePoll(pollId);

            if (success) {
                setMessage(`Poll closed successfully`);
            }
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setActionInProgress(null);
        }
    };

    // Handle resetting a poll's votes
    const handleReset = async (pollId: string) => {
        try {
            setActionInProgress(pollId);
            setMessage('');

            const success = await resetPolls(pollId);

            if (success) {
                setMessage(`Poll votes reset successfully`);
            }
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setActionInProgress(null);
        }
    };

    // Styles
    const container = {
        display: 'flex',
        flexDirection: 'column' as const,
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8fafc, #e5e7eb)',
    };

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

    const mainContent = {
        flex: '1 1 auto',
        padding: '2rem',
    };

    const pageContainer = {
        maxWidth: '48rem',
        margin: '0 auto',
    };

    const pageHeader = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
    };

    const pageTitle = {
        fontSize: '2rem',
        fontWeight: '800',
        background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
    };

    const actionButtonsContainer = {
        display: 'flex',
        gap: '1rem',
    };

    const createButton = {
        padding: '0.75rem 1.25rem',
        background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
        color: 'white',
        border: 'none',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-block',
        boxShadow: '0 4px 10px rgba(139, 92, 246, 0.3)',
        transition: 'all 0.3s ease',
    };

    const homeButton = {
        padding: '0.75rem 1.25rem',
        background: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        color: '#4b5563',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-block',
        transition: 'all 0.3s ease',
    };

    const messageBox = (isError: boolean) => ({
        marginBottom: '1.5rem',
        padding: '1rem',
        borderRadius: '0.75rem',
        background: isError ? 'rgba(254, 202, 202, 0.5)' : 'rgba(187, 247, 208, 0.5)',
        color: isError ? '#b91c1c' : '#047857',
        border: `1px solid ${isError ? 'rgba(248, 113, 113, 0.3)' : 'rgba(74, 222, 128, 0.3)'}`,
        fontSize: '0.875rem',
        fontWeight: '500',
        animation: 'fadeInUp 0.5s ease-out',
    });

    const errorContainer = {
        padding: '1.5rem',
        borderRadius: '0.75rem',
        background: 'rgba(254, 202, 202, 0.5)',
        border: '1px solid rgba(248, 113, 113, 0.3)',
        marginBottom: '1.5rem',
        animation: 'fadeInUp 0.5s ease-out',
    };

    const errorText = {
        color: '#b91c1c',
        fontSize: '1rem',
        marginBottom: '0.75rem',
    };

    const retryButton = {
        color: '#8b5cf6',
        textDecoration: 'underline',
        fontWeight: '500',
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        padding: '0',
    };

    const emptyContainer = {
        background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
        padding: '2.5rem',
        borderRadius: '1.5rem',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.1)',
        textAlign: 'center' as const,
        animation: 'fadeInUp 0.5s ease-out',
    };

    const emptyTitle = {
        fontSize: '1.5rem',
        fontWeight: '700',
        marginBottom: '1rem',
        color: '#1f2937',
    };

    const emptyMessage = {
        marginBottom: '1.5rem',
        color: '#4b5563',
    };

    const pollCard = {
        background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.1)',
        marginBottom: '1.25rem',
        animation: 'fadeInUp 0.5s ease-out',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    };

    const pollHeader = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1rem',
    };

    const pollTitle = {
        fontSize: '1.25rem',
        fontWeight: '700',
        marginBottom: '0.25rem',
        color: '#1f2937',
    };

    const pollDate = {
        color: '#6b7280',
        fontSize: '0.875rem',
    };

    const statusBadge = (isClosed: boolean) => ({
        padding: '0.25rem 0.75rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        background: isClosed
            ? 'rgba(254, 202, 202, 0.3)'
            : 'rgba(187, 247, 208, 0.3)',
        color: isClosed ? '#b91c1c' : '#047857',
        border: isClosed
            ? '1px solid rgba(248, 113, 113, 0.3)'
            : '1px solid rgba(74, 222, 128, 0.3)',
    });

    const statsContainer = {
        marginBottom: '1.25rem',
    };

    const statsTitle = {
        fontWeight: '600',
        color: '#4b5563',
        marginBottom: '0.5rem',
    };

    const statsGrid = {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem',
    };

    const statCard = {
        background: 'rgba(243, 244, 246, 0.5)',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid rgba(139, 92, 246, 0.1)',
    };

    const statLabel = {
        color: '#6b7280',
        fontSize: '0.875rem',
    };

    const statValue = {
        fontWeight: '600',
        color: '#1f2937',
    };

    const pollActions = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
    };

    const viewButton = {
        padding: '0.5rem 1rem',
        background: 'linear-gradient(90deg, #2563eb, #4f46e5)',
        color: 'white',
        border: 'none',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-block',
        transition: 'all 0.2s ease',
    };

    const closeButton = (isClosed: boolean, isProcessing: boolean) => ({
        padding: '0.5rem 1rem',
        background: isClosed
            ? '#d1d5db'
            : isProcessing
                ? 'linear-gradient(90deg, #f87171, #ef4444)'
                : 'linear-gradient(90deg, #ef4444, #dc2626)',
        color: 'white',
        border: 'none',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: isClosed ? 'not-allowed' : (isProcessing ? 'wait' : 'pointer'),
        opacity: isClosed ? 0.7 : 1,
        transition: 'all 0.2s ease',
    });

    const resetButton = (isProcessing: boolean) => ({
        padding: '0.5rem 1rem',
        background: isProcessing
            ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
            : 'linear-gradient(90deg, #f59e0b, #d97706)',
        color: 'white',
        border: 'none',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        cursor: isProcessing ? 'wait' : 'pointer',
        transition: 'all 0.2s ease',
    });

    const loadingContainer = {
        animation: 'fadeInUp 0.5s ease-out',
    };

    const shimmerBlock = {
        background: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
        backgroundSize: '1000px 100%',
        animation: 'shimmer 2s infinite linear',
        borderRadius: '0.75rem',
        marginBottom: '1rem',
    };

    const authRequired = {
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
    };

    const authCard = {
        background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
        padding: '2.5rem',
        borderRadius: '1.5rem',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.1)',
        width: '100%',
        maxWidth: '28rem',
        border: '1px solid rgba(139, 92, 246, 0.1)',
        textAlign: 'center' as const,
        animation: 'fadeInUp 0.5s ease-out',
    };

    const authTitle = {
        fontSize: '1.5rem',
        fontWeight: '700',
        marginBottom: '1rem',
        color: '#1f2937',
    };

    const authMessage = {
        marginBottom: '1.5rem',
        color: '#4b5563',
    };

    const authButtonsContainer = {
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
    };

    const loginButton = {
        padding: '0.75rem 1.5rem',
        background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
        color: 'white',
        border: 'none',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-block',
    };

    const footer = {
        padding: '16px',
        textAlign: 'center' as const,
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        background: 'rgba(255, 255, 255, 0.8)',
    };

    // If not logged in, show authentication required message
    if (!isLoggedIn) {
        return (
            <div style={container}>
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

                <div style={authRequired}>
                    <div style={authCard}>
                        <h1 style={authTitle}>Authentication Required</h1>
                        <p style={authMessage}>You need to be logged in to manage polls.</p>
                        <div style={authButtonsContainer}>
                            <Link href="/login" style={loginButton}>
                                Login
                            </Link>
                            <Link href="/" style={homeButton}>
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>

                <footer style={footer}>
                    <div style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                        © 2025 Pollswap • Built with ❤️
                    </div>
                </footer>
            </div>
        );
    }

    return (
        <div style={container}>
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

            <main style={mainContent}>
                <div style={pageContainer}>
                    <div style={pageHeader}>
                        <h1 style={pageTitle}>Manage Your Polls</h1>
                        <div style={actionButtonsContainer}>
                            <Link
                                href="/polls/new"
                                style={createButton}
                                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.5)'}
                                onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 4px 10px rgba(139, 92, 246, 0.3)'}
                            >
                                Create New Poll
                            </Link>
                            <Link
                                href="/"
                                style={homeButton}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>

                    {isLoading ? (
                        <div style={loadingContainer}>
                            {[1, 2, 3].map(item => (
                                <div key={item} style={{
                                    ...pollCard,
                                    animation: 'none',
                                }}>
                                    <div style={pollHeader}>
                                        <div>
                                            <div style={{
                                                ...shimmerBlock,
                                                height: '1.5rem',
                                                width: '80%',
                                                marginBottom: '0.5rem',
                                            }}></div>
                                            <div style={{
                                                ...shimmerBlock,
                                                height: '1rem',
                                                width: '50%',
                                            }}></div>
                                        </div>
                                        <div style={{
                                            ...shimmerBlock,
                                            height: '1.5rem',
                                            width: '5rem',
                                        }}></div>
                                    </div>
                                    <div style={statsContainer}>
                                        <div style={{
                                            ...shimmerBlock,
                                            height: '1rem',
                                            width: '40%',
                                        }}></div>
                                        <div style={{
                                            ...statsGrid,
                                            marginTop: '0.5rem',
                                        }}>
                                            <div style={{
                                                ...shimmerBlock,
                                                height: '3rem',
                                                margin: '0',
                                            }}></div>
                                            <div style={{
                                                ...shimmerBlock,
                                                height: '3rem',
                                                margin: '0',
                                            }}></div>
                                        </div>
                                    </div>
                                    <div style={{
                                        ...pollActions,
                                        marginTop: '1rem',
                                    }}>
                                        <div style={{
                                            ...shimmerBlock,
                                            height: '2.5rem',
                                            width: '6rem',
                                            margin: '0',
                                        }}></div>
                                        <div style={{
                                            ...shimmerBlock,
                                            height: '2.5rem',
                                            width: '6rem',
                                            margin: '0',
                                        }}></div>
                                        <div style={{
                                            ...shimmerBlock,
                                            height: '2.5rem',
                                            width: '6rem',
                                            margin: '0',
                                        }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div style={errorContainer}>
                            <p style={errorText}>{error}</p>
                            <button
                                onClick={() => fetchPolls()}
                                style={retryButton}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : polls.length === 0 ? (
                        <div style={emptyContainer}>
                            <h2 style={emptyTitle}>No Polls Found</h2>
                            <p style={emptyMessage}>You haven't created any polls yet.</p>
                            <Link
                                href="/polls/new"
                                style={createButton}
                                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.5)'}
                                onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 4px 10px rgba(139, 92, 246, 0.3)'}
                            >
                                Create Your First Poll
                            </Link>
                        </div>
                    ) : (
                        <>
                            {message && (
                                <div style={messageBox(message.includes('Error'))}>
                                    {message}
                                </div>
                            )}

                            {polls.map((poll, index) => (
                                <div
                                    key={poll.id}
                                    style={{
                                        ...pollCard,
                                        animationDelay: `${index * 0.1}s`,
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.15)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.1)';
                                    }}
                                >
                                    <div style={pollHeader}>
                                        <div>
                                            <h2 style={pollTitle}>{poll.title}</h2>
                                            <p style={pollDate}>
                                                Created on {formatDate(poll.created_at)}
                                            </p>
                                        </div>
                                        <div style={statusBadge(poll.is_closed)}>
                                            {poll.is_closed ? 'Closed' : 'Active'}
                                        </div>
                                    </div>

                                    <div style={statsContainer}>
                                        <p style={statsTitle}>Poll Statistics:</p>
                                        <div style={statsGrid}>
                                            <div style={statCard}>
                                                <span style={statLabel}>Total Votes: </span>
                                                <span style={statValue}>{poll.total_votes}</span>
                                            </div>
                                            <div style={statCard}>
                                                <span style={statLabel}>Options: </span>
                                                <span style={statValue}>{poll.options.length}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={pollActions}>
                                        <Link
                                            href={`/polls/${poll.id}`}
                                            style={viewButton}
                                            onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(1.1)'}
                                            onMouseOut={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                                        >
                                            View Results
                                        </Link>

                                        <button
                                            onClick={() => handleClose(poll.id)}
                                            disabled={poll.is_closed || actionInProgress === poll.id}
                                            style={closeButton(poll.is_closed, actionInProgress === poll.id)}
                                            onMouseOver={(e) => !poll.is_closed && actionInProgress !== poll.id && (e.currentTarget.style.filter = 'brightness(1.1)')}
                                            onMouseOut={(e) => !poll.is_closed && actionInProgress !== poll.id && (e.currentTarget.style.filter = 'brightness(1)')}
                                        >
                                            {actionInProgress === poll.id ? 'Processing...' : 'Close Poll'}
                                        </button>

                                        <button
                                            onClick={() => handleReset(poll.id)}
                                            disabled={actionInProgress === poll.id}
                                            style={resetButton(actionInProgress === poll.id)}
                                            onMouseOver={(e) => actionInProgress !== poll.id && (e.currentTarget.style.filter = 'brightness(1.1)')}
                                            onMouseOut={(e) => actionInProgress !== poll.id && (e.currentTarget.style.filter = 'brightness(1)')}
                                        >
                                            {actionInProgress === poll.id ? 'Processing...' : 'Reset Votes'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
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