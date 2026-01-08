/**
 * Combined Auth Hook
 * For convenience when you need both state and API
 */

import { useAuthState, type AuthState } from './AuthStateContext';
import { useAuthAPI, type AuthAPI } from './AuthAPIContext';

export function useAuth(): AuthState & AuthAPI {
  return { ...useAuthState(), ...useAuthAPI() };
}
