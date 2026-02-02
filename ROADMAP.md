# Detour App - Production Roadmap

## Current State Assessment: 5/10

### Overview

Detour is a React Native/Expo dating app targeting digital nomads. The current codebase represents a **polished UI prototype with backend foundation** - excellent visual design, complete navigation flow, comprehensive component architecture, and now includes Convex backend infrastructure with database schema and core API functions.

---

## Detailed Scoring Breakdown

| Category | Score | Assessment |
|----------|-------|------------|
| **UI/UX Design** | 9/10 | Excellent design system, consistent branding, polished components |
| **Type Safety** | 8/10 | Strict TypeScript throughout, well-typed interfaces |
| **Component Architecture** | 8/10 | Clean separation of concerns, reusable components, consistent patterns |
| **Code Organization** | 8/10 | Logical folder structure, clear naming conventions, well-structured screens |
| **Performance** | 7/10 | New Architecture enabled, expo-image with caching for optimized image loading |
| **Accessibility** | 5/10 | Basic safe area support, needs enhancement |
| **Error Handling** | 2/10 | Minimal try-catch, no error boundaries |
| **Security** | 2/10 | No auth system yet, sensitive data in plain context |
| **Documentation** | 3/10 | CLAUDE.md exists with project guidance |
| **Backend Integration** | 4/10 | Convex backend set up with schema, queries, and mutations |
| **Data Persistence** | 3/10 | Convex database ready, not yet connected to UI |
| **Testing** | 0/10 | Zero test files exist |
| **Payment System** | 0/10 | UI only, non-functional |
| **Authentication** | 1/10 | UI flow complete, backend auth not implemented |
| **CI/CD Pipeline** | 0/10 | No automation exists |

**Overall Score: 5/10** - High-fidelity prototype with backend foundation, not yet production-ready

---

## What's Currently Implemented

### Completed Features (UI Only)

- **Landing & Authentication Flow** ✅ Complete
  - Landing page with "Join Detour" and "Already a member? Login" options
  - Auth page with phone, Google, and Apple sign-in options
  - Separate flows for new users (onboarding) vs returning users (direct to app)
  - Application-only gate explaining the review process
  - Invite code validation system with skip-the-waitlist option

- **15-Step Onboarding Flow** ✅ Complete
  - Landing screen with join/login options
  - Application-only explanation page
  - Invite code entry (optional fast-track)
  - Auth screen with phone, Google, Apple options
  - Username selection
  - Name, birthday, gender selection
  - Relationship intent (friends/dating/both) and dating preferences
  - Lifestyle selection (van life, digital nomad, backpacker, etc.)
  - Time nomadic duration
  - Interests selection (80+ interest options with categories)
  - Photo upload (up to 6 photos)
  - Instagram linking (optional)
  - Location detection with GPS
  - Future trip destination
  - Paywall screen with subscription tiers
  - Onboarding completion screen

- **5-Tab Main Navigation** ✅ Complete & Polished
  - **Nearby**: Profile discovery cards with like/pass buttons, location display, lifestyle tags, distance indicator, online status
  - **Explore**:
    - "Heading your way" section showing users traveling to your future destination with arrival dates
    - "Recommended activities" section with interest-based filtering (surfing, yoga, coffee, hiking, etc.)
    - Activity cards with host info, date/time, location, attendee count
  - **Matches/Connections**:
    - Tab toggle between matches and messages
    - "Likes you" section with blurred photos (premium feature gate)
    - "Your matches" list with match timestamps
    - Message conversations list with unread counts, online status, timestamps
  - **Help/Marketplace**: Community help requests feed for nomad services (repairs, electrical, builds) with budgets, urgency tags, response counts, category filtering
  - **Profile**:
    - User photo with camera edit button
    - Username and location display
    - Instagram link display
    - Stats bar (connections, photos, lifestyles)
    - Lifestyle and interests display with labels
    - Recent profile viewers (stacked avatars)
    - Slide-up settings menu with edit profile, settings, privacy, help options
    - Logout functionality with data reset

- **Design System** ✅ Complete
  - Custom Button, Input, SelectionChip components
  - OnboardingLayout wrapper with progress tracking
  - ProgressBar with gradient
  - Consistent theme (orange primary #fd6b03, Instrument fonts)
  - NativeWind/Tailwind styling throughout
  - Animated modals and slide-up sheets
  - Card shadows and visual polish

### Backend Infrastructure (NEW) ✅ Foundation Complete

- **Convex Backend** - Real-time database and serverless functions
  - Database schema defined for users, matches, messages, swipes, inviteCodes
  - User CRUD operations (create, update, getById, getByUsername, getByEmail, getByPhone)
  - Discovery queries (getNearbyUsers, getDiscoverUsers)
  - Invite code system (validate, use, create, deactivate)
  - Swipe system with automatic match detection
  - Match queries with user data population
  - Messaging system (send, getByMatch, markAsRead, getUnreadCount)
  - Seed function for test invite codes (NOMAD2024, DETOUR, WANDERER, EXPLORER, DEVTEST)
  - ConvexProvider integrated into app root

### Remaining Work

| Feature | Status | Impact |
|---------|--------|--------|
| Backend-UI Connection | In Progress | Connect Convex to UI components |
| User Authentication | Not started | Convex Auth or third-party needed |
| Real Messaging UI | Not started | Backend ready, UI needs connection |
| Matching Algorithm | Partial | Basic mutual-like matching exists |
| Payment Processing | Not started | No revenue capability |
| Push Notifications | Not started | Engagement critical |
| Test Suite | Not started | High risk for changes |
| Error Monitoring | Not started | Blind to production issues |

---

## Roadmap to Production (10/10)

### Phase 1: Foundation (Weeks 1-3)
**Goal: Establish critical infrastructure**

#### Week 1: Development Infrastructure

- [ ] **1.1 Set up testing framework**
  - Install Jest and React Native Testing Library
  - Configure test environment for Expo
  - Create test utilities and mocks
  - Add npm scripts for test execution

- [ ] **1.2 Add error boundaries**
  - Create global ErrorBoundary component
  - Implement fallback UI for crashes
  - Add error logging utility

- [ ] **1.3 Implement local storage**
  - Install and configure AsyncStorage
  - Create storage service abstraction
  - Persist onboarding progress locally
  - Add data migration utilities

- [ ] **1.4 Environment configuration**
  - Create `.env.example` with required variables
  - Set up environment-specific configs (dev, staging, prod)
  - Configure Expo env var handling

- [ ] **1.5 Documentation foundation**
  - Create README with setup instructions
  - Document folder structure
  - Add CONTRIBUTING.md guidelines

#### Week 2: Backend Design & Setup

- [x] **2.1 Design API specification** ✅ COMPLETE
  - Data models defined in Convex schema (User, Match, Message, Swipe, InviteCode)
  - Query and mutation functions created
  - Type-safe API with Convex validators

- [x] **2.2 Choose and set up backend** ✅ COMPLETE (Convex)
  - Convex selected as backend-as-a-service
  - Real-time database with automatic syncing
  - Serverless functions for business logic
  - Development environment deployed

- [x] **2.3 Database schema design** ✅ COMPLETE
  - Users table (auth, profile data, status)
  - Matches table (user pairs, status, timestamps)
  - Messages table (conversations, read receipts)
  - Swipes table (like/pass/superlike actions)
  - InviteCodes table (code management, usage tracking)
  - Indexes for efficient queries (by_username, by_email, by_location, etc.)

- [ ] **2.4 Set up CI/CD pipeline**
  - GitHub Actions for linting and tests
  - Automated build verification
  - Branch protection rules

#### Week 3: Authentication System

- [ ] **3.1 Implement phone authentication**
  - SMS verification service (Twilio/Firebase)
  - OTP input screen
  - Session token management
  - Secure token storage (expo-secure-store)

- [ ] **3.2 Implement social authentication**
  - Google Sign-In integration
  - Apple Sign-In integration
  - Account linking for multiple providers

- [ ] **3.3 Session management**
  - JWT token handling
  - Token refresh logic
  - Auto-logout on token expiry
  - Biometric authentication option

- [ ] **3.4 Auth context and state**
  - AuthContext provider
  - Protected route handling
  - Login/logout flow integration

---

### Phase 2: Core Features (Weeks 4-8)
**Goal: Implement fundamental app functionality**

#### Week 4: Profile Management

- [ ] **4.1 Profile API integration**
  - Create profile endpoint
  - Update profile endpoint
  - Fetch profile endpoint
  - Delete profile endpoint

- [ ] **4.2 Photo upload system**
  - Cloud storage integration (S3/Firebase Storage)
  - Image compression and optimization
  - Upload progress indicators
  - Photo reordering capability

- [ ] **4.3 Profile completion flow**
  - Save onboarding data to backend
  - Profile completeness indicator
  - Edit profile screen implementation
  - Profile preview feature

- [ ] **4.4 Location services**
  - Real-time location updates
  - Background location tracking (opt-in)
  - Location privacy controls
  - Travel plan storage

#### Week 5: Discovery & Matching

- [ ] **5.1 Profile discovery API**
  - Fetch nearby profiles endpoint
  - Location-based filtering
  - Interest-based matching weights
  - Pagination for large result sets

- [ ] **5.2 Matching algorithm**
  - Compatibility scoring system
  - Travel overlap detection
  - Interest matching logic
  - Filter preferences (age, distance, intent)

- [ ] **5.3 Like/Pass system**
  - Record user actions
  - Match detection (mutual likes)
  - Match notification trigger
  - Undo last action feature

- [ ] **5.4 Swipe UI enhancements**
  - Gesture-based swipe (react-native-gesture-handler)
  - Animation polish with Reanimated
  - Profile detail modal
  - Report/block functionality

#### Week 6: Messaging System

- [ ] **6.1 Real-time messaging backend**
  - WebSocket server setup
  - Message delivery system
  - Read receipt tracking
  - Typing indicators

- [ ] **6.2 Chat UI implementation**
  - Individual chat screen
  - Message bubbles and timestamps
  - Image/GIF sharing
  - Message reactions

- [ ] **6.3 Conversation management**
  - Conversation list with last message
  - Unread count badges
  - Archive/delete conversations
  - Block user from conversation

- [ ] **6.4 Push notifications setup**
  - Expo Notifications configuration
  - FCM (Android) / APNs (iOS) setup
  - Notification permission flow
  - In-app notification handling

#### Week 7: Premium Features & Payments

- [ ] **7.1 Payment integration**
  - RevenueCat SDK setup (recommended)
  - Or native IAP implementation
  - Subscription products configuration
  - Price localization

- [ ] **7.2 Subscription management**
  - Purchase flow implementation
  - Receipt validation (server-side)
  - Subscription status checking
  - Restore purchases functionality

- [ ] **7.3 Premium feature gating**
  - "Likes You" section unlock
  - Unlimited likes unlock
  - Super like feature
  - Travel destination boost

- [ ] **7.4 Paywall optimization**
  - A/B testing capability
  - Trial period handling
  - Upgrade prompts throughout app
  - Subscription expiry handling

#### Week 8: Testing & Quality

- [ ] **8.1 Unit tests (target: 60% coverage)**
  - Component tests (Button, Input, etc.)
  - Context tests (Auth, Onboarding)
  - Utility function tests
  - API service tests

- [ ] **8.2 Integration tests**
  - Onboarding flow tests
  - Authentication flow tests
  - Profile creation tests
  - Matching flow tests

- [ ] **8.3 E2E tests setup**
  - Detox or Maestro configuration
  - Critical user journey tests
  - Smoke test suite

- [ ] **8.4 Code quality improvements**
  - ESLint rule enhancements
  - Prettier configuration
  - Pre-commit hooks (husky)
  - Code review checklist

---

### Phase 3: Polish & Security (Weeks 9-12)
**Goal: Production-grade reliability and security**

#### Week 9: Error Handling & Monitoring

- [ ] **9.1 Crash reporting**
  - Sentry integration
  - Error boundary improvements
  - Breadcrumb logging
  - Release tracking

- [ ] **9.2 Analytics integration**
  - Firebase Analytics or Mixpanel
  - Screen tracking
  - Event tracking (matches, messages, etc.)
  - Funnel analysis setup

- [ ] **9.3 Performance monitoring**
  - App startup time tracking
  - Screen render performance
  - API latency monitoring
  - Memory usage tracking

- [ ] **9.4 User feedback system**
  - In-app feedback form
  - App store review prompts (strategic timing)
  - Bug report functionality
  - Feature request collection

#### Week 10: Security Hardening

- [ ] **10.1 Security audit**
  - OWASP Mobile Top 10 review
  - Dependency vulnerability scan
  - API security review
  - Penetration testing

- [ ] **10.2 Data protection**
  - Encrypt sensitive local data
  - Secure API communications (certificate pinning)
  - PII handling compliance
  - Data retention policies

- [ ] **10.3 Authentication security**
  - Rate limiting on auth endpoints
  - Brute force protection
  - Session invalidation on password change
  - Account recovery flow

- [ ] **10.4 Content moderation**
  - Photo moderation system (AI-based)
  - Report handling workflow
  - User ban/suspension system
  - Appeal process

#### Week 11: Performance Optimization

- [ ] **11.1 App performance**
  - Bundle size analysis and reduction
  - Image optimization (WebP, lazy loading)
  - Screen lazy loading
  - Memoization of expensive components

- [ ] **11.2 API optimization**
  - Response caching strategy
  - Request deduplication
  - Offline support basics
  - Background sync

- [ ] **11.3 Database optimization**
  - Query optimization
  - Indexing strategy
  - Connection pooling
  - Read replicas (if needed)

- [ ] **11.4 Load testing**
  - Concurrent user simulation
  - API endpoint stress testing
  - Database load testing
  - Identify bottlenecks

#### Week 12: Accessibility & Internationalization

- [ ] **12.1 Accessibility improvements**
  - Screen reader support (VoiceOver/TalkBack)
  - Accessibility labels on all interactive elements
  - Color contrast verification
  - Touch target sizing

- [ ] **12.2 Internationalization setup**
  - i18n framework integration (i18next)
  - String extraction
  - RTL layout support
  - Date/time localization

- [ ] **12.3 First language addition**
  - Spanish translations (large nomad demographic)
  - Translation workflow setup
  - QA process for translations

---

### Phase 4: Launch Preparation (Weeks 13-16)
**Goal: App Store ready deployment**

#### Week 13: App Store Preparation

- [ ] **13.1 iOS App Store**
  - Apple Developer account setup
  - Provisioning profiles and certificates
  - App Store Connect configuration
  - Privacy policy URL
  - App privacy nutrition labels

- [ ] **13.2 Google Play Store**
  - Google Play Console setup
  - Release signing configuration
  - Content rating questionnaire
  - Data safety section
  - Play Store listing

- [ ] **13.3 Marketing assets**
  - App icon finalization
  - Screenshot generation (all device sizes)
  - App preview video
  - Feature graphic (Android)
  - Promotional text

- [ ] **13.4 Legal requirements**
  - Terms of Service document
  - Privacy Policy (GDPR, CCPA compliant)
  - Community Guidelines
  - Age verification compliance

#### Week 14: Beta Testing

- [ ] **14.1 Internal testing**
  - TestFlight internal build
  - Google Play internal testing track
  - Team QA process
  - Bug bash sessions

- [ ] **14.2 Closed beta**
  - TestFlight external testers (100-500 users)
  - Google Play closed testing
  - Feedback collection system
  - Bug triage process

- [ ] **14.3 Open beta**
  - Expanded TestFlight
  - Google Play open testing
  - Monitor crash rates
  - Gather user feedback

- [ ] **14.4 Beta bug fixes**
  - Critical bug resolution
  - UX improvements based on feedback
  - Performance optimizations
  - Final polish

#### Week 15: Production Deployment

- [ ] **15.1 Production infrastructure**
  - Production database setup
  - CDN configuration
  - Auto-scaling configuration
  - Backup and disaster recovery

- [ ] **15.2 Monitoring setup**
  - Production Sentry environment
  - Uptime monitoring (PagerDuty/Opsgenie)
  - Database monitoring
  - Cost monitoring (cloud spend)

- [ ] **15.3 Release process**
  - Release candidate build
  - Final QA sign-off
  - App Store submission
  - Staged rollout plan

- [ ] **15.4 Launch checklist**
  - All tests passing
  - No critical bugs
  - Monitoring alerts configured
  - Support team briefed
  - Marketing ready

#### Week 16: Post-Launch

- [ ] **16.1 Monitor launch**
  - Crash rate monitoring
  - User feedback monitoring
  - Server health monitoring
  - App store reviews

- [ ] **16.2 Hotfix readiness**
  - Fast-track release process
  - Rollback procedure documented
  - On-call rotation established

- [ ] **16.3 Success metrics**
  - Daily active users (DAU)
  - User retention (Day 1, 7, 30)
  - Match rate
  - Message sent rate
  - Subscription conversion rate

- [ ] **16.4 Iteration planning**
  - Prioritize user feedback
  - Plan v1.1 features
  - Technical debt prioritization

---

## Milestone Summary

| Phase | Duration | Deliverable | Score Impact | Status |
|-------|----------|-------------|--------------|--------|
| **Phase 1** | Weeks 1-3 | Infrastructure + Auth | 4/10 → 6/10 | 🟡 In Progress (Backend done, Auth pending) |
| **Phase 2** | Weeks 4-8 | Core Features | 6/10 → 7/10 | ⬜ Not Started |
| **Phase 3** | Weeks 9-12 | Polish + Security | 7/10 → 9/10 | ⬜ Not Started |
| **Phase 4** | Weeks 13-16 | Launch | 9/10 → 10/10 | ⬜ Not Started |

---

## Tech Stack

### Backend (Selected: Convex) ✅

```
- Convex Database (real-time, reactive)
- Convex Functions (serverless queries/mutations)
- Convex File Storage (for photos - to be implemented)
- Convex Auth (to be implemented) or third-party auth
```

**Why Convex:**
- Real-time by default (automatic UI updates)
- Type-safe end-to-end with TypeScript
- No infrastructure management
- Built-in caching and optimization
- Excellent React/React Native integration

### Recommended Services

| Purpose | Recommended Service |
|---------|---------------------|
| Payments | RevenueCat |
| Analytics | Mixpanel or Amplitude |
| Crash Reporting | Sentry |
| Push Notifications | Expo Notifications + FCM/APNs |
| Image Moderation | AWS Rekognition or Google Vision |
| SMS Verification | Twilio |
| Email | SendGrid |
| CDN | Cloudflare |

---

## Risk Assessment

### High Priority Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Backend delays | High | Critical | Start backend ASAP; consider BaaS |
| App Store rejection | Medium | High | Follow guidelines strictly; legal review |
| Payment integration issues | Medium | High | Use RevenueCat for abstraction |
| Security vulnerabilities | Medium | Critical | Regular security audits |
| Performance at scale | Medium | High | Load test early and often |

### Dependencies

1. **Apple Developer Account** - Required for iOS testing and launch
2. **Google Play Console** - Required for Android distribution
3. **Backend hosting** - Required for all features
4. **Payment processor approval** - Required for subscriptions
5. **Legal documents** - Required for app store approval

---

## Success Criteria for 10/10

A production-ready Detour app (10/10) will have:

- [ ] Fully functional user authentication (phone, social)
- [ ] Complete profile creation and editing
- [ ] Real-time location-based discovery
- [ ] Working matching system with algorithm
- [ ] Functional real-time messaging
- [ ] Working payment processing and subscriptions
- [ ] Push notifications for matches and messages
- [ ] 70%+ test coverage
- [ ] Crash-free rate > 99.5%
- [ ] API response times < 200ms (p95)
- [ ] App startup time < 2 seconds
- [ ] Security audit passed
- [ ] GDPR/CCPA compliant
- [ ] Published on App Store and Play Store
- [ ] Monitoring and alerting in place
- [ ] Support system operational

---

## Conclusion

The Detour codebase has a strong foundation with excellent UI/UX design and solid TypeScript architecture. The primary work required is backend infrastructure, core feature implementation, and production hardening.

**Estimated timeline to production: 16 weeks (4 months)**

This timeline assumes:
- 1-2 full-time developers
- No major scope changes
- Third-party services for complex features (payments, auth)

The roadmap prioritizes getting a minimum viable product (MVP) live, then iterating based on user feedback. Features like advanced matching algorithms, social features, and additional languages can be added post-launch.

---

*Last updated: February 2, 2026*
*Document version: 1.2*

---

## Changelog

### v1.2 (February 2, 2026)
- **Major: Convex backend integration complete**
  - Updated overall score from 4/10 to 5/10
  - Backend Integration score: 0/10 → 4/10
  - Data Persistence score: 0/10 → 3/10
  - Authentication score: 0/10 → 1/10
  - Performance score: 6/10 → 7/10 (expo-image caching)
- Added Convex schema with 5 tables (users, matches, messages, swipes, inviteCodes)
- Added Convex functions for users, matches, messages, swipes, invite codes
- Added seed function for test invite codes
- Integrated ConvexProvider into app root
- New landing page with join/login flow separation
- New application-only gate page
- New invite code validation page
- Switched from ImageBackground to expo-image for better caching
- Updated Tech Stack section to reflect Convex selection
- Marked Week 2 backend tasks as complete

### v1.1 (February 1, 2026)
- Updated overall score from 3/10 to 4/10 reflecting frontend progress
- Updated component architecture score to 8/10
- Updated code organization score to 8/10
- Updated documentation score to 3/10 (CLAUDE.md now exists)
- Expanded "What's Currently Implemented" section with detailed feature breakdown
- Added username step to onboarding flow
- Documented new Explore tab features (matching routes, activity recommendations)
- Documented new Help/Marketplace tab for community assistance
- Documented Profile tab enhancements (settings menu, stats, recent viewers)

### v1.0 (January 28, 2026)
- Initial roadmap document created
