import { AuthUser } from '../interfaces/auth-user.interface';

// Reuse the project's existing AuthUser shape (returned by JwtStrategy.validate())
// instead of inventing a new one. Extending Express.User is an interface merge,
// which TypeScript actually applies — redeclaring Request.user as a new type
// is not, which was the root cause of every error so far.
declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

export {};