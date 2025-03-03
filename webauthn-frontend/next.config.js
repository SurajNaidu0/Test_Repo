/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/register_start/:path*',
                destination: 'http://localhost:8080/register_start/:path*',
            },
            {
                source: '/register_finish',
                destination: 'http://localhost:8080/register_finish',
            },
            {
                source: '/login_start/:path*',
                destination: 'http://localhost:8080/login_start/:path*',
            },
            {
                source: '/login_finish',
                destination: 'http://localhost:8080/login_finish',
            },
            {
                source: '/api/:path*',
                destination: 'http://localhost:8080/api/:path*',
            }
        ]
    },
    // This is crucial for ensuring cookies are passed correctly
    async headers() {
        return [
            {
                // All routes
                source: '/:path*',
                headers: [
                    {
                        key: 'Access-Control-Allow-Credentials',
                        value: 'true',
                    },
                ],
            },
        ]
    }
}

module.exports = nextConfig