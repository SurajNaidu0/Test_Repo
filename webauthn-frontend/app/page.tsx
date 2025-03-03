'use client'

import { useState, useRef } from 'react'

declare global {
    interface Window {
        Base64: any;
    }
}

export default function Home() {
    const [flashMessage, setFlashMessage] = useState('')
    const usernameRef = useRef<HTMLInputElement>(null)

    // This function mimics your original register function
    const register = async () => {
        const username = usernameRef.current?.value || '';
        if (username === "") {
            alert("Please enter a username");
            return;
        }

        try {
            // Important: We need to include credentials to ensure cookies are sent and received
            const response = await fetch('/register_start/' + encodeURIComponent(username), {
                method: 'POST',
                credentials: 'include',  // This is critical for cookie handling
            });

            const credentialCreationOptions = await response.json();

            // Convert base64 encoded data
            credentialCreationOptions.publicKey.challenge = window.Base64.toUint8Array(credentialCreationOptions.publicKey.challenge);
            credentialCreationOptions.publicKey.user.id = window.Base64.toUint8Array(credentialCreationOptions.publicKey.user.id);

            if (credentialCreationOptions.publicKey.excludeCredentials) {
                credentialCreationOptions.publicKey.excludeCredentials.forEach(function (listItem: any) {
                    listItem.id = window.Base64.toUint8Array(listItem.id);
                });
            }

            // Create credentials
            const credential: any = await navigator.credentials.create({
                publicKey: credentialCreationOptions.publicKey
            });

            // Send the response back to the server
            const finishResponse = await fetch('/register_finish', {
                method: 'POST',
                credentials: 'include',  // This is critical for cookie handling
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: credential.id,
                    rawId: window.Base64.fromUint8Array(new Uint8Array(credential.rawId), true),
                    type: credential.type,
                    response: {
                        attestationObject: window.Base64.fromUint8Array(new Uint8Array(credential.response.attestationObject), true),
                        clientDataJSON: window.Base64.fromUint8Array(new Uint8Array(credential.response.clientDataJSON), true),
                    },
                })
            });

            if (finishResponse.ok) {
                setFlashMessage("Successfully registered!");
            } else {
                const errorText = await finishResponse.text();
                setFlashMessage(`Error whilst registering: ${errorText}`);
            }
        } catch (error) {
            console.error("Registration error:", error);
            setFlashMessage(`Error whilst registering: ${error.message}`);
        }
    }

    // This function mimics your original login function
    const login = async () => {
        const username = usernameRef.current?.value || '';
        if (username === "") {
            alert("Please enter a username");
            return;
        }

        try {
            const response = await fetch('/login_start/' + encodeURIComponent(username), {
                method: 'POST',
                credentials: 'include',  // This is critical for cookie handling
            });

            const credentialRequestOptions = await response.json();

            // Convert base64 encoded data
            credentialRequestOptions.publicKey.challenge = window.Base64.toUint8Array(credentialRequestOptions.publicKey.challenge);

            if (credentialRequestOptions.publicKey.allowCredentials) {
                credentialRequestOptions.publicKey.allowCredentials.forEach(function (listItem: any) {
                    listItem.id = window.Base64.toUint8Array(listItem.id);
                });
            }

            // Get assertion
            const assertion: any = await navigator.credentials.get({
                publicKey: credentialRequestOptions.publicKey
            });

            // Send the response back to the server
            const finishResponse = await fetch('/login_finish', {
                method: 'POST',
                credentials: 'include',  // This is critical for cookie handling
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: assertion.id,
                    rawId: window.Base64.fromUint8Array(new Uint8Array(assertion.rawId), true),
                    type: assertion.type,
                    response: {
                        authenticatorData: window.Base64.fromUint8Array(new Uint8Array(assertion.response.authenticatorData), true),
                        clientDataJSON: window.Base64.fromUint8Array(new Uint8Array(assertion.response.clientDataJSON), true),
                        signature: window.Base64.fromUint8Array(new Uint8Array(assertion.response.signature), true),
                        userHandle: assertion.response.userHandle ?
                            window.Base64.fromUint8Array(new Uint8Array(assertion.response.userHandle), true) : ""
                    },
                }),
            });

            if (finishResponse.ok) {
                setFlashMessage("Successfully logged in!");
            } else {
                const errorText = await finishResponse.text();
                setFlashMessage(`Error whilst logging in: ${errorText}`);
            }
        } catch (error) {
            console.error("Login error:", error);
            setFlashMessage(`Error whilst logging in: ${error.message}`);
        }
    }

    return (
        <main className="p-4">
            <p className="mb-4">Welcome to the WebAuthn Server!</p>

            <div className="mb-4">
                <input
                    type="text"
                    id="username"
                    ref={usernameRef}
                    placeholder="Enter your username here"
                    className="border px-2 py-1 mr-2"
                />
                <button
                    onClick={register}
                    className="border px-2 py-1 mr-2"
                >
                    Register
                </button>
                <button
                    onClick={login}
                    className="border px-2 py-1"
                >
                    Login
                </button>
            </div>

            <div>
                <p id="flash_message">{flashMessage}</p>
            </div>
        </main>
    )
}