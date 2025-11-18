/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Abilita immagini da fonti esterne (per avatar, mappe, ecc)
  images: {
    domains: [
      'avatars.githubusercontent.com', // GitHub login
      'lh3.googleusercontent.com',     // Google login
      'cdn.supabase.com',              // Supabase avatar/defaults
      'avatars.dicebear.com',          // Opzione avatar fallback
      // Aggiungi altri domini se usi immagini esterne/mappe custom
    ]
  },
  // Attiva i tipi avanzati se usi TS (opzionale)
  typescript: {
    ignoreBuildErrors: false,
  }
};

module.exports = nextConfig;
