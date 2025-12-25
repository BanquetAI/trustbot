# Story 9.5: Rate Limiting & Security Headers

## Story Info
- **Epic**: 9 - Production Hardening
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR57 (Rate Limiting), FR60 (Security Headers)

## User Story

As a security engineer,
I want rate limiting and security headers,
So that the API is protected from abuse and common attacks.

## Acceptance Criteria

### AC1: Rate Limiting
**Given** the API is deployed
**When** requests exceed the limit
**Then** 429 responses are returned with Retry-After header

### AC2: Tiered Rate Limits
**Given** authenticated vs unauthenticated requests
**When** rate limits are applied
**Then** authenticated users get higher limits (1000 vs 100 req/min)

### AC3: Security Headers
**Given** any API response
**When** headers are inspected
**Then** all OWASP recommended headers are present

### AC4: Request Size Limits
**Given** incoming requests
**When** body or URL exceeds limits
**Then** 413/414 responses are returned appropriately

## Technical Implementation

### Rate Limiting Enhancements

```typescript
// Tiered rate limiting configuration
interface RateLimitConfig {
    windowMs: number;          // Time window (60000ms = 1 minute)
    maxRequests: number;       // 100 for unauthenticated
    maxAuthenticatedRequests?: number;  // 1000 for authenticated
    skipPaths?: string[];      // e.g., ['/health', '/ready']
}

// Response headers on rate limit
X-RateLimit-Limit: 100 | 1000
X-RateLimit-Remaining: <remaining>
X-RateLimit-Reset: <timestamp>
X-RateLimit-Policy: public | authenticated

// On 429 response
Retry-After: <seconds>
```

### Request Size Limits

```typescript
interface RequestSizeLimitConfig {
    maxBodySize: number;   // 1MB (1048576 bytes)
    maxUrlLength: number;  // 2KB (2048 chars)
    skipPaths?: string[];  // e.g., ['/upload']
}

// Responses
413 Payload Too Large - when body exceeds limit
414 URI Too Long - when URL exceeds limit
```

### Security Headers Applied

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' | XSS prevention |
| Strict-Transport-Security | max-age=31536000; includeSubDomains | HTTPS enforcement |
| X-Frame-Options | DENY | Clickjacking prevention |
| X-Content-Type-Options | nosniff | MIME sniffing prevention |
| X-XSS-Protection | 1; mode=block | XSS filter (legacy) |
| Referrer-Policy | strict-origin-when-cross-origin | Referrer control |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | Feature restrictions |
| X-Download-Options | noopen | IE download protection |
| X-DNS-Prefetch-Control | off | DNS prefetch control |

### Utility Functions

```typescript
// String sanitization
sanitizeString(input: string, maxLength?: number): string

// HTML entity escaping
sanitizeHtml(input: string): string

// Token hashing (SHA-256)
hashToken(token: string): string

// Timing-safe comparison
timingSafeCompare(a: string, b: string): boolean
```

### Files Modified/Created

| File | Change |
|------|--------|
| `src/api/middleware/security.ts` | Enhanced with tiered rate limits, request size limits, additional headers |
| `src/api/middleware/security.test.ts` | Created comprehensive test suite (35 tests) |

### Test Coverage

| Category | Tests | Coverage |
|----------|-------|----------|
| CORS Middleware | 4 | Origins, wildcards, preflight, credentials |
| Rate Limiting | 6 | Under limit, exceeded, tiered, skip paths, retry-after |
| Security Headers | 8 | CSP, HSTS, X-Frame-Options, etc. |
| Request Size Limits | 4 | Body size, URL length, skip paths |
| Request ID | 2 | Generated and provided IDs |
| Combined Middleware | 1 | All layers applied |
| Utilities | 10 | sanitizeString, sanitizeHtml, hashToken, timingSafeCompare |
| **Total** | **35** | |

### Running Tests

```bash
# Run security middleware tests
npx vitest run src/api/middleware/security.test.ts

# Run with coverage
npx vitest run --coverage src/api/middleware/security.test.ts
```

## Definition of Done
- [x] Rate limiting returns 429 with Retry-After header
- [x] Tiered rate limits (100 public, 1000 authenticated)
- [x] Request size limits (1MB body, 2KB URL)
- [x] OWASP security headers applied
- [x] Skip paths for health endpoints
- [x] Comprehensive test suite (35 tests passing)
- [x] Utility functions for sanitization
- [x] TypeScript compilation successful
- [x] All tests passing

## Security Considerations

1. **Rate Limiting**: Prevents brute force and DoS attacks
2. **Tiered Limits**: Authenticated users get higher throughput without compromising security
3. **Size Limits**: Prevents memory exhaustion attacks
4. **Security Headers**: Defense-in-depth against XSS, clickjacking, MIME attacks
5. **Timing-Safe Compare**: Prevents timing attacks on token comparison
6. **Token Hashing**: Secure storage/comparison of API tokens
