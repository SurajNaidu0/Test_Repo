'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPoll() {
    const [title, setTitle] = useState('');
    const [options, setOptions] = useState('');
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleCreatePoll = async () => {
        try {
            const opts = options.split('\n').map(opt => opt.trim()).filter(opt => opt);
            if (!title || opts.length < 2) throw new Error('Title and at least 2 options required');

            const res = await fetch('http://localhost:8080/api/polls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, options: opts }),
                credentials: 'include',
            });

            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setMessage(`Poll created! ID: ${data.poll_id}`);
            setTimeout(() => router.push(`/polls/${data.poll_id}`), 2000);
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Create New Poll</h1>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Poll Title"
                    className="w-full p-2 border rounded-md mb-4"
                />
                <textarea
                    value={options}
                    onChange={(e) => setOptions(e.target.value)}
                    placeholder="Options (one per line)"
                    className="w-full p-2 border rounded-md mb-4 h-24"
                />
                <button onClick={handleCreatePoll} className="w-full bg-purple-500 text-white p-2 rounded-md hover:bg-purple-600">
                    Create Poll
                </button>
                {message && <p className="mt-4 text-center">{message}</p>}
            </div>
        </main>
    );
}