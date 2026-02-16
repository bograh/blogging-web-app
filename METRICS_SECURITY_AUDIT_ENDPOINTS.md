# Performance Metrics & Security Audit API Endpoints

Base URL: `http://localhost:8080/api`

**Note:** All endpoints in this document require `ADMIN` role authentication.

---

## 5. Performance Metrics

### GET `/metrics/performance`

Get all performance metrics.

**Request:**

```http
GET /api/metrics/performance
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "totalMethods": 12,
  "timestamp": "2026-02-16T10:30:00",
  "metrics": [
    {
      "methodName": "PostService.getAllPosts(..)",
      "totalCalls": 150,
      "successfulCalls": 148,
      "failedCalls": 2,
      "averageExecutionTime": 45,
      "minExecutionTime": 3,
      "maxExecutionTime": 234,
      "successRate": 98.67
    }
  ]
}
```

---

### GET `/metrics/performance/method/{methodName}`

Get metrics for a specific method.

**Request:**

```http
GET /api/metrics/performance/method/PostService.getAllPosts(..)
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "methodName": "PostService.getAllPosts(..)",
  "totalCalls": 150,
  "successfulCalls": 148,
  "failedCalls": 2,
  "averageExecutionTime": 45,
  "minExecutionTime": 3,
  "maxExecutionTime": 234,
  "successRate": 98.67
}
```

---

### GET `/metrics/performance/summary`

Get performance metrics summary.

**Request:**

```http
GET /api/metrics/performance/summary
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "totalMethodsMonitored": 12,
  "totalExecutions": 1500,
  "totalFailures": 15,
  "overallAverageExecutionTime": "35.50 ms",
  "overallSuccessRate": 99.0,
  "timestamp": "2026-02-16T10:30:00"
}
```

---

### DELETE `/metrics/performance/reset`

Reset all performance metrics.

**Request:**

```http
DELETE /api/metrics/performance/reset
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "All performance metrics have been reset"
}
```

---

### POST `/metrics/performance/export-log`

Export performance metrics to log file.

**Request:**

```http
POST /api/metrics/performance/export-log
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Performance metrics exported to application log and metrics folder"
}
```

---

### POST `/metrics/performance/export-all`

Export both performance and cache metrics to log file.

**Request:**

```http
POST /api/metrics/performance/export-all
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Combined performance and cache metrics exported to application log and metrics folder"
}
```

---

## Cache Metrics

### GET `/metrics/performance/cache`

Get all cache metrics.

**Request:**

```http
GET /api/metrics/performance/cache
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "totalCaches": 5,
  "timestamp": "2026-02-16T10:30:00",
  "caches": [
    {
      "cacheName": "posts",
      "hits": 1200,
      "misses": 300,
      "hitRate": "80.00%",
      "missRate": "20.00%",
      "totalRequests": 1500,
      "puts": 400,
      "evictions": 50,
      "clears": 2,
      "timestamp": "2026-02-16T10:30:00"
    }
  ]
}
```

---

### GET `/metrics/performance/cache/{cacheName}`

Get metrics for a specific cache.

**Request:**

```http
GET /api/metrics/performance/cache/posts
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "cacheName": "posts",
  "hits": 1200,
  "misses": 300,
  "hitRate": "80.00%",
  "missRate": "20.00%",
  "totalRequests": 1500,
  "puts": 400,
  "evictions": 50,
  "clears": 2,
  "timestamp": "2026-02-16T10:30:00"
}
```

**Error Response:** `400 Bad Request`

```json
{
  "error": "BAD_REQUEST",
  "message": "Cache not found: invalidCache",
  "status": 400
}
```

---

### GET `/metrics/performance/cache/summary`

Get cache summary statistics.

**Request:**

```http
GET /api/metrics/performance/cache/summary
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "totalCaches": 5,
  "totalHits": 5000,
  "totalMisses": 1200,
  "totalRequests": 6200,
  "overallHitRate": "80.65%",
  "totalPuts": 1500,
  "totalEvictions": 200,
  "bestPerformingCache": {
    "name": "tags",
    "hitRate": "95.00%"
  },
  "worstPerformingCache": {
    "name": "comments",
    "hitRate": "60.00%"
  },
  "timestamp": "2026-02-16T10:30:00"
}
```

---

### DELETE `/metrics/performance/cache/reset`

Reset all cache statistics.

**Request:**

```http
DELETE /api/metrics/performance/cache/reset
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "All cache metrics have been reset"
}
```

---

### POST `/metrics/performance/cache/export-log`

Export cache metrics to log file.

**Request:**

```http
POST /api/metrics/performance/cache/export-log
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Cache metrics exported to application log and metrics folder"
}
```

---

## Pre-Cache vs Post-Cache Comparison

### GET `/metrics/performance/comparison/pre-cache-files`

Get list of available pre-cache metrics files.

**Request:**

```http
GET /api/metrics/performance/comparison/pre-cache-files
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
[
  "20260216-103000-performance-summary.log",
  "20260215-140000-performance-summary.log",
  "20260214-090000-performance-summary.log"
]
```

---

### GET `/metrics/performance/comparison`

Compare current metrics with the latest pre-cache file.

**Request:**

```http
GET /api/metrics/performance/comparison
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "preCacheFile": "20260216-103000-performance-summary.log",
  "postCacheTimestamp": "2026-02-16T14:30:00",
  "methodComparisons": [
    {
      "methodName": "PostService.getAllPosts(..)",
      "preCache": {
        "totalCalls": 150,
        "avgExecutionTime": 106,
        "minExecutionTime": 4,
        "maxExecutionTime": 2034
      },
      "postCache": {
        "totalCalls": 200,
        "avgExecutionTime": 25,
        "minExecutionTime": 2,
        "maxExecutionTime": 150
      },
      "improvement": {
        "avgTimeReduction": 81,
        "avgTimeReductionPercent": "76.42%",
        "minTimeReduction": 2,
        "maxTimeReduction": 1884,
        "improved": true
      }
    }
  ],
  "summary": {
    "methodsCompared": 10,
    "methodsImproved": 8,
    "methodsDegraded": 1,
    "methodsUnchanged": 1,
    "overallAvgImprovementPercent": "65.50%",
    "bestImprovedMethod": "PostService.getAllPosts(..)",
    "bestImprovementPercent": "76.42%",
    "worstMethod": "UserService.getProfile(..)",
    "worstChangePercent": "-5.00%"
  },
  "timestamp": "2026-02-16T14:30:00"
}
```

---

### GET `/metrics/performance/comparison/{fileName}`

Compare current metrics with a specific pre-cache file.

**Request:**

```http
GET /api/metrics/performance/comparison/20260215-140000-performance-summary.log
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

Same structure as above comparison response.

**Error Response:** `400 Bad Request`

```json
{
  "error": "BAD_REQUEST",
  "message": "Pre-cache file not found: invalidFile.log",
  "status": 400
}
```

---
---

## Repository-Driven Comparison (Recommended)

These endpoints allow you to manually capture and compare pre-cache vs post-cache performance without disabling caching.

### Workflow

1. **Reset metrics** → `DELETE /metrics/performance/reset`
2. **Run your test requests** (without cache warm-up, or with cache disabled via config)
3. **Save baseline** → `POST /metrics/performance/baseline` (saves PRE_CACHE and resets metrics)
4. **Run same test requests again** (with cache enabled/warmed)
5. **Save post-cache** → `POST /metrics/performance/postcache`
6. **Compare** → `GET /metrics/performance/comparison/database`

---

### POST `/metrics/performance/baseline`

Save current metrics as PRE_CACHE baseline and reset metrics for fresh measurement.

**Request:**

```http
POST /api/metrics/performance/baseline
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "id": "65abc123def456",
  "timestamp": "2026-02-16T10:30:00",
  "snapshotType": "PRE_CACHE",
  "totalMethodsMonitored": 12,
  "totalExecutions": 1500,
  "totalFailures": 15,
  "overallAverageExecutionTime": 106.5,
  "overallSuccessRate": 99.0,
  "methodMetrics": [...]
}
```

---

### POST `/metrics/performance/postcache`

Save current metrics as POST_CACHE snapshot.

**Request:**

```http
POST /api/metrics/performance/postcache
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "id": "65abc789ghi012",
  "timestamp": "2026-02-16T10:35:00",
  "snapshotType": "POST_CACHE",
  "totalMethodsMonitored": 12,
  "totalExecutions": 1500,
  "totalFailures": 2,
  "overallAverageExecutionTime": 25.3,
  "overallSuccessRate": 99.87,
  "methodMetrics": [...]
}
```

---

### GET `/metrics/performance/baseline/latest`

Get the latest PRE_CACHE baseline snapshot.

**Request:**

```http
GET /api/metrics/performance/baseline/latest
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

Same structure as baseline POST response.

**Error Response:** `400 Bad Request`

```json
{
  "error": "BAD_REQUEST",
  "message": "No PRE_CACHE baseline found. Save a baseline first using /baseline endpoint.",
  "status": 400
}
```

---

### GET `/metrics/performance/postcache/latest`

Get the latest POST_CACHE snapshot.

**Request:**

```http
GET /api/metrics/performance/postcache/latest
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

Same structure as postcache POST response.

---

### GET `/metrics/performance/baseline/history`

Get all PRE_CACHE baseline snapshots.

**Request:**

```http
GET /api/metrics/performance/baseline/history?limit=10
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
[
  {
    "id": "65abc123def456",
    "timestamp": "2026-02-16T10:30:00",
    "snapshotType": "PRE_CACHE",
    "totalMethodsMonitored": 12,
    "totalExecutions": 1500,
    "overallAverageExecutionTime": 106.5,
    "methodMetrics": [...]
  }
]
```

---

### GET `/metrics/performance/postcache/history`

Get all POST_CACHE snapshots.

**Request:**

```http
GET /api/metrics/performance/postcache/history?limit=10
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

Same structure as baseline history response.

---

### GET `/metrics/performance/comparison/database`

Compare latest PRE_CACHE vs POST_CACHE from database.

**Request:**

```http
GET /api/metrics/performance/comparison/database
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "preCacheFile": "Database: PRE_CACHE(65abc123def456) @ 2026-02-16T10:30:00",
  "postCacheTimestamp": "2026-02-16T10:35:00",
  "methodComparisons": [
    {
      "methodName": "PostService.getAllPosts(..)",
      "preCache": {
        "totalCalls": 150,
        "avgExecutionTime": 106,
        "minExecutionTime": 4,
        "maxExecutionTime": 2034
      },
      "postCache": {
        "totalCalls": 150,
        "avgExecutionTime": 25,
        "minExecutionTime": 2,
        "maxExecutionTime": 150
      },
      "improvement": {
        "avgTimeReduction": 81,
        "avgTimeReductionPercent": "76.42%",
        "minTimeReduction": 2,
        "maxTimeReduction": 1884,
        "improved": true
      }
    }
  ],
  "summary": {
    "methodsCompared": 10,
    "methodsImproved": 8,
    "methodsDegraded": 1,
    "methodsUnchanged": 1,
    "overallAvgImprovementPercent": "65.50%",
    "bestImprovedMethod": "PostService.getAllPosts(..)",
    "bestImprovementPercent": "76.42%",
    "worstMethod": "UserService.getProfile(..)",
    "worstChangePercent": "-5.00%"
  },
  "timestamp": "2026-02-16T10:36:00"
}
```

**Error Response:** `400 Bad Request`

```json
{
  "error": "BAD_REQUEST",
  "message": "No PRE_CACHE baseline found. Save a baseline first using /baseline endpoint.",
  "status": 400
}
```

---

### GET `/metrics/performance/comparison/database/{preCacheId}/{postCacheId}`

Compare specific PRE_CACHE and POST_CACHE snapshots by their database IDs.

**Request:**

```http
GET /api/metrics/performance/comparison/database/65abc123def456/65abc789ghi012
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

Same structure as database comparison response above.

---

## Metrics Persistence

### POST `/metrics/performance/save`

Save current performance metrics to database.

**Request:**

```http
POST /api/metrics/performance/save?snapshotType=MANUAL
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter    | Type   | Default | Description                                         |
| ------------ | ------ | ------- | --------------------------------------------------- |
| snapshotType | String | MANUAL  | Type: MANUAL, SCHEDULED, PRE_CACHE, POST_CACHE      |

**Response:** `200 OK`

```json
{
  "id": "65abc123def456",
  "timestamp": "2026-02-16T10:30:00",
  "snapshotType": "MANUAL",
  "totalMethodsMonitored": 12,
  "totalExecutions": 1500,
  "totalFailures": 15,
  "overallAverageExecutionTime": 35.5,
  "overallSuccessRate": 99.0,
  "methodMetrics": [
    {
      "methodName": "PostService.getAllPosts(..)",
      "totalCalls": 150,
      "successfulCalls": 148,
      "failedCalls": 2,
      "averageExecutionTime": 45,
      "minExecutionTime": 3,
      "maxExecutionTime": 234
    }
  ]
}
```

---

### POST `/metrics/performance/cache/save`

Save current cache metrics to database.

**Request:**

```http
POST /api/metrics/performance/cache/save?snapshotType=MANUAL
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "id": "65abc456def789",
  "timestamp": "2026-02-16T10:30:00",
  "snapshotType": "MANUAL",
  "totalCaches": 5,
  "totalHits": 5000,
  "totalMisses": 1200,
  "totalRequests": 6200,
  "overallHitRate": 80.65,
  "totalPuts": 1500,
  "totalEvictions": 200,
  "bestPerformingCacheName": "tags",
  "bestPerformingCacheHitRate": 95.0,
  "worstPerformingCacheName": "comments",
  "worstPerformingCacheHitRate": 60.0,
  "cacheMetrics": [
    {
      "cacheName": "posts",
      "hits": 1200,
      "misses": 300,
      "hitRate": 80.0,
      "missRate": 20.0,
      "totalRequests": 1500,
      "puts": 400,
      "evictions": 50,
      "clears": 2
    }
  ]
}
```

---

### POST `/metrics/performance/save-all`

Save both performance and cache metrics to database.

**Request:**

```http
POST /api/metrics/performance/save-all?snapshotType=MANUAL
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "All metrics saved to database"
}
```

---

### GET `/metrics/performance/history`

Get performance metrics history from database.

**Request:**

```http
GET /api/metrics/performance/history?limit=10
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Default | Description                    |
| --------- | ---- | ------- | ------------------------------ |
| limit     | int  | 10      | Number of records to retrieve  |

**Response:** `200 OK`

```json
[
  {
    "id": "65abc123def456",
    "timestamp": "2026-02-16T10:30:00",
    "snapshotType": "MANUAL",
    "totalMethodsMonitored": 12,
    "totalExecutions": 1500,
    "totalFailures": 15,
    "overallAverageExecutionTime": 35.5,
    "overallSuccessRate": 99.0,
    "methodMetrics": [...]
  }
]
```

---

### GET `/metrics/performance/cache/history`

Get cache metrics history from database.

**Request:**

```http
GET /api/metrics/performance/cache/history?limit=10
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
[
  {
    "id": "65abc456def789",
    "timestamp": "2026-02-16T10:30:00",
    "snapshotType": "MANUAL",
    "totalCaches": 5,
    "totalHits": 5000,
    "overallHitRate": 80.65,
    "cacheMetrics": [...]
  }
]
```

---

## 6. Security Audit

### GET `/security/audit/stats`

Get security event statistics.

**Request:**

```http
GET /api/security/audit/stats
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "sign_in_success_24h": 150,
  "sign_in_failure_24h": 25,
  "token_validation_failure_24h": 10,
  "access_denied_24h": 5,
  "restricted_endpoint_access_24h": 200,
  "brute_force_suspected_24h": 2,
  "recentBruteForceAttempts": 1,
  "trackedFailedIps": 3,
  "trackedFailedEmails": 2
}
```

---

### GET `/security/audit/events`

Get recent security audit events with pagination.

**Request:**

```http
GET /api/security/audit/events?page=0&size=20
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type | Default | Description              |
| --------- | ---- | ------- | ------------------------ |
| page      | int  | 0       | Page number (0-based)    |
| size      | int  | 20      | Number of items per page |

**Response:** `200 OK`

```json
{
  "content": [
    {
      "id": "65abc123def456",
      "eventType": "SIGN_IN_SUCCESS",
      "username": null,
      "email": "j***@example.com",
      "ipAddress": "192.168.xxx.xxx",
      "userAgent": "Mozilla/5.0...",
      "endpoint": "/api/auth/sign-in",
      "method": "POST",
      "details": "User successfully signed in",
      "success": true,
      "timestamp": "2026-02-16T10:30:00"
    },
    {
      "id": "65abc456def789",
      "eventType": "SIGN_IN_FAILURE",
      "email": "u***@example.com",
      "ipAddress": "10.0.xxx.xxx",
      "userAgent": "curl/7.68.0",
      "endpoint": null,
      "method": null,
      "details": "Invalid email or password",
      "success": false,
      "timestamp": "2026-02-16T10:25:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 175,
  "totalPages": 9,
  "first": true,
  "last": false
}
```

---

### GET `/security/audit/events/{eventType}`

Get security events filtered by type.

**Request:**

```http
GET /api/security/audit/events/SIGN_IN_FAILURE?page=0&size=20
Authorization: Bearer <access_token>
```

**Path Parameters:**

| Parameter | Description                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------------- |
| eventType | Event type: `SIGN_IN_SUCCESS`, `SIGN_IN_FAILURE`, `TOKEN_VALIDATION_FAILURE`, `ACCESS_DENIED`, `RESTRICTED_ENDPOINT_ACCESS`, `BRUTE_FORCE_SUSPECTED` |

**Response:** `200 OK`

```json
{
  "content": [
    {
      "id": "65abc456def789",
      "eventType": "SIGN_IN_FAILURE",
      "email": "u***@example.com",
      "ipAddress": "10.0.xxx.xxx",
      "userAgent": "curl/7.68.0",
      "details": "Invalid email or password",
      "success": false,
      "timestamp": "2026-02-16T10:25:00"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 25,
  "totalPages": 2
}
```

---

### GET `/security/audit/blocked/{ipAddress}`

Check if an IP address is blocked due to brute force attempts.

**Request:**

```http
GET /api/security/audit/blocked/192.168.1.100
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "ipAddress": "192.168.1.100",
  "blocked": false
}
```

**Response (blocked IP):**

```json
{
  "ipAddress": "192.168.1.100",
  "blocked": true
}
```

---

### DELETE `/security/audit/tracking/clear`

Clear in-memory tracking caches for failed attempts.

**Request:**

```http
DELETE /api/security/audit/tracking/clear
Authorization: Bearer <access_token>
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Tracking caches cleared"
}
```

---

## Security Event Types

| Event Type                    | Description                                              |
| ----------------------------- | -------------------------------------------------------- |
| `SIGN_IN_SUCCESS`             | User successfully authenticated                          |
| `SIGN_IN_FAILURE`             | Failed authentication attempt                            |
| `REGISTRATION_SUCCESS`        | New user registration completed                          |
| `REGISTRATION_FAILURE`        | Failed registration attempt                              |
| `TOKEN_VALIDATION_FAILURE`    | Invalid or expired JWT token used                        |
| `ACCESS_DENIED`               | User denied access to resource (insufficient permissions) |
| `RESTRICTED_ENDPOINT_ACCESS`  | Access to admin/restricted endpoint                      |
| `BRUTE_FORCE_SUSPECTED`       | Potential brute force attack detected                    |
| `TOKEN_REFRESH`               | Access token refreshed using refresh token               |
| `SIGN_OUT`                    | User signed out                                          |

---

## Brute Force Detection

The system automatically detects potential brute force attacks based on:

- **Threshold**: 5 failed attempts within 15 minutes
- **Rapid Attempts**: Multiple attempts within 2 seconds
- **Tracking**: Both IP address and email are tracked

When brute force is suspected:
1. Event is logged as `BRUTE_FORCE_SUSPECTED`
2. IP is added to blocked list (in-memory)
3. Alert is logged with severity `ERROR`

---

## Cache Names

Available cache names for `/cache/{cacheName}`:

| Cache Name | Description                    |
| ---------- | ------------------------------ |
| `users`    | User entity cache              |
| `posts`    | Post entity cache              |
| `postList` | Paginated post list cache      |
| `tags`     | Tag entity cache               |
| `comments` | Comment entity cache           |

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "BAD_REQUEST",
  "message": "Cache not found: invalidCache",
  "status": 400
}
```

### 401 Unauthorized

```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired token",
  "status": 401
}
```

### 403 Forbidden

```json
{
  "error": "FORBIDDEN",
  "message": "You do not have permission to access this resource",
  "status": 403
}
```
