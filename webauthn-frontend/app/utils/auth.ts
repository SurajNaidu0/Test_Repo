const baseUrl = 'http://localhost:8080';

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

export async function registerUser(username: string) {
    const startResponse = await fetch(`${baseUrl}/register_start/${encodeURIComponent(username)}`, {
        method: 'POST',
        credentials: 'include',
    });
    if (!startResponse.ok) throw new Error(await startResponse.text());

    const options = await startResponse.json();
    options.publicKey.challenge = base64ToUint8Array(options.publicKey.challenge);
    options.publicKey.user.id = base64ToUint8Array(options.publicKey.user.id);
    options.publicKey.excludeCredentials?.forEach((cred: any) => {
        cred.id = base64ToUint8Array(cred.id);
    });

    const credential = await navigator.credentials.create({ publicKey: options.publicKey }) as PublicKeyCredential;
    if (!credential) throw new Error('Credential creation failed');

    const finishResponse = await fetch(`${baseUrl}/register_finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: credential.id,
            rawId: uint8ArrayToBase64(new Uint8Array(credential.rawId)),
            type: credential.type,
            response: {
                attestationObject: uint8ArrayToBase64(new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)),
                clientDataJSON: uint8ArrayToBase64(new Uint8Array((credential.response as AuthenticatorAttestationResponse).clientDataJSON)),
            },
        }),
        credentials: 'include',
    });

    if (!finishResponse.ok) throw new Error(await finishResponse.text());
}

export async function loginUser(username: string) {
    const startResponse = await fetch(`${baseUrl}/login_start/${encodeURIComponent(username)}`, {
        method: 'POST',
        credentials: 'include',
    });
    if (!startResponse.ok) throw new Error(await startResponse.text());

    const options = await startResponse.json();
    options.publicKey.challenge = base64ToUint8Array(options.publicKey.challenge);
    options.publicKey.allowCredentials?.forEach((cred: any) => {
        cred.id = base64ToUint8Array(cred.id);
    });

    const assertion = await navigator.credentials.get({ publicKey: options.publicKey }) as PublicKeyCredential;
    if (!assertion) throw new Error('Authentication failed');

    const finishResponse = await fetch(`${baseUrl}/login_finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: assertion.id,
            rawId: uint8ArrayToBase64(new Uint8Array(assertion.rawId)),
            type: assertion.type,
            response: {
                authenticatorData: uint8ArrayToBase64(new Uint8Array((assertion.response as AuthenticatorAssertionResponse).authenticatorData)),
                clientDataJSON: uint8ArrayToBase64(new Uint8Array((assertion.response as AuthenticatorAssertionResponse).clientDataJSON)),
                signature: uint8ArrayToBase64(new Uint8Array((assertion.response as AuthenticatorAssertionResponse).signature)),
                userHandle: uint8ArrayToBase64(new Uint8Array((assertion.response as AuthenticatorAssertionResponse).userHandle!)),
            },
        }),
        credentials: 'include',
    });

    if (!finishResponse.ok) throw new Error(await finishResponse.text());
}