export default () => ({
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    name: process.env.APP_NAME || 'NestJs API',
    origin: process.env.ORIGIN || 'http://localhost:3000',
    salt: parseInt(process.env.SALT_ROUNDS || '10', 10),
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
});
