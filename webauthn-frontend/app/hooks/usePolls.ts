// webauthn-frontend/app/hooks/usePolls.ts
import { useState, useEffect, useCallback } from 'react';

interface PollOption {
    id: string;
    text: string;
    votes: number;
}

export interface Poll {
    id: string;
    title: string;
    options: PollOption[];
    total_votes: number;
    is_closed: boolean;
    creator_id: string;
    created_at: string;
}

interface UsePollsOptions {
    creator?: string;
    closed?: boolean;
    initialFetch?: boolean;
}

interface UsePollsResult {
    polls: Poll[];
    isLoading: boolean;
    error: string | null;
    fetchPolls: () => Promise<void>;
    resetPolls: (pollId: string) => Promise<boolean>;
    closePoll: (pollId: string) => Promise<boolean>;
}

const API_BASE_URL = 'http://localhost:8080';

export function usePolls(options: UsePollsOptions = {}): UsePollsResult {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Build query params
    const buildQueryParams = useCallback(() => {
        const params = new URLSearchParams();

        if (options.creator) {
            params.append('creator', options.creator);
        }

        if (options.closed !== undefined) {
            params.append('closed', options.closed.toString());
        }

        return params.toString() ? `?${params.toString()}` : '';
    }, [options.creator, options.closed]);

    // Fetch polls function
    const fetchPolls = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const queryParams = buildQueryParams();
            const response = await fetch(`${API_BASE_URL}/api/polls${queryParams}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to fetch polls');
            }

            const data = await response.json();
            setPolls(data);
        } catch (err) {
            console.error('Error fetching polls:', err);
            setError(err.message || 'An error occurred while fetching polls');
        } finally {
            setIsLoading(false);
        }
    }, [buildQueryParams]);

    // Close a poll
    const closePoll = async (pollId: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/polls/${pollId}/close`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to close poll');
            }

            // Update local state
            setPolls(currentPolls =>
                currentPolls.map(poll =>
                    poll.id === pollId ? { ...poll, is_closed: true } : poll
                )
            );

            return true;
        } catch (err) {
            console.error('Error closing poll:', err);
            setError(err.message || 'An error occurred while closing the poll');
            return false;
        }
    };

    // Reset poll votes
    const resetPolls = async (pollId: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/polls/${pollId}/reset`, {
                method: 'POST',
                credentials: 'include',
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to reset poll');
            }

            // Update local state
            setPolls(currentPolls =>
                currentPolls.map(poll => {
                    if (poll.id === pollId) {
                        return {
                            ...poll,
                            total_votes: 0,
                            options: poll.options.map(opt => ({ ...opt, votes: 0 }))
                        };
                    }
                    return poll;
                })
            );

            return true;
        } catch (err) {
            console.error('Error resetting poll:', err);
            setError(err.message || 'An error occurred while resetting the poll');
            return false;
        }
    };

    // Initial fetch
    useEffect(() => {
        if (options.initialFetch !== false) {
            fetchPolls();
        }
    }, [fetchPolls, options.initialFetch]);

    return {
        polls,
        isLoading,
        error,
        fetchPolls,
        resetPolls,
        closePoll,
    };
}