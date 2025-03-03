// webauthn-frontend/app/polls/[pollId]/page.tsx
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

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 p-4 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded-md w-3/4 mx-auto mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-4/5 mb-4"></div>
                    </div>
                    <p className="text-gray-500">Loading poll data...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 p-4 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-md">
                    <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Poll</h2>
                    <p className="mb-4">{error}</p>
                    <div className="flex justify-center space-x-4">
                        <button
                            onClick={() => fetchPoll()}
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                        >
                            Try Again
                        </button>
                        <Link href="/" className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Poll not found
    if (!poll) {
        return (
            <div className="min-h-screen bg-gray-100 p-4 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h2 className="text-xl font-bold mb-2">Poll Not Found</h2>
                    <p className="mb-4">The poll you're looking for doesn't exist or has been removed.</p>
                    <Link href="/" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-2xl font-bold">{poll.title}</h1>
                        <p className="text-sm text-gray-500">
                            Created {getTimeSince(poll.created_at)}
                        </p>
                    </div>
                    <div className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                        {poll.is_closed ? (
                            <span className="text-red-500 font-medium">Closed</span>
                        ) : (
                            <span className="text-green-500 font-medium">Active</span>
                        )}
                    </div>
                </div>

                {poll.is_closed && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                        <p className="text-red-700">
                            This poll is closed. You can view the results, but new votes are not being accepted.
                        </p>
                    </div>
                )}

                <div className="space-y-4 mb-4">
                    {poll.options.map(option => (
                        <div key={option.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center mb-2">
                                <div className="flex-1">
                                    <input
                                        type="radio"
                                        id={option.id}
                                        name="pollOption"
                                        value={option.id}
                                        checked={selectedOption === option.id}
                                        onChange={(e) => setSelectedOption(e.target.value)}
                                        disabled={poll.is_closed || hasVoted || isVoting}
                                        className="mr-2"
                                    />
                                    <label htmlFor={option.id} className="font-medium">
                                        {option.text}
                                    </label>
                                </div>
                                <div className="text-right">
                                    <span className="font-medium">
                                        {option.votes} vote{option.votes !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-in-out"
                                    style={{ width: `${option.percentage}%` }}
                                />
                            </div>
                            <div className="text-right text-sm text-gray-500 mt-1">
                                {option.percentage.toFixed(1)}%
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-gray-700 font-medium">
                            Total Votes: {poll.total_votes}
                        </p>
                        <p className="text-sm text-gray-500">
                            Created on {formatDate(poll.created_at)}
                        </p>
                    </div>

                    {!poll.is_closed && !hasVoted && (
                        <button
                            onClick={handleVote}
                            disabled={!selectedOption || isVoting}
                            className={`px-4 py-2 rounded-md text-white 
                                ${!selectedOption || isVoting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}
                            `}
                        >
                            {isVoting ? 'Submitting...' : 'Cast Vote'}
                        </button>
                    )}

                    {hasVoted && !poll.is_closed && (
                        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-md">
                            You've voted!
                        </div>
                    )}
                </div>

                {message && (
                    <div className={`mt-4 p-3 rounded-md ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}

                <div className="mt-6 border-t pt-4">
                    <Link href="/" className="text-blue-500 hover:underline">
                        &larr; Back to Poll List
                    </Link>
                </div>
            </div>
        </main>
    );
}