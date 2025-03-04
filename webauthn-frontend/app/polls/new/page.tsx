'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store';
import { checkAuthStatus } from '../../utils/auth';

export default function NewPoll() {
    const [title, setTitle] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState<{title?: string, options?: string[]}>({});
    const router = useRouter();
    const { isLoggedIn } = useAuthStore();

    // Check authentication status on page load
    useEffect(() => {
        const verifyAuth = async () => {
            const isAuthenticated = await checkAuthStatus();
            if (!isAuthenticated) {
                setMessage('You need to be logged in to create polls');
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
    `;
        document.head.appendChild(styleTag);
        return () => document.head.removeChild(styleTag);
    }, []);

    // Validate form data
    const validateForm = () => {
        const newErrors: {title?: string, options?: string[]} = {};
        let isValid = true;

        // Validate title
        if (!title.trim()) {
            newErrors.title = 'Title is required';
            isValid = false;
        } else if (title.length < 3) {
            newErrors.title = 'Title must be at least 3 characters';
            isValid = false;
        }

        // Validate options
        const optionErrors: string[] = [];
        const filteredOptions = options.filter(opt => opt.trim().length > 0);

        if (filteredOptions.length < 2) {
            optionErrors.push('At least 2 options are required');
            isValid = false;
        }

        // Check for duplicate options
        const uniqueOptions = new Set(filteredOptions.map(opt => opt.trim().toLowerCase()));
        if (uniqueOptions.size < filteredOptions.length) {
            optionErrors.push('All options must be unique');
            isValid = false;
        }

        // Check individual options
        options.forEach((option, index) => {
            if (!option.trim() && index < 2) {
                optionErrors[index] = 'This option is required';
                isValid = false;
            } else if (option.trim().length > 0 && option.trim().length < 2) {
                optionErrors[index] = 'Option must be at least 2 characters';
                isValid = false;
            }
        });

        if (optionErrors.length > 0) {
            newErrors.options = optionErrors;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Add a new option
    const addOption = () => {
        setOptions([...options, '']);
    };

    // Remove an option
    const removeOption = (index: number) => {
        if (options.length <= 2) {
            setMessage('At least 2 options are required');
            return;
        }

        const newOptions = [...options];
        newOptions.splice(index, 1);
        setOptions(newOptions);
    };

    // Update an option
    const updateOption = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    // Handle form submission
    const handleCreatePoll = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        if (!validateForm()) {
            return;
        }

        try {
            setIsSubmitting(true);
            const filteredOptions = options.filter(opt => opt.trim().length > 0);

            const res = await fetch('http://localhost:8080/api/polls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, options: filteredOptions }),
                credentials: 'include',
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || 'Failed to create poll');
            }

            const data = await res.json();
            setMessage(`Poll created successfully!`);

            // Redirect to the new poll after a short delay
            setTimeout(() => {
                router.push(`/polls/${data.poll_id}`);
            }, 1500);
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
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

    const formCard = {
        background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
        padding: '2.5rem',
        borderRadius: '1.5rem',
        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.1)',
        width: '100%',
        maxWidth: '42rem',
        border: '1px solid rgba(139, 92, 246, 0.1)',
        animation: 'fadeInUp 0.5s ease-out',
        margin: '2rem 0',
    };

    const formTitle = {
        fontSize: '2rem',
        fontWeight: '800',
        marginBottom: '2rem',
        background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
    };

    const formHeader = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
    };

    const backLink = {
        color: '#8b5cf6',
        textDecoration: 'none',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
    };

    const formGroup = {
        marginBottom: '1.5rem',
    };

    const formLabel = {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#4b5563',
        marginBottom: '0.5rem',
    };

    const inputField = {
        width: '100%',
        padding: '1rem',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '0.75rem',
        fontSize: '1rem',
        outline: 'none',
        transition: 'all 0.3s ease',
        background: 'rgba(255, 255, 255, 0.9)',
    };

    const inputError = {
        border: '1px solid #ef4444',
    };

    const errorText = {
        color: '#ef4444',
        fontSize: '0.875rem',
        marginTop: '0.5rem',
    };

    const optionContainer = {
        display: 'flex',
        marginBottom: '0.75rem',
    };

    const optionInput = {
        flexGrow: 1,
        position: 'relative' as const,
    };

    const optionPrefix = {
        position: 'absolute' as const,
        left: '0.75rem',
        top: '1rem',
        color: '#6b7280',
    };

    const removeButton = {
        marginLeft: '0.5rem',
        padding: '0.5rem',
        color: '#ef4444',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        fontSize: '1.25rem',
        borderRadius: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
    };

    const addButton = {
        display: 'flex',
        alignItems: 'center',
        color: '#8b5cf6',
        background: 'none',
        border: 'none',
        padding: '0.5rem 0',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: '600',
        marginTop: '0.5rem',
    };

    const submitButton = {
        padding: '1rem 1.5rem',
        background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
        color: 'white',
        border: 'none',
        borderRadius: '9999px',
        fontSize: '1rem',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
        transition: 'all 0.3s ease',
    };

    const disabledButton = {
        background: '#d1d5db',
        cursor: 'not-allowed',
        boxShadow: 'none',
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

    const formActions = {
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: '2rem',
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

    const homeButton = {
        padding: '0.75rem 1.5rem',
        background: '#e5e7eb',
        color: '#4b5563',
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

    // If not logged in, show a message
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
                        <p style={authMessage}>You need to be logged in to create a poll.</p>
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
                <div style={formCard}>
                    <div style={formHeader}>
                        <h1 style={formTitle}>Create New Poll</h1>
                        <Link href="/" style={backLink}>
                            Back to Home
                        </Link>
                    </div>

                    <form onSubmit={handleCreatePoll}>
                        <div style={formGroup}>
                            <label htmlFor="poll-title" style={formLabel}>
                                Poll Title*
                            </label>
                            <input
                                id="poll-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter a question or topic for your poll"
                                style={{
                                    ...inputField,
                                    ...(errors.title ? inputError : {})
                                }}
                                disabled={isSubmitting}
                            />
                            {errors.title && (
                                <p style={errorText}>{errors.title}</p>
                            )}
                        </div>

                        <div style={formGroup}>
                            <label style={formLabel}>
                                Poll Options* (minimum 2)
                            </label>

                            {options.map((option, index) => (
                                <div key={index} style={optionContainer}>
                                    <div style={optionInput}>
                                        <span style={optionPrefix}>
                                            {index + 1}.
                                        </span>
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => updateOption(index, e.target.value)}
                                            placeholder={`Option ${index + 1}`}
                                            style={{
                                                ...inputField,
                                                paddingLeft: '2rem',
                                                ...(errors.options && errors.options[index] ? inputError : {})
                                            }}
                                            disabled={isSubmitting}
                                        />
                                        {errors.options && errors.options[index] && (
                                            <p style={errorText}>{errors.options[index]}</p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeOption(index)}
                                        style={removeButton}
                                        disabled={options.length <= 2 || isSubmitting}
                                        aria-label="Remove option"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}

                            {errors.options && !Array.isArray(errors.options) && (
                                <p style={errorText}>{errors.options}</p>
                            )}

                            <button
                                type="button"
                                onClick={addOption}
                                style={addButton}
                                disabled={isSubmitting}
                            >
                                <span style={{ fontSize: '1.5rem', marginRight: '0.25rem' }}>+</span> Add Another Option
                            </button>
                        </div>

                        <div style={formActions}>
                            <button
                                type="submit"
                                style={{
                                    ...submitButton,
                                    ...(isSubmitting ? disabledButton : {})
                                }}
                                disabled={isSubmitting}
                                onMouseOver={(e) => !isSubmitting && (e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.5)')}
                                onMouseOut={(e) => !isSubmitting && (e.currentTarget.style.boxShadow = '0 4px 14px rgba(139, 92, 246, 0.3)')}
                            >
                                {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
                            </button>
                        </div>
                    </form>

                    {message && (
                        <div style={messageBox(message.includes('Error'))}>
                            {message}
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