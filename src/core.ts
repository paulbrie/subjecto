/**
 * Subjecto Core - Minimal bundle
 * Contains only the Subject class without helper methods
 * Use this for the smallest possible bundle size (~2-3KB gzipped)
 */

export { Subject } from './subject'
export type {
  SubjectSubscription,
  SubscriptionHandle,
  SubjectConstructorOptions,
} from './subject'
