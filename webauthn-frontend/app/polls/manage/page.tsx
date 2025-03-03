'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ManagePolls() {
    const [polls, setPolls] = useState<any[]>([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPolls = async () => {
            try {
                const res = await fetch('http://localhost:8080/api/polls?creator=me', { credentials: 'include' });
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();
                setPolls(data);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchPolls();
    }, []);

    const handleClose = async (pollId: string) => {
        try {
            const res = await fetch(`http://localhost:8080/api/polls/${pollId}/close`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!res.ok) throw new Error(await res.text());
            setPolls(polls.map(p => p.id === pollId ? { ...p, is_closed: true } : p));
            setMessage(`Poll ${pollId} closed`);
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        }
    };

    const handleReset = async (pollId: string) => {
        try {
            const res = await fetch(`http://localhost:8080/api/polls/${pollId}/reset`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!res.ok) throw new Error(await res.text());
            setPolls(polls.map(p => p.id === pollId ? { ...p, total_votes: 0, options: p.options.map((o: any) => ({ ...o, votes: 0 })) } : p));
            setMessage(`Poll ${pollId} reset`);
        } catch (err) {
            setMessage(`Error: ${err.message}`);
        }
    };

    return (
        <main className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-6 text-center">Manage Your Polls</h1>
                <Link href="/" className="text-blue-500 hover:underline mb-4 block text-center">Back to Home</Link>
                {error ? (
                    <p className="text-red-500">{error}</p>
                ) : polls.length === 0 ? (
                    <p>No polls created yet. <Link href="/polls/new" className="text-blue-500 hover:underline">Create one!</Link></p>
                ) : (
                    polls.map(poll => (
                        <div key={poll.id} className="bg-white p-4 rounded-lg shadow mb-4">
                            <h2 className="font-medium">{poll.title}</h2>
                            <p>Status: {poll.is_closed ? 'Closed' : 'Open'} - Votes: {poll.total_votes}</p>
                            <div className="mt-2 space-x-2">
                                <button
                                    onClick={() => handleClose(poll.id)}
                                    disabled={poll.is_closed}
                                    className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 disabled:bg-gray-400"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => handleReset(poll.id)}
                                    className="bg-yellow-500 text-white p-2 rounded-md hover:bg-yellow-600"
                                >
                                    Reset Votes
                                </button>
                                <Link href={`/polls/${poll.id}`} className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 inline-block">
                                    View
                                </Link>
                            </div>
                        </div>
                    ))
                )}
                {message && <p className={`mt-4 text-center ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{message}</p>}
            </div>
        </main>
    );
}