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
  fileUpload: {
    path: process.env.FILE_UPLOAD_PATH || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760,
    allowedMimeTypes: (
      process.env.ALLOWED_MIME_TYPES ||
      'application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ).split(','),
  },
});
