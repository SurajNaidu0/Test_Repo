// Utility functions for WebAuthn authentication

const baseUrl = 'http://localhost:8080';

// Helper function to normalize and convert Base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
    // Replace URL-safe characters with standard Base64 characters
    let normalizedBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');

    // Add padding if necessary
    const paddingNeeded = (4 - (normalizedBase64.length % 4)) % 4;
    normalizedBase64 += '='.repeat(paddingNeeded);

    try {
        const binaryString = atob(normalizedBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    } catch (error) {
        console.error('Base64 decoding error:', error, 'Input:', base64);
        throw error;
    }
}

// Helper function to convert Uint8Array to base64
function uint8ArrayToBase64(array: Uint8Array): string {
    const binary = String.fromCharCode.apply(null, Array.from(array));
    return btoa(binary);
}

export async function registerUser(username: string) {
    try {
        console.log('Starting registration for:', username);
        const startResponse = await fetch(`${baseUrl}/register_start/${encodeURIComponent(username)}`, {
            method: 'POST',
            credentials: 'include',
        });

        console.log('Start response status:', startResponse.status);
        if (!startResponse.ok) {
            const errorText = await startResponse.text();
            console.error('Start response error:', errorText);
            throw new Error(errorText);
        }

        const credentialCreationOptions = await startResponse.json();
        console.log('Credential options:', credentialCreationOptions);

        // Convert base64-encoded values to Uint8Array
        credentialCreationOptions.publicKey.challenge = base64ToUint8Array(
            credentialCreationOptions.publicKey.challenge
        );
        credentialCreationOptions.publicKey.user.id = base64ToUint8Array(
            credentialCreationOptions.publicKey.user.id
        );
        credentialCreationOptions.publicKey.excludeCredentials?.forEach((cred: any) => {
            cred.id = base64ToUint8Array(cred.id);
        });

        // Create credential
        const credential = await navigator.credentials.create({
            publicKey: credentialCreationOptions.publicKey,
        }) as PublicKeyCredential;

        if (!credential) throw new Error('Credential creation failed');

        console.log('Credential created:', credential);

        // Finish registration
        const finishResponse = await fetch(`${baseUrl}/register_finish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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

        console.log('Finish response status:', finishResponse.status);
        if (!finishResponse.ok) {
            const errorText = await finishResponse.text();
            console.error('Finish response error:', errorText);
            throw new Error(errorText);
        }
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}
export async function loginUser(username: string) {
    // Start authentication
    const startResponse = await fetch(`${baseUrl}/login_start/${encodeURIComponent(username)}`, {
        method: 'POST',
        credentials: 'include',
    });

    if (!startResponse.ok) {
        throw new Error(await startResponse.text());
    }

    const credentialRequestOptions = await startResponse.json();

    // Convert base64-encoded values to Uint8Array
    credentialRequestOptions.publicKey.challenge = base64ToUint8Array(
        credentialRequestOptions.publicKey.challenge
    );
    credentialRequestOptions.publicKey.allowCredentials?.forEach((cred: any) => {
        cred.id = base64ToUint8Array(cred.id);
    });

    // Get credential
    const assertion = await navigator.credentials.get({
        publicKey: credentialRequestOptions.publicKey,
    }) as PublicKeyCredential;

    if (!assertion) throw new Error('Authentication failed');

    // Finish authentication
    const finishResponse = await fetch(`${baseUrl}/login_finish`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
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
                userHandle: uint8ArrayToBase64(
                    new Uint8Array((assertion.response as AuthenticatorAssertionResponse).userHandle!)
                ),
            },
        }),
        credentials: 'include',
    });

    if (!finishResponse.ok) {
        throw new Error(await finishResponse.text());
    }
}