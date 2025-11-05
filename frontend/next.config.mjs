/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: [
            "pdf-parse",
            "canvas",
            "@napi-rs/canvas",
        ],
    },
};

export default nextConfig;
