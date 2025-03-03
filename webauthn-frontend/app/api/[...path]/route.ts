import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    const path = params.path.join('/');
    const apiUrl = `http://localhost:8080/${path}${request.nextUrl.search}`;

    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            ...Object.fromEntries(request.headers),
            'host': 'localhost:8080',
        },
    });

    const data = await response.text();

    // Create a new response with the data
    const newResponse = new NextResponse(data, {
        status: response.status,
        statusText: response.statusText,
    });

    // Forward all headers from the original response
    response.headers.forEach((value, key) => {
        newResponse.headers.set(key, value);
    });

    return newResponse;
}

export async function POST(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    const path = params.path.join('/');
    const apiUrl = `http://localhost:8080/${path}`;

    const body = await request.text();

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            ...Object.fromEntries(request.headers),
            'host': 'localhost:8080',
            'content-type': request.headers.get('content-type') || 'application/json',
        },
        body: body,
    });

    const data = await response.text();

    // Create a new response with the data
    const newResponse = new NextResponse(data, {
        status: response.status,
        statusText: response.statusText,
    });

    // Forward all headers from the original response
    response.headers.forEach((value, key) => {
        newResponse.headers.set(key, value);
    });

    // Forward cookies (most important for session)
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
        newResponse.headers.set('set-cookie', cookies);
    }

    return newResponse;
}