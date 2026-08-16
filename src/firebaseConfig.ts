/**
 * @deprecated Import Firebase through `@/services/firebase/app` in new code.
 *
 * This compatibility module intentionally no longer contains hard-coded
 * placeholder credentials. Firebase client configuration is read from the
 * Expo environment defined in `.env.example`.
 */
export {
  getFirebaseServices,
  isFirebaseConfigured,
} from '@/services/firebase/app';
