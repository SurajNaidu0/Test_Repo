'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store';

interface PollOption {
    id: string;
    text: string;
    votes: number;
    percentage: number;
}

interface Poll {
    id: string;
    title: string;
    options: PollOption[];
    total_votes: number;
    is_closed: boolean;
    creator_id: string;
    created_at: string;
}

export default function PollPage() {
    const { pollId } = useParams();
    const router = useRouter();
    const [poll, setPoll] = useState<Poll | null>(null);
    const [selectedOption, setSelectedOption] = useState<string>('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVoting, setIsVoting] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const { isLoggedIn } = useAuthStore();

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
      @keyframes barFill {
        from { width: 0; }
        to { width: var(--target-width); }
      }
    `;
        document.head.appendChild(styleTag);
        return () => document.head.removeChild(styleTag);
    }, []);

    // Format date for better display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate time since poll creation
    const getTimeSince = (dateString: string) => {
        const now = new Date();
        const created = new Date(dateString);
        const diffMs = now.getTime() - created.getTime();

        const seconds = Math.floor(diffMs / 1000);
        if (seconds < 60) return `${seconds} seconds ago`;

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

        const days = Math.floor(hours / 24);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    };

    // Fetch initial poll data
    const fetchPoll = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`http://localhost:8080/api/polls/${pollId}`, {
                credentials: 'include'
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            const data = await res.json();

            // Calculate initial percentages if not provided
            const updatedOptions = data.options.map((opt: any) => ({
                ...opt,
                percentage: data.total_votes > 0 ? (opt.votes / data.total_votes) * 100 : 0,
            }));

            setPoll({ ...data, options: updatedOptions });
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to load poll');
            console.error('Error fetching poll:', err);
        } finally {
            setIsLoading(false);
        }
    }, [pollId]);

    // Setup SSE for real-time updates
    useEffect(() => {
        fetchPoll();

        // Set up Server-Sent Events for real-time updates
        const eventSource = new EventSource(`http://localhost:8080/api/polls/${pollId}/results`);

        eventSource.onmessage = (event) => {
            try {
                const stats = JSON.parse(event.data);
                setPoll(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        total_votes: stats.total_votes,
                        options: stats.options_data.map((opt: any) => ({
                            id: opt.id,
                            text: opt.text,
                            votes: opt.votes,
                            percentage: opt.percentage, // Use SSE-provided percentage
                        })),
                        created_at: stats.created_at,
                    };
                });
            } catch (err) {
                console.error('SSE parsing error:', err);
            }
        };

        eventSource.onerror = () => {
            console.error('SSE connection error');
            eventSource.close();
            setError('Lost connection to live updates. Please refresh.');
        };

        // Cleanup SSE on unmount
        return () => eventSource.close();
    }, [pollId, fetchPoll]);

    // Check if user has already voted
    useEffect(() => {
        const checkVoteStatus = async () => {
            try {
                // This is a simplified check - in a real app, you might
                // want to check this from the server
                const votes = localStorage.getItem('userVotes');
                if (votes) {
                    const votedPolls = JSON.parse(votes);
                    if (votedPolls.includes(pollId)) {
                        setHasVoted(true);
                    }
                }
            } catch (err) {
                console.error('Error checking vote status:', err);
            }
        };

        if (isLoggedIn) {
            checkVoteStatus();
        }
    }, [pollId, isLoggedIn]);

    // Handle voting action
    const handleVote = async () => {
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }

        if (!selectedOption) {
            setMessage('Please select an option');
            return;
        }

        try {
            setIsVoting(true);
            setMessage('');

            const res = await fetch(`http://localhost:8080/api/polls/${pollId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ option_id: selectedOption }),
                credentials: 'include',
            });

            if (!res.ok) {
                throw new Error(await res.text());
            }

            // Record the vote in localStorage
            try {
                const votes = localStorage.getItem('userVotes');
                const votedPolls = votes ? JSON.parse(votes) : [];
                if (!votedPolls.includes(pollId)) {
                    votedPolls.push(pollId);
                    localStorage.setItem('userVotes', JSON.stringify(votedPolls));
                }
            } catch (err) {
                console.error('Error updating local storage:', err);
            }

            setMessage('Vote cast successfully!');
            setHasVoted(true);
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        } finally {
            setIsVoting(false);
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
        display: 'flex',
        justifyContent: 'center',
    };

    const pollCard = {
        background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
        padding: '2rem',
        borderRadius: '1.5rem',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.1)',
        width: '100%',
        maxWidth: '40rem',
        border: '1px solid rgba(139, 92, 246, 0.1)',
        animation: 'fadeInUp 0.5s ease-out',
        margin: '1rem 0',
    };

    const pollHeader = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
    };

    const pollTitle = {
        fontSize: '1.75rem',
        fontWeight: '800',
        marginBottom: '0.5rem',
        background: 'linear-gradient(90deg, #1e293b, #475569)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
    };

    const pollTimestamp = {
        fontSize: '0.875rem',
        color: '#6b7280',
    };

    const statusBadge = (isClosed: boolean) => ({
        padding: '0.5rem 1rem',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '600',
        background: isClosed
            ? 'rgba(254, 202, 202, 0.3)'
            : 'rgba(187, 247, 208, 0.3)',
        color: isClosed ? '#b91c1c' : '#047857',
        border: isClosed
            ? '1px solid rgba(248, 113, 113, 0.3)'
            : '1px solid rgba(74, 222, 128, 0.3)',
    });

    const closedNotice = {
        padding: '1rem',
        borderRadius: '0.75rem',
        marginBottom: '1.5rem',
        background: 'rgba(254, 202, 202, 0.3)',
        border: '1px solid rgba(248, 113, 113, 0.3)',
        borderLeft: '4px solid #ef4444',
        color: '#b91c1c',
    };

    const optionsContainer = {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1rem',
        marginBottom: '1.5rem',
    };

    const optionBlock = {
        padding: '1rem',
        borderRadius: '1rem',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        background: 'rgba(255, 255, 255, 0.8)',
        transition: 'all 0.2s ease',
    };

    const optionHeader = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem',
    };

    const optionInput = {
        marginRight: '0.5rem',
        accentColor: '#8b5cf6',
        cursor: 'pointer',
        width: '1.25rem',
        height: '1.25rem',
    };

    const optionLabel = {
        fontWeight: '600',
        color: '#1f2937',
        marginRight: 'auto',
        cursor: 'pointer',
    };

    const optionVotes = {
        fontWeight: '600',
        color: '#6b7280',
    };

    const progressBarContainer = {
        width: '100%',
        height: '0.5rem',
        background: 'rgba(243, 244, 246, 0.8)',
        borderRadius: '9999px',
        overflow: 'hidden',
    };

    const progressBar = (percentage: number, index: number) => ({
        height: '100%',
        borderRadius: '9999px',
        width: `${percentage}%`,
        background: index % 2 === 0
            ? 'linear-gradient(90deg, #8b5cf6, #a78bfa)'
            : 'linear-gradient(90deg, #ec4899, #f472b6)',
        transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
        animation: 'barFill 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        '--target-width': `${percentage}%`,
    } as React.CSSProperties);

    const percentageText = {
        textAlign: 'right' as const,
        color: '#6b7280',
        fontSize: '0.875rem',
        marginTop: '0.25rem',
    };

    const pollFooter = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '1.5rem',
    };

    const pollStats = {
        color: '#4b5563',
    };

    const totalVotes = {
        fontWeight: '600',
        marginBottom: '0.25rem',
    };

    const pollDate = {
        fontSize: '0.875rem',
        color: '#6b7280',
    };

    const voteButton = {
        padding: '0.75rem 1.5rem',
        background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
        color: 'white',
        border: 'none',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
        transition: 'all 0.3s ease',
    };

    const disabledButton = {
        background: '#d1d5db',
        boxShadow: 'none',
        cursor: 'not-allowed',
    };

    const votedBadge = {
        padding: '0.75rem 1.5rem',
        background: 'rgba(187, 247, 208, 0.5)',
        color: '#047857',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '600',
        border: '1px solid rgba(74, 222, 128, 0.3)',
    };

    const messageBox = (isError: boolean) => ({
        marginTop: '1.5rem',
        padding: '1rem',
        borderRadius: '0.75rem',
        background: isError ? 'rgba(254, 202, 202, 0.5)' : 'rgba(187, 247, 208, 0.5)',
        color: isError ? '#b91c1c' : '#047857',
        border: `1px solid ${isError ? 'rgba(248, 113, 113, 0.3)' : 'rgba(74, 222, 128, 0.3)'}`,
        fontSize: '0.875rem',
        fontWeight: '500',
    });

    const backLink = {
        display: 'block',
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(243, 244, 246, 0.8)',
        color: '#8b5cf6',
        fontWeight: '500',
        textDecoration: 'none',
    };

    const loadingContainer = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
    };

    const loadingCard = {
        background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
        padding: '2rem',
        borderRadius: '1.5rem',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.1)',
        width: '100%',
        maxWidth: '40rem',
        border: '1px solid rgba(139, 92, 246, 0.1)',
        textAlign: 'center' as const,
    };

    const shimmerAnimation = {
        background: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
        backgroundSize: '1000px 100%',
        animation: 'shimmer 2s infinite linear',
        borderRadius: '0.5rem',
        marginBottom: '0.75rem',
    };

    const errorContainer = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
    };

    const errorCard = {
        background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
        padding: '2rem',
        borderRadius: '1.5rem',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.1)',
        width: '100%',
        maxWidth: '40rem',
        border: '1px solid rgba(139, 92, 246, 0.1)',
        textAlign: 'center' as const,
    };

    const errorTitle = {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: '#ef4444',
        marginBottom: '0.75rem',
    };

    const errorMessage = {
        color: '#4b5563',
        marginBottom: '1.5rem',
    };

    const errorActions = {
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
    };

    const retryButton = {
        padding: '0.75rem 1.5rem',
        background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
        color: 'white',
        border: 'none',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: 'pointer',
    };

    const homeButton = {
        padding: '0.75rem 1.5rem',
        background: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        color: '#4b5563',
        borderRadius: '9999px',
        fontSize: '0.875rem',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'none',
    };

    const footer = {
        padding: '16px',
        textAlign: 'center' as const,
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        background: 'rgba(255, 255, 255, 0.8)',
    };

    // Loading state
    if (isLoading) {
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

                <div style={loadingContainer}>
                    <div style={loadingCard}>
                        <div style={{ ...shimmerAnimation, height: '2rem', width: '75%', margin: '0 auto' }}></div>
                        <div style={{ ...shimmerAnimation, height: '1rem', width: '100%' }}></div>
                        <div style={{ ...shimmerAnimation, height: '1rem', width: '100%' }}></div>
                        <div style={{ ...shimmerAnimation, height: '1rem', width: '80%' }}></div>
                        <p style={{ color: '#6b7280', marginTop: '1.5rem' }}>Loading poll data...</p>
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

    // Error state
    if (error) {
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

                <div style={errorContainer}>
                    <div style={errorCard}>
                        <h2 style={errorTitle}>Error Loading Poll</h2>
                        <p style={errorMessage}>{error}</p>
                        <div style={errorActions}>
                            <button
                                onClick={() => fetchPoll()}
                                style={retryButton}
                                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 14px rgba(139, 92, 246, 0.3)'}
                                onMouseOut={(e) => e.currentTarget.style.boxShadow = ''}
                            >
                                Try Again
                            </button>
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
                </div>

                <footer style={footer}>
                    <div style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                        © 2025 Pollswap • Built with ❤️
                    </div>
                </footer>
            </div>
        );
    }

    // Poll not found
    if (!poll) {
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

                <div style={errorContainer}>
                    <div style={errorCard}>
                        <h2 style={errorTitle}>Poll Not Found</h2>
                        <p style={errorMessage}>The poll you're looking for doesn't exist or has been removed.</p>
                        <div style={errorActions}>
                            <Link
                                href="/"
                                style={retryButton}
                                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 14px rgba(139, 92, 246, 0.3)'}
                                onMouseOut={(e) => e.currentTarget.style.boxShadow = ''}
                            >
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
                <div style={pollCard}>
                    <div style={pollHeader}>
                        <div>
                            <h1 style={pollTitle}>{poll.title}</h1>
                            <p style={pollTimestamp}>
                                Created {getTimeSince(poll.created_at)}
                            </p>
                        </div>
                        <div style={statusBadge(poll.is_closed)}>
                            {poll.is_closed ? 'Closed' : 'Active'}
                        </div>
                    </div>

                    {poll.is_closed && (
                        <div style={closedNotice}>
                            <p>
                                This poll is closed. You can view the results, but new votes are not being accepted.
                            </p>
                        </div>
                    )}

                    <div style={optionsContainer}>
                        {poll.options.map((option, index) => (
                            <div
                                key={option.id}
                                style={optionBlock}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={optionHeader}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input
                                            type="radio"
                                            id={option.id}
                                            name="pollOption"
                                            value={option.id}
                                            checked={selectedOption === option.id}
                                            onChange={(e) => setSelectedOption(e.target.value)}
                                            disabled={poll.is_closed || hasVoted || isVoting}
                                            style={optionInput}
                                        />
                                        <label htmlFor={option.id} style={optionLabel}>
                                            {option.text}
                                        </label>
                                    </div>
                                    <div style={optionVotes}>
                                        {option.votes} vote{option.votes !== 1 ? 's' : ''}
                                    </div>
                                </div>

                                <div style={progressBarContainer}>
                                    <div style={progressBar(option.percentage, index)}></div>
                                </div>
                                <div style={percentageText}>
                                    {option.percentage.toFixed(1)}%
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={pollFooter}>
                        <div style={pollStats}>
                            <p style={totalVotes}>
                                Total Votes: {poll.total_votes}
                            </p>
                            <p style={pollDate}>
                                Created on {formatDate(poll.created_at)}
                            </p>
                        </div>

                        {!poll.is_closed && !hasVoted && (
                            <button
                                onClick={handleVote}
                                disabled={!selectedOption || isVoting}
                                style={{
                                    ...voteButton,
                                    ...(!selectedOption || isVoting ? disabledButton : {})
                                }}
                                onMouseOver={(e) => !isVoting && selectedOption && (e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.5)')}
                                onMouseOut={(e) => !isVoting && selectedOption && (e.currentTarget.style.boxShadow = '0 4px 14px rgba(139, 92, 246, 0.3)')}
                            >
                                {isVoting ? 'Submitting...' : 'Cast Vote'}
                            </button>
                        )}

                        {hasVoted && !poll.is_closed && (
                            <div style={votedBadge}>
                                You've voted!
                            </div>
                        )}
                    </div>

                    {message && (
                        <div style={messageBox(message.includes('Error'))}>
                            {message}
                        </div>
                    )}

                    <Link href="/" style={backLink}>
                        &larr; Back to Poll List
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