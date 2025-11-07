/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        staleTimes: {
            dynamic: 120,
            static: 120,
        },
        serverComponentsExternalPackages: [
            "pdf-parse",
            "canvas",
            "@napi-rs/canvas",
        ],
    },
};

export default nextConfig;
