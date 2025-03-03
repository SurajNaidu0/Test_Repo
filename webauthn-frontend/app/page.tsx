'use client';

import { useState } from 'react';
import { registerUser, loginUser } from './utils/auth';

export default function Home() {
  // State for authentication
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // State for poll creation
  const [pollTitle, setPollTitle] = useState('');
  const [pollOptions, setPollOptions] = useState('');

  // Registration handler
  const handleRegister = async () => {
    try {
      if (!username) throw new Error('Please enter a username');
      await registerUser(username);
      setMessage('Successfully registered!');
    } catch (error) {
      setMessage(`Error whilst registering: ${error.message}`);
    }
  };

  // Login handler
  const handleLogin = async () => {
    try {
      if (!username) throw new Error('Please enter a username');
      await loginUser(username);
      setMessage('Successfully logged in!');
      setIsLoggedIn(true);
    } catch (error) {
      setMessage(`Error whilst logging in: ${error.message}`);
    }
  };

  // Poll creation handler
  const handleCreatePoll = async () => {
    try {
      // Validate inputs
      if (!pollTitle.trim()) throw new Error('Please enter a poll title');
      const options = pollOptions.split('\n').map(opt => opt.trim()).filter(opt => opt);
      if (options.length < 2) throw new Error('Please enter at least 2 options (one per line)');

      // Send request to backend
      const response = await fetch('http://localhost:8080/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: pollTitle,
          options: options,
        }),
        credentials: 'include', // Include session cookie set during login
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create poll');
      }

      const data = await response.json();
      setMessage(`Poll created successfully! Poll ID: ${data.poll_id}`);

      // Clear form
      setPollTitle('');
      setPollOptions('');
    } catch (error) {
      setMessage(`Error creating poll: ${error.message}`);
    }
  };

  return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">WebAuthn Poll Application</h1>

          {!isLoggedIn ? (
              // Login/Register UI
              <div className="space-y-6">
                <p className="text-center text-gray-600">Register or login to create polls</p>
                <div className="space-y-4">
                  <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username here"
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-4 justify-center">
                    <button
                        onClick={handleRegister}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Register
                    </button>
                    <button
                        onClick={handleLogin}
                        className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                    >
                      Login
                    </button>
                  </div>
                </div>
              </div>
          ) : (
              // Poll Creation UI
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Welcome, {username}!</h2>
                <p className="text-gray-600">Create a new poll</p>
                <div className="space-y-4">
                  <input
                      type="text"
                      value={pollTitle}
                      onChange={(e) => setPollTitle(e.target.value)}
                      placeholder="Enter poll title"
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                      value={pollOptions}
                      onChange={(e) => setPollOptions(e.target.value)}
                      placeholder="Enter poll options, one per line (e.g., Option 1\nOption 2)"
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-y"
                  />
                  <button
                      onClick={handleCreatePoll}
                      className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors w-full"
                  >
                    Create Poll
                  </button>
                </div>
              </div>
          )}

          {/* Feedback Message */}
          {message && (
              <p
                  className={`mt-4 p-2 rounded-md text-center ${
                      message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}
              >
                {message}
              </p>
          )}
        </div>
      </main>
  );
}