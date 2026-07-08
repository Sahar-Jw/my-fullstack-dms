import { SetMetadata } from '@nestjs/common';

// Marks a route as reachable even if the user still has must_change_password = true
// (login, logout, force-change-password, change-password, check-password-required)
export const SKIP_PASSWORD_CHECK_KEY = 'skipPasswordCheck';
export const SkipPasswordCheck = () =>
  SetMetadata(SKIP_PASSWORD_CHECK_KEY, true);
