'use client';

import { useState } from 'react';
import { registerUser } from '../utils/auth';
import { useRouter } from 'next/navigation';

export default function Register() {
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const router = useRouter();

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

    return (
        <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full p-2 border rounded-md mb-4"
                />
                <button onClick={handleRegister} className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600">
                    Register with Passkey
                </button>
                {message && <p className="mt-4 text-center">{message}</p>}
            </div>
        </main>
    );
}