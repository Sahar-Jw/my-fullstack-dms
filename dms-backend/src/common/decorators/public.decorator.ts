import { SetMetadata } from '@nestjs/common';

// Marks a route as not requiring JWT authentication (e.g. login, reset-password)
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
