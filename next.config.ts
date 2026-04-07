const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',

  basePath: isProd ? '/Report_MHOS' : '',
  assetPrefix: isProd ? '/Report_MHOS/' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;