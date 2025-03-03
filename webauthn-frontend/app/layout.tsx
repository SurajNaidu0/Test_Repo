import './globals.css'

export const metadata = {
    title: 'WebAuthn-rs Tutorial',
    description: 'WebAuthn Authentication Demo',
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
        <head>
            <script
                src="https://cdn.jsdelivr.net/npm/js-base64@3.7.4/base64.min.js"
                integrity="sha384-VkKbwLiG7C18stSGuvcw9W0BHk45Ba7P9LJG5c01Yo4BI6qhFoWSa9TQLNA6EOzI"
                crossOrigin="anonymous"
            ></script>
        </head>
        <body>{children}</body>
        </html>
    )
}