'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  options: PollOption[];
  total_votes: number;
  is_closed: boolean;
  creator_id: string;
  creator_username: string;
  created_at: string;
}

export default function Home() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulseGlow {
        0% { box-shadow: 0 0 5px rgba(139, 92, 246, 0.2); }
        50% { box-shadow: 0 0 15px rgba(139, 92, 246, 0.4); }
        100% { box-shadow: 0 0 5px rgba(139, 92, 246, 0.2); }
      }
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .hover-lift:hover {
        transform: translateY(-8px) scale(1.03);
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
      }
    `;
    document.head.appendChild(styleTag);
    return () => document.head.removeChild(styleTag);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/polls?creator=me', { credentials: 'include' });
        setIsLoggedIn(res.ok); // Only sets true if authenticated
      } catch (err) {
        setIsLoggedIn(false);
        console.error('Auth check error:', err);
      }
    };

    const fetchPolls = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('http://localhost:8080/api/polls?closed=false', {
          method: 'GET',
          credentials: 'include', // Sends cookies if present, but not required
        });
        if (!res.ok) throw new Error(`Failed to fetch live polls: ${await res.text()}`);
        const data: Poll[] = await res.json();
        setPolls(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    fetchPolls();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Logout failed');
      setIsLoggedIn(false);
      setPolls([]); // Clear polls on logout (optional, adjust as needed)
      setError(null);
    } catch (err) {
      setError(`Logout error: ${err.message}`);
    }
  };

  // Styles
  const container = {
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #f8fafc, #e5e7eb)',
  };

  const mainContent = {
    flex: '1 1 auto',
    padding: '2.5rem 1.5rem 2rem',
  };

  const loadingSpinner = {
    width: '4rem',
    height: '4rem',
    border: '5px solid rgba(139, 92, 246, 0.2)',
    borderTop: '5px solid #8b5cf6',
    borderRadius: '50%',
    animation: 'spin 1s ease-in-out infinite',
    background: 'linear-gradient(45deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
  };

  const loadingContainer = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)',
  };

  const loadingText = {
    marginTop: '1.5rem',
    color: '#8b5cf6',
    fontSize: '1.25rem',
    fontWeight: '500',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    animation: 'pulseGlow 2s infinite',
  };

  const errorContainer = {
    margin: '2rem auto',
    padding: '2rem',
    maxWidth: '32rem',
    background: 'linear-gradient(135deg, rgba(254, 242, 242, 0.9), rgba(252, 231, 233, 0.9))',
    borderRadius: '1.5rem',
    border: '1px solid rgba(248, 113, 113, 0.2)',
    boxShadow: '0 10px 30px rgba(248, 113, 113, 0.1)',
    animation: 'fadeInUp 0.5s ease-out',
  };

  const noPollsContainer = {
    margin: '2rem auto',
    padding: '2rem',
    maxWidth: '32rem',
    background: 'linear-gradient(135deg, rgba(249, 250, 251, 0.9), rgba(243, 244, 246, 0.9))',
    borderRadius: '1.5rem',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    boxShadow: '0 10px 30px rgba(139, 92, 246, 0.1)',
    animation: 'fadeInUp 0.5s ease-out',
  };

  const pollsSection = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 1.5rem',
  };

  const pollsHeader = {
    marginBottom: '2.5rem',
    position: 'relative' as const,
    paddingBottom: '1rem',
    background: 'linear-gradient(to right, transparent, rgba(139, 92, 246, 0.1), transparent)',
    textAlign: 'left' as const,
  };

  const pollsSectionTitle = {
    fontSize: '2.5rem',
    fontWeight: '800',
    background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  };

  const pollsGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '2rem',
  };

  const getPollCardStyle = (index: number) => ({
    background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
    borderRadius: '1.5rem',
    padding: '1.75rem',
    border: '1px solid rgba(139, 92, 246, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease',
    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s forwards`,
    opacity: 0,
    position: 'relative' as const,
    overflow: 'hidden',
  });

  const pollCardTitle = {
    fontSize: '1.375rem',
    fontWeight: '700',
    marginBottom: '0.5rem',
    background: 'linear-gradient(90deg, #1e293b, #475569)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  };

  const creatorBadge = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.375rem 0.875rem',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))',
    borderRadius: '2rem',
    marginBottom: '1rem',
    border: '1px solid rgba(139, 92, 246, 0.2)',
  };

  const creatorAvatar = {
    width: '1.5rem',
    height: '1.5rem',
    borderRadius: '50%',
    background: 'linear-gradient(45deg, #8b5cf6, #ec4899)',
  };

  const creatorName = {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#6b7280',
  };

  const statusBadge = (isClosed: boolean) => ({
    padding: '0.375rem 1rem',
    borderRadius: '2rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    background: isClosed
        ? 'linear-gradient(135deg, #e5e7eb, #d1d5db)'
        : 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
    color: isClosed ? '#374151' : '#065f46',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  });

  const optionStyle = {
    padding: '0.75rem',
    borderRadius: '0.75rem',
    background: 'rgba(255, 255, 255, 0.9)',
    marginBottom: '0.5rem',
    border: '1px solid rgba(139, 92, 246, 0.1)',
    transition: 'all 0.2s ease',
  };

  const progressBar = (percentage: number, colorIndex: number) => ({
    height: '0.5rem',
    width: `${percentage}%`,
    background: colorIndex % 2 === 0
        ? 'linear-gradient(90deg, #8b5cf6, #a78bfa)'
        : 'linear-gradient(90deg, #ec4899, #f472b6)',
    borderRadius: '1rem',
    transition: 'width 0.5s ease-in-out',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  });

  const voteButton = {
    padding: '0.75rem 1.5rem',
    borderRadius: '2rem',
    background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
    color: 'white',
    fontWeight: '600',
    border: 'none',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const footer = {
    padding: '16px',
    textAlign: 'center' as const,
    borderTop: '1px solid rgba(0, 0, 0, 0.05)',
    background: 'rgba(255, 255, 255, 0.8)',
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

  const activeNavTab = {
    ...navTab,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    color: '#8b5cf6',
    fontWeight: '600',
  };

  const navTabHover = {
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    color: '#111827',
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
    textDecoration: 'none',
  };

  const logoutButton = {
    background: 'linear-gradient(90deg, #f87171, #ef4444)',
    color: 'white',
    fontWeight: '600',
    padding: '8px 16px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
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
    textDecoration: 'none',
  };

  // Empty to remove hero section

  return (
      <div style={container}>
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
                    style={activeNavTab}
                    onMouseOver={(e) => Object.assign(e.currentTarget.style, navTabHover)}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                      e.currentTarget.style.color = '#8b5cf6';
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
            {isLoggedIn ? (
                <button
                    onClick={handleLogout}
                    style={logoutButton}
                    onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(248, 113, 113, 0.4)'}
                    onMouseOut={(e) => e.currentTarget.style.boxShadow = ''}
                >
                  Disconnect
                </button>
            ) : (
                <>
                  <Link href="/login" style={getAppButton}>
                    Login
                  </Link>
                  <Link
                      href="/register"
                      style={connectButton}
                      onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.5)'}
                      onMouseOut={(e) => e.currentTarget.style.boxShadow = ''}
                  >
                    Register
                  </Link>
                </>
            )}
          </div>
        </nav>

        {/* Hero section removed */}

        <main style={mainContent}>
          <div style={pollsSection}>
            <div style={pollsHeader}>
              <h2 style={pollsSectionTitle}>Live Polls</h2>
            </div>

            {isLoading ? (
                <div style={loadingContainer}>
                  <div style={loadingSpinner}></div>
                  <div style={loadingText}>Discovering awesome polls...</div>
                </div>
            ) : error ? (
                <div style={errorContainer}>
                  <div style={{ color: '#dc2626', fontSize: '1.25rem', fontWeight: '600' }}>{error}</div>
                </div>
            ) : polls.length === 0 ? (
                <div style={noPollsContainer}>
                  <div style={{ fontSize: '1.25rem', color: '#6b7280', textAlign: 'center' }}>No live polls available</div>
                  <Link
                      href="/polls/new"
                      style={{
                        marginTop: '1.5rem',
                        color: '#8b5cf6',
                        fontWeight: '600',
                        textDecoration: 'underline',
                        display: 'block',
                        textAlign: 'center',
                      }}
                  >
                    Create your first poll!
                  </Link>
                </div>
            ) : (
                <div style={pollsGrid}>
                  {polls.map((poll, index) => (
                      <div key={poll.id} style={getPollCardStyle(index)} className="hover-lift">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h3 style={pollCardTitle}>{poll.title}</h3>
                          <span style={statusBadge(poll.is_closed)}>
                      {poll.is_closed ? 'Closed' : 'Active'}
                    </span>
                        </div>

                        <div style={creatorBadge}>
                          <div style={creatorAvatar}></div>
                          <span style={creatorName}>@{poll.creator_username || 'Unknown'}</span>
                        </div>

                        <div style={{ margin: '1rem 0' }}>
                          {poll.options.map((option, optIndex) => {
                            const percentage =
                                poll.total_votes > 0 ? Math.round((option.votes / poll.total_votes) * 100) : 0;

                            return (
                                <div key={option.id} style={optionStyle}>
                                  <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: '0.5rem',
                                        fontSize: '0.9375rem',
                                        fontWeight: '500',
                                      }}
                                  >
                                    <span style={{ color: '#374151' }}>{option.text}</span>
                                    <span
                                        style={{
                                          color: optIndex % 2 === 0 ? '#8b5cf6' : '#ec4899',
                                          fontWeight: '600',
                                        }}
                                    >
                              {percentage}%
                            </span>
                                  </div>
                                  <div style={{ backgroundColor: '#f3f4f6', borderRadius: '1rem', overflow: 'hidden' }}>
                                    <div style={progressBar(percentage, optIndex)}></div>
                                  </div>
                                </div>
                            );
                          })}
                        </div>

                        <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginTop: '1rem',
                            }}
                        >
                          <div
                              style={{
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                background: 'rgba(243, 244, 246, 0.8)',
                                padding: '0.5rem 1rem',
                                borderRadius: '1rem',
                              }}
                          >
                            {poll.total_votes} votes • {new Date(poll.created_at).toLocaleDateString()}
                          </div>
                          <Link
                              href={`/polls/${poll.id}`}
                              style={voteButton}
                              onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.transform = '';
                                e.currentTarget.style.boxShadow = '';
                              }}
                          >
                            Vote Now
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                  ))}
                </div>
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