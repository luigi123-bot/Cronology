module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@/db': './db',
            '@/components': './components',
            '@/services': './services',
            '@/store': './store',
            '@/types': './types',
            '@/constants': './constants',
          },
        },
      ],
    ],
  };
};
