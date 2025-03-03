'use client';

import { useState } from 'react';
import { registerUser, loginUser } from './utils/auth';

export default function Home() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleRegister = async () => {
    try {
      if (!username) {
        setMessage('Please enter a username');
        return;
      }

      await registerUser(username);
      setMessage('Successfully registered!');
    } catch (error) {
      setMessage(`Error whilst registering: ${error.message}`);
    }
  };

  const handleLogin = async () => {
    try {
      if (!username) {
        setMessage('Please enter a username');
        return;
      }

      await loginUser(username);
      setMessage('Successfully logged in!');
      setIsLoggedIn(true);
    } catch (error) {
      setMessage(`Error whilst logging in: ${error.message}`);
    }
  };

  return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">WebAuthn Poll Application</h1>

          {!isLoggedIn ? (
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
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Welcome, {username}!</h2>
                <p className="text-gray-600">You can now create polls</p>
                {/* Add poll creation form here later */}
              </div>
          )}

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