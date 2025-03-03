// webauthn-frontend/app/polls/manage/page.tsx
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

    // If not logged in, show authentication required message
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-100 p-4 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-md">
                    <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
                    <p className="mb-4">You need to be logged in to manage polls.</p>
                    <div className="flex justify-center space-x-4">
                        <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                            Login
                        </Link>
                        <Link href="/" className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <main className="min-h-screen bg-gray-100 p-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold mb-6 text-center">Manage Your Polls</h1>
                    <div className="flex justify-center">
                        <div className="animate-pulse space-y-4 w-full">
                            {[1, 2, 3].map(item => (
                                <div key={item} className="bg-white p-6 rounded-lg shadow-md">
                                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                                    <div className="flex space-x-2">
                                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Manage Your Polls</h1>
                    <div className="flex space-x-4">
                        <Link href="/polls/new" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                            Create New Poll
                        </Link>
                        <Link href="/" className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                            Back to Home
                        </Link>
                    </div>
                </div>

                {error ? (
                    <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
                        <p className="text-red-700">{error}</p>
                        <button
                            onClick={() => fetchPolls()}
                            className="mt-2 text-blue-500 underline"
                        >
                            Try Again
                        </button>
                    </div>
                ) : polls.length === 0 ? (
                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <h2 className="text-xl font-bold mb-2">No Polls Found</h2>
                        <p className="mb-4">You haven't created any polls yet.</p>
                        <Link href="/polls/new" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                            Create Your First Poll
                        </Link>
                    </div>
                ) : (
                    <>
                        {message && (
                            <div className={`mb-4 p-4 rounded-md ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {message}
                            </div>
                        )}

                        <div className="space-y-4">
                            {polls.map((poll) => (
                                <div key={poll.id} className="bg-white p-6 rounded-lg shadow-md">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h2 className="text-xl font-semibold">{poll.title}</h2>
                                            <p className="text-gray-500">
                                                Created on {formatDate(poll.created_at)}
                                            </p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${poll.is_closed ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {poll.is_closed ? 'Closed' : 'Active'}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <p className="font-medium">Poll Statistics:</p>
                                        <div className="mt-1 grid grid-cols-2 gap-2">
                                            <div className="bg-gray-50 p-2 rounded">
                                                <span className="text-gray-600">Total Votes:</span> <span className="font-medium">{poll.total_votes}</span>
                                            </div>
                                            <div className="bg-gray-50 p-2 rounded">
                                                <span className="text-gray-600">Options:</span> <span className="font-medium">{poll.options.length}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Link
                                            href={`/polls/${poll.id}`}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                        >
                                            View Results
                                        </Link>

                                        <button
                                            onClick={() => handleClose(poll.id)}
                                            disabled={poll.is_closed || actionInProgress === poll.id}
                                            className={`px-4 py-2 rounded-md transition-colors ${
                                                poll.is_closed
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : actionInProgress === poll.id
                                                        ? 'bg-red-300 text-white cursor-wait'
                                                        : 'bg-red-500 text-white hover:bg-red-600'
                                            }`}
                                        >
                                            {actionInProgress === poll.id ? 'Processing...' : 'Close Poll'}
                                        </button>

                                        <button
                                            onClick={() => handleReset(poll.id)}
                                            disabled={actionInProgress === poll.id}
                                            className={`px-4 py-2 rounded-md transition-colors ${
                                                actionInProgress === poll.id
                                                    ? 'bg-yellow-300 text-white cursor-wait'
                                                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                                            }`}
                                        >
                                            {actionInProgress === poll.id ? 'Processing...' : 'Reset Votes'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}