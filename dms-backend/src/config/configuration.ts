export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'dms_db',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret',
    expiresIn: process.env.JWT_EXPIRATION || '1d',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  mail: {
    host: process.env.MAIL_HOST || '',
    port: parseInt(process.env.MAIL_PORT, 10) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
    from: process.env.MAIL_FROM || 'DMS <no-reply@dms.local>',
  },
  fileUpload: {
    path: process.env.FILE_UPLOAD_PATH || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760,
    allowedMimeTypes: (
      process.env.ALLOWED_MIME_TYPES ||
      'application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ).split(','),
  },
});
