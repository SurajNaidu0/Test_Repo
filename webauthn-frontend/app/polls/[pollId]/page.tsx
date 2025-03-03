'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface PollOption {
    id: string;
    text: string;
    votes: number;
    percentage: number; // Always calculated or provided by SSE
}

interface Poll {
    id: string;
    title: string;
    options: PollOption[];
    total_votes: number;
    is_closed: boolean;
    creator_id: string; // Added for potential future use
    created_at: string;
}

export default function PollPage() {
    const { pollId } = useParams();
    const [poll, setPoll] = useState<Poll | null>(null);
    const [selectedOption, setSelectedOption] = useState<string>('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Fetch initial poll data and set up SSE for real-time updates
    useEffect(() => {
        const fetchPoll = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/polls/${pollId}`, { credentials: 'include' });
                if (!res.ok) throw new Error(`Failed to fetch poll: ${await res.text()}`);
                const data: Poll = await res.json();
                // Calculate initial percentages if not provided
                const updatedOptions = data.options.map(opt => ({
                    ...opt,
                    percentage: data.total_votes > 0 ? (opt.votes / data.total_votes) * 100 : 0,
                }));
                setPoll({ ...data, options: updatedOptions });
            } catch (err) {
                setError(err.message);
            }
        };

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
                        created_at: stats.created_at, // Update timestamp if needed
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
    }, [pollId]);

    // Handle voting action
    const handleVote = async () => {
        try {
            if (!selectedOption) throw new Error('Please select an option');
            const res = await fetch(`http://localhost:8080/api/polls/${pollId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ option_id: selectedOption }),
                credentials: 'include',
            });
            if (!res.ok) throw new Error(await res.text());
            setMessage('Vote cast successfully!');
            setSelectedOption(''); // Reset selection after voting
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    // Loading and error states
    if (error) return (
        <div className="min-h-screen bg-gray-100 p-4 text-center text-red-500">
            Error: {error}
        </div>
    );
    if (!poll) return (
        <div className="min-h-screen bg-gray-100 p-4 text-center">
            Loading poll...
        </div>
    );

    return (
        <main className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-4">{poll.title}</h1>
                {poll.is_closed ? (
                    <p className="text-red-500 mb-4">This poll is closed.</p>
                ) : (
                    <div className="space-y-4 mb-4">
                        {poll.options.map(option => (
                            <div key={option.id} className="flex items-center">
                                <input
                                    type="radio"
                                    name="pollOption"
                                    value={option.id}
                                    checked={selectedOption === option.id}
                                    onChange={(e) => setSelectedOption(e.target.value)}
                                    disabled={poll.is_closed}
                                    className="mr-2"
                                />
                                <label className="flex-1">{option.text}</label>
                                <div className="w-1/2 bg-gray-200 rounded-full h-4">
                                    <div
                                        className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                                        style={{ width: `${option.percentage}%` }}
                                    />
                                </div>
                                <span className="ml-2">
                  {option.votes} ({option.percentage.toFixed(1)}%)
                </span>
                            </div>
                        ))}
                        <button
                            onClick={handleVote}
                            disabled={poll.is_closed || !selectedOption}
                            className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                        >
                            Vote
                        </button>
                    </div>
                )}
                <div className="mt-4">
                    <p><strong>Total Votes:</strong> {poll.total_votes}</p>
                    <p><strong>Created At:</strong> {new Date(poll.created_at).toLocaleString()}</p>
                </div>
                {message && (
                    <p className={`mt-4 text-center ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                        {message}
                    </p>
                )}
            </div>
        </main>
    );
}