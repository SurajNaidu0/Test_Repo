// webauthn-frontend/app/utils/auth.ts
import { useAuthStore } from '../store';

const baseUrl = 'http://localhost:8080';

// Improved error handling with typed errors
export class AuthError extends Error {
    public status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = 'AuthError';
        this.status = status;
    }
}

function base64ToUint8Array(base64: string): Uint8Array {
    let normalizedBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');
    const paddingNeeded = (4 - (normalizedBase64.length % 4)) % 4;
    normalizedBase64 += '='.repeat(paddingNeeded);
    const binaryString = atob(normalizedBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function uint8ArrayToBase64(array: Uint8Array): string {
    const binary = String.fromCharCode.apply(null, Array.from(array));
    return btoa(binary);
}

// Check if the browser supports WebAuthn
export function isWebAuthnSupported(): boolean {
    return typeof window !== 'undefined' &&
        window.PublicKeyCredential !== undefined &&
        typeof window.PublicKeyCredential === 'function';
}

// Helper for handling API responses
async function handleApiResponse(response: Response): Promise<any> {
    if (!response.ok) {
        const errorText = await response.text();
        throw new AuthError(errorText || 'Authentication operation failed', response.status);
    }

    return response.headers.get('content-type')?.includes('application/json')
        ? response.json()
        : {};
}

export async function registerUser(username: string): Promise<void> {
    if (!isWebAuthnSupported()) {
        throw new AuthError('Your browser does not support passkeys. Please use a modern browser.');
    }

    try {
        // Step 1: Start registration
        const startResponse = await fetch(`${baseUrl}/register_start/${encodeURIComponent(username)}`, {
            method: 'POST',
            credentials: 'include',
        });

        const options = await handleApiResponse(startResponse);

        // Step 2: Prepare credential creation options
        options.publicKey.challenge = base64ToUint8Array(options.publicKey.challenge);
        options.publicKey.user.id = base64ToUint8Array(options.publicKey.user.id);

        if (options.publicKey.excludeCredentials) {
            options.publicKey.excludeCredentials.forEach((cred: any) => {
                cred.id = base64ToUint8Array(cred.id);
            });
        }

        // Step 3: Create credential
        const credential = await navigator.credentials.create({
            publicKey: options.publicKey
        }) as PublicKeyCredential;

        if (!credential) {
            throw new AuthError('Credential creation failed');
        }

        // Step 4: Finish registration
        const finishResponse = await fetch(`${baseUrl}/register_finish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: credential.id,
                rawId: uint8ArrayToBase64(new Uint8Array(credential.rawId)),
                type: credential.type,
                response: {
                    attestationObject: uint8ArrayToBase64(
                        new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)
                    ),
                    clientDataJSON: uint8ArrayToBase64(
                        new Uint8Array((credential.response as AuthenticatorAttestationResponse).clientDataJSON)
                    ),
                },
            }),
            credentials: 'include',
        });

        await handleApiResponse(finishResponse);
    } catch (error) {
        // Re-throw with better error messaging
        if (error instanceof AuthError) {
            throw error;
        }

        throw new AuthError(`Registration failed: ${error.message}`);
    }
}

export async function loginUser(username: string): Promise<void> {
    if (!isWebAuthnSupported()) {
        throw new AuthError('Your browser does not support passkeys. Please use a modern browser.');
    }

    try {
        // Step 1: Start authentication
        const startResponse = await fetch(`${baseUrl}/login_start/${encodeURIComponent(username)}`, {
            method: 'POST',
            credentials: 'include',
        });

        const options = await handleApiResponse(startResponse);

        // Step 2: Prepare credential request options
        options.publicKey.challenge = base64ToUint8Array(options.publicKey.challenge);

        if (options.publicKey.allowCredentials) {
            options.publicKey.allowCredentials.forEach((cred: any) => {
                cred.id = base64ToUint8Array(cred.id);
            });
        }

        // Step 3: Get credential
        const assertion = await navigator.credentials.get({
            publicKey: options.publicKey
        }) as PublicKeyCredential;

        if (!assertion) {
            throw new AuthError('Authentication failed');
        }

        // Step 4: Finish authentication
        const finishResponse = await fetch(`${baseUrl}/login_finish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: assertion.id,
                rawId: uint8ArrayToBase64(new Uint8Array(assertion.rawId)),
                type: assertion.type,
                response: {
                    authenticatorData: uint8ArrayToBase64(
                        new Uint8Array((assertion.response as AuthenticatorAssertionResponse).authenticatorData)
                    ),
                    clientDataJSON: uint8ArrayToBase64(
                        new Uint8Array((assertion.response as AuthenticatorAssertionResponse).clientDataJSON)
                    ),
                    signature: uint8ArrayToBase64(
                        new Uint8Array((assertion.response as AuthenticatorAssertionResponse).signature)
                    ),
                    userHandle: assertion.response && (assertion.response as AuthenticatorAssertionResponse).userHandle
                        ? uint8ArrayToBase64(new Uint8Array((assertion.response as AuthenticatorAssertionResponse).userHandle!))
                        : '',
                },
            }),
            credentials: 'include',
        });

        await handleApiResponse(finishResponse);

        // Update auth state in Zustand store
        useAuthStore.getState().setLoggedIn(true);
    } catch (error) {
        // Re-throw with better error messaging
        if (error instanceof AuthError) {
            throw error;
        }

        throw new AuthError(`Login failed: ${error.message}`);
    }
}

export async function logoutUser(): Promise<void> {
    try {
        const response = await fetch(`${baseUrl}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });

        await handleApiResponse(response);

        // Update auth state in Zustand store
        useAuthStore.getState().setLoggedIn(false, null);
    } catch (error) {
        throw new AuthError(`Logout failed: ${error.message}`);
    }
}

// Helper to verify authentication status
export async function checkAuthStatus(): Promise<boolean> {
    try {
        const response = await fetch(`${baseUrl}/api/polls?creator=me`, {
            credentials: 'include',
        });

        const isAuthenticated = response.ok;
        useAuthStore.getState().setLoggedIn(isAuthenticated);
        return isAuthenticated;
    } catch (error) {
        useAuthStore.getState().setLoggedIn(false);
        return false;
    }
}