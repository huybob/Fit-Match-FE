import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// i18n: locale lấy từ cookie nên KHÔNG dùng routing có prefix — URL giữ nguyên.
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',

  // Phase 5 (audit F-33): cho phép next/image tối ưu ảnh từ Unsplash (hero/demo)
  // và file server BE (avatar/media).
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },

  // Phase 5 (audit S-9/F-34): security headers nền — đặc biệt quan trọng khi token
  // còn ở localStorage (S-3). CSP nghiêm ngặt để dành khi chuyển token sang cookie
  // (cần kiểm thử kỹ với inline script của Next).
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
