import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production')
    .default('development'),

  APP_NAME: Joi.string().default('NestJs-api'),

  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().uri().required(),
});
