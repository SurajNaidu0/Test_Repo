'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Poll {
  id: string;
  title: string;
  options: { id: string; text: string; votes: number }[];
  total_votes: number;
  is_closed: boolean;
  creator_id: string;
  created_at: string;
}

export default function Home() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch authentication status and live polls
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated by attempting to fetch their polls
        const res = await fetch('http://localhost:8080/api/polls?creator=me', { credentials: 'include' });
        if (res.ok) {
          setIsLoggedIn(true);
        } else if (res.status === 401) {
          setIsLoggedIn(false);
        } else {
          throw new Error('Failed to verify authentication');
        }
      } catch (err) {
        setIsLoggedIn(false);
        console.error('Auth check error:', err);
      }
    };

    const fetchPolls = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('http://localhost:8080/api/polls?closed=false', { credentials: 'include' });
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

  // Logout handler
  const handleLogout = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Logout failed');
      setIsLoggedIn(false);
      setPolls([]); // Clear polls on logout
      setError(null);
    } catch (err) {
      setError(`Logout error: ${err.message}`);
    }
  };

  return (
      <main className="min-h-screen bg-gray-100 p-4">
        <h1 className="text-3xl font-bold text-center mb-6">Real-Time Polling App</h1>
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Navigation Links */}
          <div className="flex justify-between">
            {isLoggedIn ? (
                <>
                  <Link href="/polls/new" className="text-blue-500 hover:underline">
                    Create Poll
                  </Link>
                  <Link href="/polls/manage" className="text-blue-500 hover:underline">
                    Manage Polls
                  </Link>
                  <button
                      onClick={handleLogout}
                      className="text-blue-500 hover:underline focus:outline-none"
                  >
                    Logout
                  </button>
                </>
            ) : (
                <>
                  <Link href="/login" className="text-blue-500 hover:underline">
                    Login
                  </Link>
                  <Link href="/register" className="text-blue-500 hover:underline">
                    Register
                  </Link>
                </>
            )}
          </div>

          {/* Live Polls Section */}
          <h2 className="text-xl font-semibold">Live Polls</h2>
          {isLoading ? (
              <p className="text-center">Loading polls...</p>
          ) : error ? (
              <p className="text-red-500 text-center">
                {error} {!isLoggedIn && 'Please login to view or create polls.'}
              </p>
          ) : polls.length === 0 ? (
              <p className="text-center">
                No live polls available.{' '}
                {isLoggedIn ? (
                    <Link href="/polls/new" className="text-blue-500 hover:underline">
                      Create one!
                    </Link>
                ) : (
                    'Login to create polls!'
                )}
              </p>
          ) : (
              polls.map(poll => (
                  <Link
                      key={poll.id}
                      href={`/polls/${poll.id}`}
                      className="block p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-medium">{poll.title}</h3>
                    <p>
                      {poll.is_closed ? 'Closed' : 'Open'} - {poll.total_votes} votes
                    </p>
                    <p className="text-sm text-gray-600">
                      Created by: {poll.creator_id} on {new Date(poll.created_at).toLocaleDateString()}
                    </p>
                  </Link>
              ))
          )}
        </div>
      </main>
  );
}