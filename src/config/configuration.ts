export default () => ({
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    name: process.env.APP_NAME || 'NestJs API',
    origin: process.env.ORIGIN
      ? process.env.ORIGIN.split(',')
      : ['http://localhost:3000'],
    salt: parseInt(process.env.SALT_ROUNDS || '10', 10),
    cookie_domain: process.env.COOKIE_DOMAIN || undefined,
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },

  cloudinary: {
    name: process.env.CLOUDINARY_CLOUD_NAME,
    apikey: process.env.CLOUDINARY_API_KEY,
    apisecret: process.env.CLOUDINARY_API_SECRET,
  },

  csrf: {
    secret: process.env.CSRF_SECRET,
  },
});
