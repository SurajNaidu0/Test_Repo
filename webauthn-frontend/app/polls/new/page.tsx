// webauthn-frontend/app/polls/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store';
import { checkAuthStatus } from '../../utils/auth';

export default function NewPoll() {
    const [title, setTitle] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState<{title?: string, options?: string[]}>({});
    const router = useRouter();
    const { isLoggedIn } = useAuthStore();

    // Check authentication status on page load
    useEffect(() => {
        const verifyAuth = async () => {
            const isAuthenticated = await checkAuthStatus();
            if (!isAuthenticated) {
                setMessage('You need to be logged in to create polls');
                router.push('/login');
            }
        };

        verifyAuth();
    }, [router]);

    // Validate form data
    const validateForm = () => {
        const newErrors: {title?: string, options?: string[]} = {};
        let isValid = true;

        // Validate title
        if (!title.trim()) {
            newErrors.title = 'Title is required';
            isValid = false;
        } else if (title.length < 3) {
            newErrors.title = 'Title must be at least 3 characters';
            isValid = false;
        }

        // Validate options
        const optionErrors: string[] = [];
        const filteredOptions = options.filter(opt => opt.trim().length > 0);

        if (filteredOptions.length < 2) {
            optionErrors.push('At least 2 options are required');
            isValid = false;
        }

        // Check for duplicate options
        const uniqueOptions = new Set(filteredOptions.map(opt => opt.trim().toLowerCase()));
        if (uniqueOptions.size < filteredOptions.length) {
            optionErrors.push('All options must be unique');
            isValid = false;
        }

        // Check individual options
        options.forEach((option, index) => {
            if (!option.trim() && index < 2) {
                optionErrors[index] = 'This option is required';
                isValid = false;
            } else if (option.trim().length > 0 && option.trim().length < 2) {
                optionErrors[index] = 'Option must be at least 2 characters';
                isValid = false;
            }
        });

        if (optionErrors.length > 0) {
            newErrors.options = optionErrors;
        }

        setErrors(newErrors);
        return isValid;
    };

    // Add a new option
    const addOption = () => {
        setOptions([...options, '']);
    };

    // Remove an option
    const removeOption = (index: number) => {
        if (options.length <= 2) {
            setMessage('At least 2 options are required');
            return;
        }

        const newOptions = [...options];
        newOptions.splice(index, 1);
        setOptions(newOptions);
    };

    // Update an option
    const updateOption = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    // Handle form submission
    const handleCreatePoll = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        if (!validateForm()) {
            return;
        }

        try {
            setIsSubmitting(true);
            const filteredOptions = options.filter(opt => opt.trim().length > 0);

            const res = await fetch('http://localhost:8080/api/polls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, options: filteredOptions }),
                credentials: 'include',
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || 'Failed to create poll');
            }

            const data = await res.json();
            setMessage(`Poll created successfully!`);

            // Redirect to the new poll after a short delay
            setTimeout(() => {
                router.push(`/polls/${data.poll_id}`);
            }, 1500);
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // If not logged in, show a message
    if (!isLoggedIn) {
        return (
            <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
                    <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
                    <p className="mb-6">You need to be logged in to create a poll.</p>
                    <div className="flex justify-center space-x-4">
                        <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                            Login
                        </Link>
                        <Link href="/" className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Create New Poll</h1>
                    <Link href="/" className="text-blue-500 hover:underline">
                        Back to Home
                    </Link>
                </div>

                <form onSubmit={handleCreatePoll}>
                    <div className="mb-6">
                        <label htmlFor="poll-title" className="block text-sm font-medium text-gray-700 mb-1">
                            Poll Title*
                        </label>
                        <input
                            id="poll-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter a question or topic for your poll"
                            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-300 focus:outline-none
                                ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                            disabled={isSubmitting}
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                        )}
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Poll Options* (minimum 2)
                        </label>

                        {options.map((option, index) => (
                            <div key={index} className="flex mb-2">
                                <div className="flex-grow">
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-500">
                                            {index + 1}.
                                        </span>
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => updateOption(index, e.target.value)}
                                            placeholder={`Option ${index + 1}`}
                                            className={`w-full p-3 pl-8 border rounded-md focus:ring-2 focus:ring-blue-300 focus:outline-none
                                                ${errors.options && errors.options[index] ? 'border-red-500' : 'border-gray-300'}`}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    {errors.options && errors.options[index] && (
                                        <p className="mt-1 text-sm text-red-600">{errors.options[index]}</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeOption(index)}
                                    className="ml-2 p-3 text-red-500 hover:text-red-700 disabled:text-gray-400"
                                    disabled={options.length <= 2 || isSubmitting}
                                    aria-label="Remove option"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        {errors.options && !Array.isArray(errors.options) && (
                            <p className="mt-1 text-sm text-red-600">{errors.options}</p>
                        )}

                        <button
                            type="button"
                            onClick={addOption}
                            className="mt-2 flex items-center text-blue-500 hover:text-blue-700 disabled:text-gray-400"
                            disabled={isSubmitting}
                        >
                            <span className="text-xl mr-1">+</span> Add Another Option
                        </button>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className={`px-6 py-3 rounded-md text-white font-medium
                                ${isSubmitting
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600'}`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating Poll...' : 'Create Poll'}
                        </button>
                    </div>
                </form>

                {message && (
                    <div className={`mt-4 p-4 rounded-md ${message.includes('Error')
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'}`}
                    >
                        {message}
                    </div>
                )}
            </div>
        </main>
    );
}