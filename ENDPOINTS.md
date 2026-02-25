# API Endpoints Documentation

Base URL: `http://localhost:8080/api`

---

## 1. Authentication

### POST `/auth/register`

Register a new user account.

**Request:**

```
http
POST /api/auth/register
Content-Type: application/json
```

```
json
{
"username": "johndoe",
"email": "john@example.com",
"password": "SecurePass123"
}
```

**Response:** `201 Created`

```
json
{
"status": "success",
"message": "User registration successful",
"data": {
"user": {
"id": "550e8400-e29b-41d4-a716-446655440000",
"username": "johndoe",
"email": "john@example.com",
"roles": ["AUTHOR", "READER"]
},
"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
}
```

---

### POST `/auth/sign-in`

Authenticate a user.

**Request:**

```
http
POST /api/auth/sign-in
Content-Type: application/json
```

```
json
{
"email": "john@example.com",
"password": "SecurePass123"
}
```

**Response:** `200 OK`

```
json
{
"status": "success",
"message": "User sign in successful",
"data": {
"user": {
"id": "550e8400-e29b-41d4-a716-446655440000",
"username": "johndoe",
"email": "john@example.com",
"roles": ["AUTHOR", "READER", "ADMIN]
},
"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
}
```

---

### POST `/auth/refresh-token`

Refresh access token using refresh token cookie.

**Request:**

```
http
POST /api/auth/refresh-token
Cookie: refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`

```
json
{
"status": "success",
"message": "Access token refreshed successfully",
"data": {
"user": {
"id": "550e8400-e29b-41d4-a716-446655440000",
"username": "johndoe",
"email": "john@example.com",
"roles": ["AUTHOR", "READER", "ADMIN]
},
"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
}
```

---

## 2. User Management

### GET `/users/profile`

Get the authenticated user's profile.

**Request:**

```
http
GET /api/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`

```
json
{
"status": "success",
"message": "User profile retrieved successfully",
"data": {
"userId": "550e8400-e29b-41d4-a716-446655440000",
"username": "johndoe",
"email": "john@example.com",
"totalPosts": 15,
"totalComments": 42,
"roles": ["AUTHOR", "READER", "ADMIN],
"recentPosts": [
{
"id": 1,
"title": "My First Post",
"body": "This is the content of my first post...",
"author": "johndoe",
"authorId": "550e8400-e29b-41d4-a716-446655440000",
"tags": ["java", "spring"],
"postedAt": "2024-01-15T10:30:00",
"lastUpdated": "2024-01-15T10:30:00",
"totalComments": 5
}
],
"recentComments": [
{
"id": "507f1f77bcf86cd799439011",
"postId": 1,
"author": "johndoe",
"content": "Great article!",
"createdAt": "2024-01-16T14:20:00"
}
]
}
}
```

---

## 3. Post Management

### POST `/posts`

Create a new blog post.

**Request:**

```
http
POST /api/posts
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

```
json
{
"title": "Getting Started with Spring Boot",
"body": "Spring Boot makes it easy to create stand-alone, production-grade Spring applications...",
"tags": ["java", "spring", "tutorial"]
}
```

**Response:** `201 Created`

```
json
{
"status": "success",
"message": "Post created successfully",
"data": {
"id": 1,
"title": "Getting Started with Spring Boot",
"body": "Spring Boot makes it easy to create stand-alone, production-grade Spring applications...",
"author": "johndoe",
"authorId": "550e8400-e29b-41d4-a716-446655440000",
"tags": ["java", "spring", "tutorial"],
"postedAt": "2024-01-15T10:30:00",
"lastUpdated": "2024-01-15T10:30:00",
"totalComments": 0
}
}
```

---

### GET `/posts`

Get all posts with pagination and filtering.

**Request:**

```
http
GET /api/posts?page=0&size=12&sort=lastUpdated&order=DESC&author=johndoe&tags=java,spring&search=tutorial
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|----------|----------------|------------------------------------------------|
| page | int | 0 | Page number (0-indexed)                        |
| size | int | 12 | Page size |
| sort | string | lastUpdated | Sort field: `id`, `createdAt`, `lastUpdated`, `title` |
| order | string | DESC | Sort order: `ASC`, `DESC`                      |
| author | string | - | Filter by author username |
| tags | string[] | - | Filter by tag names |
| search | string | - | Search in title and content |

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Posts retrieved successfully",
  "data": {
    "content": [
      {
        "id": 1,
        "title": "Getting Started with Spring Boot",
        "body": "Spring Boot makes it easy to create stand-alone...",
        "author": "johndoe",
        "authorId": "550e8400-e29b-41d4-a716-446655440000",
        "tags": [
          "java",
          "spring",
          "tutorial"
        ],
        "postedAt": "2024-01-15T10:30:00",
        "lastUpdated": "2024-01-15T10:30:00",
        "totalComments": 5
      }
    ],
    "page": 0,
    "size": 12,
    "sort": "lastUpdated: DESC",
    "totalElements": 50,
    "last": false
  }
}
```

---

### GET `/posts/{postId}`

Get a single post by ID.

**Request:**

```http
GET /api/posts/1
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Post retrieved successfully",
  "data": {
    "id": 1,
    "title": "Getting Started with Spring Boot",
    "body": "Spring Boot makes it easy to create stand-alone, production-grade Spring applications...",
    "author": "johndoe",
    "authorId": "550e8400-e29b-41d4-a716-446655440000",
    "tags": [
      "java",
      "spring",
      "tutorial"
    ],
    "postedAt": "2024-01-15T10:30:00",
    "lastUpdated": "2024-01-15T10:30:00",
    "totalComments": 5
  }
}
```

---

### GET `/posts/popular`

Get top popular posts using indexed and cached retrieval.

**Request:**

```http
GET /api/posts/popular?limit=10
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | int | 10 | Max number of posts to return (1-50) |

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Popular posts retrieved successfully",
  "data": [
    {
      "id": 1,
      "title": "Getting Started with Spring Boot",
      "body": "Spring Boot makes it easy...",
      "author": "johndoe",
      "authorId": "550e8400-e29b-41d4-a716-446655440000",
      "tags": ["java", "spring", "tutorial"],
      "postedAt": "2024-01-15T10:30:00",
      "lastUpdated": "2024-01-16T09:15:00",
      "totalComments": 35
    }
  ]
}
```

---

### GET `/posts/trending`

Get top trending posts using indexed and cached retrieval.

**Request:**

```http
GET /api/posts/trending?limit=10
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | int | 10 | Max number of posts to return (1-50) |

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Trending posts retrieved successfully",
  "data": [
    {
      "id": 2,
      "title": "Spring Boot 3 Performance Tuning",
      "body": "A practical optimization guide...",
      "author": "janedoe",
      "authorId": "5f6f8d4e-50c7-4221-9e28-7b18b8f8f23d",
      "tags": ["spring", "performance"],
      "postedAt": "2024-01-18T11:20:00",
      "lastUpdated": "2024-01-20T08:45:00",
      "totalComments": 19
    }
  ]
}
```

---

### Optimization Notes (Posts Retrieval)

- Popular/trending endpoints use in-memory ranking indexes (`popularIndex`, `trendingIndex`).
- Ranking lists are cache-backed with short TTL and write-time eviction.
- Post page response mapping uses bulk comment-count aggregation to avoid N+1 calls.

Reference:

- [Retrieval Optimization Report](../docs/performance/RETRIEVAL_OPTIMIZATION_REPORT.md)

---

### PUT `/posts/{postId}`

Update a blog post (author only).

**Request:**

```http
PUT /api/posts/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

```json
{
  "title": "Updated: Getting Started with Spring Boot 3",
  "body": "Updated content with Spring Boot 3 features...",
  "tags": [
    "java",
    "spring",
    "spring-boot-3"
  ]
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Post updated successfully",
  "data": {
    "id": 1,
    "title": "Updated: Getting Started with Spring Boot 3",
    "body": "Updated content with Spring Boot 3 features...",
    "author": "johndoe",
    "authorId": "550e8400-e29b-41d4-a716-446655440000",
    "tags": [
      "java",
      "spring",
      "spring-boot-3"
    ],
    "postedAt": "2024-01-15T10:30:00",
    "lastUpdated": "2024-01-16T09:15:00",
    "totalComments": 5
  }
}
```

---

### DELETE `/posts/{postId}`

Delete a blog post (author only).

**Request:**

```http
DELETE /api/posts/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `204 No Content`

---

## 4. Comment Management

### POST `/comments`

Add a comment to a post.

**Request:**

```http
POST /api/comments
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

```


---

### GET `/posts/{postId}`

Get a single post by ID.

**Request:**
```

GET /api/posts/1

```


**Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Post retrieved successfully",
  "data": {
    "id": 1,
    "title": "Getting Started with Spring Boot",
    "body": "Spring Boot makes it easy to create stand-alone, production-grade Spring applications...",
    "author": "johndoe",
    "authorId": "550e8400-e29b-41d4-a716-446655440000",
    "tags": ["java", "spring", "tutorial"],
    "postedAt": "2024-01-15T10:30:00",
    "lastUpdated": "2024-01-15T10:30:00",
    "totalComments": 5
  }
}
```

---

### PUT `/posts/{postId}`

Update a blog post (author only).

**Request:**

```
PUT /api/posts/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

```json
{
  "title": "Updated: Getting Started with Spring Boot 3",
  "body": "Updated content with Spring Boot 3 features...",
  "tags": [
    "java",
    "spring",
    "spring-boot-3"
  ]
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Post updated successfully",
  "data": {
    "id": 1,
    "title": "Updated: Getting Started with Spring Boot 3",
    "body": "Updated content with Spring Boot 3 features...",
    "author": "johndoe",
    "authorId": "550e8400-e29b-41d4-a716-446655440000",
    "tags": [
      "java",
      "spring",
      "spring-boot-3"
    ],
    "postedAt": "2024-01-15T10:30:00",
    "lastUpdated": "2024-01-16T09:15:00",
    "totalComments": 5
  }
}
```

---

### DELETE `/posts/{postId}`

Delete a blog post (author only).

**Request:**

```
DELETE /api/posts/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `204 No Content`

---

## 4. Comment Management

### POST `/comments`

Add a comment to a post.

**Request:**

```
POST /api/comments
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

```json
{
  "postId": 1,
  "commentContent": "Great article! Very helpful for beginners."
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "message": "Comment added to post successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "postId": 1,
    "author": "janedoe",
    "content": "Great article! Very helpful for beginners.",
    "createdAt": "2024-01-16T14:20:00"
  }
}
```

---

### GET `/comments/post/{postId}`

Get all comments for a post.

**Request:**

```
GET /api/comments/post/1
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Comments for post retrieved successfully",
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "postId": 1,
      "author": "janedoe",
      "content": "Great article! Very helpful for beginners.",
      "createdAt": "2024-01-16T14:20:00"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "postId": 1,
      "author": "bobsmith",
      "content": "Thanks for sharing!",
      "createdAt": "2024-01-16T15:45:00"
    }
  ]
}
```

---

### GET `/comments/{commentId}`

Get a single comment by ID.

**Request:**

```
GET /api/comments/507f1f77bcf86cd799439011
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Comment retrieved successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "postId": 1,
    "author": "janedoe",
    "content": "Great article! Very helpful for beginners.",
    "createdAt": "2024-01-16T14:20:00"
  }
}
```

---

### DELETE `/comments/{commentId}`

Delete a comment (author only).

**Request:**

```
DELETE /api/comments/507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

```json
{
  "postId": 1
}
```

**Response:** `204 No Content`

---

## 5. Tags

### GET `/tags/popular`

Get popular tags.

**Request:**

```
GET /api/tags/popular
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Popular Tags retrieved",
  "data": [
    {
      "name": "java"
    },
    {
      "name": "spring"
    },
    {
      "name": "javascript"
    },
    {
      "name": "python"
    },
    {
      "name": "docker"
    }
  ]
}
```

---

## 6. Administration

> **Note:** All admin endpoints require the `ADMIN` role.

### GET `/admin/stats`

Get platform statistics.

**Request:**

```
GET /api/admin/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Stats retrieved successfully",
  "data": {
    "totalUsers": 1250,
    "totalPosts": 4320,
    "totalComments": 18750
  }
}
```

---

### GET `/admin/posts`

Get all posts (admin view).

**Request:**

```
GET /api/admin/posts?page=0&size=12&sort=lastUpdated&order=DESC&author=johndoe&tags=java&search=spring
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Posts retrieved successfully",
  "data": {
    "content": [
      {
        "id": 1,
        "title": "Getting Started with Spring Boot",
        "body": "Spring Boot makes it easy...",
        "author": "johndoe",
        "authorId": "550e8400-e29b-41d4-a716-446655440000",
        "tags": [
          "java",
          "spring"
        ],
        "postedAt": "2024-01-15T10:30:00",
        "lastUpdated": "2024-01-15T10:30:00",
        "totalComments": 5
      }
    ],
    "page": 0,
    "size": 12,
    "sort": "lastUpdated: DESC",
    "totalElements": 4320,
    "last": false
  }
}
```

---

### GET `/admin/posts/{postId}`

Get a post by ID (admin view).

**Request:**

```
GET /api/admin/posts/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Post retrieved successfully",
  "data": {
    "id": 1,
    "title": "Getting Started with Spring Boot",
    "body": "Full post content here...",
    "author": "johndoe",
    "authorId": "550e8400-e29b-41d4-a716-446655440000",
    "tags": [
      "java",
      "spring"
    ],
    "postedAt": "2024-01-15T10:30:00",
    "lastUpdated": "2024-01-15T10:30:00",
    "totalComments": 5
  }
}
```

---

### DELETE `/admin/posts/{postId}`

Delete any post (admin privilege).

**Request:**

```
DELETE /api/admin/posts/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `204 No Content`

---

### GET `/admin/users`

Get all users.

**Request:**

```
GET /api/admin/users?page=0&size=12&sort=createdAt&order=DESC&search=john
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Users retrieved successfully",
  "data": {
    "content": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "johndoe",
        "email": "john@example.com",
        "roles": [
          "USER"
        ]
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "username": "johnsmith",
        "email": "johnsmith@example.com",
        "roles": [
          "USER",
          "ADMIN"
        ]
      }
    ],
    "page": 0,
    "size": 12,
    "sort": "createdAt: DESC",
    "totalElements": 1250,
    "last": false
  }
}
```

---

### GET `/admin/users/{userId}/summary`

Get user summary.

**Request:**

```
GET /api/admin/users/550e8400-e29b-41d4-a716-446655440000/summary
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "User summary retrieved successfully",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "johndoe",
    "email": "john@example.com",
    "totalPosts": 15,
    "totalComments": 42,
    "roles": [
      "USER"
    ],
    "createdAt": "2024-01-01T08:00:00"
  }
}
```

---

### GET `/admin/comments`

Get all comments.

**Request:**

```
GET /api/admin/comments?page=0&size=16&sort=createdAt&order=DESC&search=great&postId=1&author=janedoe
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Comments retrieved successfully",
  "data": {
    "content": [
      {
        "id": "507f1f77bcf86cd799439011",
        "postId": 1,
        "author": "janedoe",
        "content": "Great article!",
        "createdAt": "2024-01-16T14:20:00"
      }
    ],
    "page": 0,
    "size": 16,
    "sort": "createdAt: DESC",
    "totalElements": 18750,
    "last": false
  }
}
```

---

### GET `/admin/comments/{commentId}`

Get a comment by ID.

**Request:**

```
GET /api/admin/comments/507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Comment retrieved successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "postId": 1,
    "author": "janedoe",
    "content": "Great article!",
    "createdAt": "2024-01-16T14:20:00"
  }
}
```

---

### DELETE `/admin/comments/{commentId}`

Delete any comment (admin privilege).

**Request:**

```
DELETE /api/admin/comments/507f1f77bcf86cd799439011
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `204 No Content`

---

## 7. Performance Metrics

> **Note:** All metrics endpoints typically require admin access.

### Endpoint Matrix

#### Core Performance

| Method | Endpoint | Description |
|---|---|---|
| GET | `/metrics/performance` | Get all method-level performance metrics |
| GET | `/metrics/performance/{layer}/{methodName}` | Get metrics by layer/name |
| GET | `/metrics/performance/method/{methodName}` | Get metrics by full method name |
| GET | `/metrics/performance/summary` | Get aggregated method metrics summary |
| DELETE | `/metrics/performance/reset` | Reset method metrics |
| POST | `/metrics/performance/export-log` | Export performance metrics to logs/file |

#### Runtime API Metrics (Latency / Throughput / Memory)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/metrics/performance/runtime` | Runtime API snapshot (latency, req/sec, memory) |
| POST | `/metrics/performance/runtime/export` | Export runtime snapshot to CSV table |
| DELETE | `/metrics/performance/runtime/reset` | Reset runtime counters |

#### Cache Metrics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/metrics/performance/cache` | Get all cache metrics |
| GET | `/metrics/performance/cache/{cacheName}` | Get specific cache metrics |
| GET | `/metrics/performance/cache/summary` | Get cache summary |
| DELETE | `/metrics/performance/cache/reset` | Reset cache metrics |
| POST | `/metrics/performance/cache/export-log` | Export cache metrics to logs/file |
| POST | `/metrics/performance/export-all` | Export combined performance + cache metrics |

#### Baseline, Snapshot & Comparison

| Method | Endpoint | Description |
|---|---|---|
| POST | `/metrics/performance/baseline` | Save PRE_CACHE baseline snapshot |
| POST | `/metrics/performance/postcache` | Save POST_CACHE snapshot |
| GET | `/metrics/performance/baseline/latest` | Latest PRE_CACHE snapshot |
| GET | `/metrics/performance/postcache/latest` | Latest POST_CACHE snapshot |
| GET | `/metrics/performance/baseline/history` | PRE_CACHE history |
| GET | `/metrics/performance/postcache/history` | POST_CACHE history |
| GET | `/metrics/performance/comparison` | Compare with latest pre-cache file |
| GET | `/metrics/performance/comparison/{fileName}` | Compare with selected pre-cache file |
| GET | `/metrics/performance/comparison/pre-cache-files` | List available pre-cache files |
| GET | `/metrics/performance/comparison/database` | Compare latest PRE_CACHE vs POST_CACHE (DB) |
| GET | `/metrics/performance/comparison/database/{preCacheId}/{postCacheId}` | Compare specific DB snapshots |

#### Persistence & Simulation

| Method | Endpoint | Description |
|---|---|---|
| POST | `/metrics/performance/save` | Save performance snapshot |
| POST | `/metrics/performance/cache/save` | Save cache snapshot |
| POST | `/metrics/performance/save-all` | Save performance + cache snapshots |
| GET | `/metrics/performance/history` | Performance snapshot history |
| GET | `/metrics/performance/cache/history` | Cache snapshot history |
| POST | `/metrics/performance/simulation/run` | Run full cache simulation |
| POST | `/metrics/performance/simulation/method/{methodType}` | Run method simulation |
| POST | `/metrics/performance/simulation/getAllPosts` | Simulate getAllPosts |
| POST | `/metrics/performance/simulation/getPostById/{postId}` | Simulate getPostById |
| POST | `/metrics/performance/simulation/getCommentsByPostId/{postId}` | Simulate getCommentsByPostId |
| POST | `/metrics/performance/simulation/getPopularTags` | Simulate getPopularTags |

### Runtime Metrics Example

**Request:**

```
GET /api/metrics/performance/runtime?limit=10
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "timestamp": "2026-02-23T19:00:00",
  "uptimeSeconds": 3600,
  "totalRequests": 2400,
  "totalErrors": 12,
  "errorRatePercent": 0.5,
  "averageLatencyMs": 48.3,
  "minLatencyMs": 2,
  "maxLatencyMs": 418,
  "throughputReqPerSec": 0.67,
  "throughputLast60SecondsReqPerSec": 2.1,
  "usedMemoryMb": 280,
  "committedMemoryMb": 512,
  "maxMemoryMb": 2048,
  "endpoints": [
    {
      "endpoint": "GET /api/posts",
      "totalRequests": 800,
      "errorRequests": 1,
      "errorRatePercent": 0.13,
      "averageLatencyMs": 35.4,
      "minLatencyMs": 3,
      "maxLatencyMs": 200,
      "throughputReqPerSec": 0.22
    }
  ]
}
```

---

### POST `/metrics/performance/runtime/export`

Export runtime metrics as CSV table.

**Request:**

```
POST /api/metrics/performance/runtime/export?limit=25
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Runtime metrics exported to metrics/runtime/20260224-091522-runtime-metrics.csv"
}
```

---

### DELETE `/metrics/performance/runtime/reset`

Reset runtime counters (latency, throughput, memory trend counters).

**Request:**

```
DELETE /api/metrics/performance/runtime/reset
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Runtime API metrics have been reset"
}
```

---

### POST `/metrics/performance/save`

Persist current method-level metrics snapshot.

**Request:**

```
POST /api/metrics/performance/save?snapshotType=MANUAL
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "id": "67bcf2690af45a151acde001",
  "timestamp": "2026-02-24T09:20:30",
  "snapshotType": "MANUAL",
  "totalMethodsMonitored": 32,
  "totalExecutions": 1450,
  "totalFailures": 8,
  "overallAverageExecutionTime": 37.41,
  "overallSuccessRate": 99.45,
  "methodMetrics": [
    {
      "methodName": "PostService.getAllPosts(..)",
      "totalCalls": 180,
      "successfulCalls": 180,
      "failedCalls": 0,
      "averageExecutionTime": 23,
      "minExecutionTime": 5,
      "maxExecutionTime": 211
    }
  ]
}
```

---

### POST `/metrics/performance/baseline`

Save PRE_CACHE baseline and reset active in-memory metrics.

**Request:**

```
POST /api/metrics/performance/baseline
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "id": "67bcf2690af45a151acde010",
  "timestamp": "2026-02-24T09:21:01",
  "snapshotType": "PRE_CACHE",
  "totalMethodsMonitored": 24,
  "totalExecutions": 900,
  "totalFailures": 2,
  "overallAverageExecutionTime": 41.82,
  "overallSuccessRate": 99.78,
  "methodMetrics": []
}
```

---

### POST `/metrics/performance/postcache`

Save POST_CACHE snapshot for comparison.

**Request:**

```
POST /api/metrics/performance/postcache
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "id": "67bcf2690af45a151acde011",
  "timestamp": "2026-02-24T09:22:10",
  "snapshotType": "POST_CACHE",
  "totalMethodsMonitored": 24,
  "totalExecutions": 920,
  "totalFailures": 1,
  "overallAverageExecutionTime": 27.16,
  "overallSuccessRate": 99.89,
  "methodMetrics": []
}
```

---

### GET `/metrics/performance/comparison/database`

Compare latest PRE_CACHE and POST_CACHE snapshots from MongoDB.

**Request:**

```
GET /api/metrics/performance/comparison/database
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "preCacheFile": "Database: PRE_CACHE(67bcf2690af45a151acde010) @ 2026-02-24T09:21:01",
  "postCacheTimestamp": "2026-02-24T09:22:10",
  "methodComparisons": [
    {
      "methodName": "PostService.getAllPosts(..)",
      "preCache": {
        "totalCalls": 120,
        "averageExecutionTime": 58,
        "minExecutionTime": 11,
        "maxExecutionTime": 322
      },
      "postCache": {
        "totalCalls": 130,
        "averageExecutionTime": 31,
        "minExecutionTime": 6,
        "maxExecutionTime": 154
      },
      "improvement": {
        "averageTimeReduction": 27,
        "averageTimeReductionPercent": "46.55%",
        "minTimeReduction": 5,
        "maxTimeReduction": 168,
        "improved": true
      }
    }
  ],
  "summary": {
    "methodsCompared": 18,
    "methodsImproved": 14,
    "methodsDegraded": 2,
    "methodsUnchanged": 2,
    "overallAvgImprovementPercent": "31.42%",
    "bestImprovedMethod": "PostService.getAllPosts(..)",
    "bestImprovementPercent": "46.55%",
    "worstMethod": "CommentService.getAllCommentsByPostId(..)",
    "worstChangePercent": "-8.21%"
  },
  "timestamp": "2026-02-24T09:22:15"
}
```

---

### GET `/metrics/performance/history`

Get historical performance snapshots.

**Request:**

```
GET /api/metrics/performance/history?limit=5
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
[
  {
    "id": "67bcf2690af45a151acde011",
    "timestamp": "2026-02-24T09:22:10",
    "snapshotType": "POST_CACHE",
    "totalMethodsMonitored": 24,
    "totalExecutions": 920,
    "totalFailures": 1,
    "overallAverageExecutionTime": 27.16,
    "overallSuccessRate": 99.89,
    "methodMetrics": []
  }
]
```

---

### POST `/metrics/performance/simulation/method/{methodType}`

Run PRE_CACHE vs POST_CACHE simulation for one method.

**Request (method without resourceId):**

```
POST /api/metrics/performance/simulation/method/getAllPosts
Authorization: Bearer <admin-token>
```

**Request (method with resourceId):**

```
POST /api/metrics/performance/simulation/method/getPostById?resourceId=1
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "method": "getPostById",
  "resourceId": 1,
  "preCache": {
    "avgMs": 42,
    "minMs": 19,
    "maxMs": 88
  },
  "postCache": {
    "avgMs": 17,
    "minMs": 6,
    "maxMs": 32
  },
  "improvementPercent": 59.52,
  "improved": true
}
```

---

### GET `/metrics/performance`

Get all method-level performance metrics.

**Request:**

```
GET /api/metrics/performance
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "totalMethods": 2,
  "timestamp": "2026-02-24T10:20:00",
  "metrics": [
    {
      "methodName": "PostService.getAllPosts(..)",
      "totalCalls": 120,
      "successfulCalls": 120,
      "failedCalls": 0,
      "averageExecutionTime": 29,
      "minExecutionTime": 7,
      "maxExecutionTime": 188,
      "successRate": 100.0
    }
  ]
}
```

---

### GET `/metrics/performance/{layer}/{methodName}`

Get one method metric by layer and method name.

**Request:**

```
GET /api/metrics/performance/SERVICE/getAllPosts
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "methodName": "SERVICE::getAllPosts",
  "totalCalls": 120,
  "successfulCalls": 120,
  "failedCalls": 0,
  "averageExecutionTime": 29,
  "minExecutionTime": 7,
  "maxExecutionTime": 188,
  "successRate": 100.0
}
```

---

### GET `/metrics/performance/method/{methodName}`

Get one method metric by full method name.

**Request:**

```
GET /api/metrics/performance/method/PostService.getAllPosts(..)
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "methodName": "PostService.getAllPosts(..)",
  "totalCalls": 120,
  "successfulCalls": 120,
  "failedCalls": 0,
  "averageExecutionTime": 29,
  "minExecutionTime": 7,
  "maxExecutionTime": 188,
  "successRate": 100.0
}
```

---

### GET `/metrics/performance/summary`

Get aggregated performance summary.

**Request:**

```
GET /api/metrics/performance/summary
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "totalMethodsMonitored": 24,
  "totalExecutions": 920,
  "totalFailures": 1,
  "overallAverageExecutionTime": "27.16 ms",
  "overallSuccessRate": 99.89,
  "timestamp": "2026-02-24T10:21:05"
}
```

---

### DELETE `/metrics/performance/reset`

Reset method-level metrics.

**Request:**

```
DELETE /api/metrics/performance/reset
Authorization: Bearer <admin-token>
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

Export method-level metrics to logs/files.

**Request:**

```
POST /api/metrics/performance/export-log
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Performance metrics exported to application log and metrics folder"
}
```

---

### GET `/metrics/performance/cache`

Get all cache metrics.

**Request:**

```
GET /api/metrics/performance/cache
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "totalCaches": 3,
  "timestamp": "2026-02-24T10:22:00",
  "caches": [
    {
      "cacheName": "posts",
      "hits": 1200,
      "misses": 140,
      "hitRate": "89.55%",
      "missRate": "10.45%",
      "totalRequests": 1340,
      "puts": 140,
      "evictions": 11,
      "clears": 1,
      "timestamp": "2026-02-24T10:22:00"
    }
  ]
}
```

---

### GET `/metrics/performance/cache/{cacheName}`

Get one cache metric by name.

**Request:**

```
GET /api/metrics/performance/cache/posts
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "cacheName": "posts",
  "hits": 1200,
  "misses": 140,
  "hitRate": "89.55%",
  "missRate": "10.45%",
  "totalRequests": 1340,
  "puts": 140,
  "evictions": 11,
  "clears": 1,
  "timestamp": "2026-02-24T10:22:00"
}
```

---

### GET `/metrics/performance/cache/summary`

Get aggregated cache summary.

**Request:**

```
GET /api/metrics/performance/cache/summary
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "totalCaches": 3,
  "totalHits": 3400,
  "totalMisses": 260,
  "totalRequests": 3660,
  "overallHitRate": "92.90%",
  "totalPuts": 260,
  "totalEvictions": 17,
  "bestPerformingCache": {
    "name": "posts",
    "hitRate": "89.55%"
  },
  "worstPerformingCache": {
    "name": "comments",
    "hitRate": "81.22%"
  },
  "timestamp": "2026-02-24T10:22:03"
}
```

---

### DELETE `/metrics/performance/cache/reset`

Reset cache metrics.

**Request:**

```
DELETE /api/metrics/performance/cache/reset
Authorization: Bearer <admin-token>
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

Export cache metrics to logs/files.

**Request:**

```
POST /api/metrics/performance/cache/export-log
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Cache metrics exported to application log and metrics folder"
}
```

---

### POST `/metrics/performance/export-all`

Export combined method + cache metrics.

**Request:**

```
POST /api/metrics/performance/export-all
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Combined performance and cache metrics exported to application log and metrics folder"
}
```

---

### GET `/metrics/performance/baseline/latest`

Get latest PRE_CACHE snapshot.

**Request:**

```
GET /api/metrics/performance/baseline/latest
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "id": "67bcf2690af45a151acde010",
  "timestamp": "2026-02-24T09:21:01",
  "snapshotType": "PRE_CACHE",
  "totalMethodsMonitored": 24,
  "totalExecutions": 900,
  "totalFailures": 2,
  "overallAverageExecutionTime": 41.82,
  "overallSuccessRate": 99.78,
  "methodMetrics": []
}
```

---

### GET `/metrics/performance/postcache/latest`

Get latest POST_CACHE snapshot.

**Request:**

```
GET /api/metrics/performance/postcache/latest
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "id": "67bcf2690af45a151acde011",
  "timestamp": "2026-02-24T09:22:10",
  "snapshotType": "POST_CACHE",
  "totalMethodsMonitored": 24,
  "totalExecutions": 920,
  "totalFailures": 1,
  "overallAverageExecutionTime": 27.16,
  "overallSuccessRate": 99.89,
  "methodMetrics": []
}
```

---

### GET `/metrics/performance/baseline/history`

Get PRE_CACHE snapshot history.

**Request:**

```
GET /api/metrics/performance/baseline/history?limit=10
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
[
  {
    "id": "67bcf2690af45a151acde010",
    "timestamp": "2026-02-24T09:21:01",
    "snapshotType": "PRE_CACHE",
    "totalMethodsMonitored": 24,
    "totalExecutions": 900,
    "totalFailures": 2,
    "overallAverageExecutionTime": 41.82,
    "overallSuccessRate": 99.78,
    "methodMetrics": []
  }
]
```

---

### GET `/metrics/performance/postcache/history`

Get POST_CACHE snapshot history.

**Request:**

```
GET /api/metrics/performance/postcache/history?limit=10
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
[
  {
    "id": "67bcf2690af45a151acde011",
    "timestamp": "2026-02-24T09:22:10",
    "snapshotType": "POST_CACHE",
    "totalMethodsMonitored": 24,
    "totalExecutions": 920,
    "totalFailures": 1,
    "overallAverageExecutionTime": 27.16,
    "overallSuccessRate": 99.89,
    "methodMetrics": []
  }
]
```

---

### GET `/metrics/performance/comparison/pre-cache-files`

List available pre-cache metrics files for file-based comparison.

**Request:**

```
GET /api/metrics/performance/comparison/pre-cache-files
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
[
  "20260127-173530-performance-summary.log",
  "20260126-160120-performance-summary.log"
]
```

---

### GET `/metrics/performance/comparison/{fileName}`

Compare current metrics with selected pre-cache file.

**Request:**

```
GET /api/metrics/performance/comparison/20260127-173530-performance-summary.log
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "preCacheFile": "20260127-173530-performance-summary.log",
  "postCacheTimestamp": "2026-02-24T10:24:00",
  "methodComparisons": [],
  "summary": {
    "methodsCompared": 15,
    "methodsImproved": 12,
    "methodsDegraded": 2,
    "methodsUnchanged": 1,
    "overallAvgImprovementPercent": "28.73%",
    "bestImprovedMethod": "PostService.getAllPosts(..)",
    "bestImprovementPercent": "46.55%",
    "worstMethod": "CommentService.getAllCommentsByPostId(..)",
    "worstChangePercent": "-8.21%"
  },
  "timestamp": "2026-02-24T10:24:00"
}
```

---

### GET `/metrics/performance/comparison`

Compare current metrics with latest pre-cache file.

**Request:**

```
GET /api/metrics/performance/comparison
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "preCacheFile": "20260127-173530-performance-summary.log",
  "postCacheTimestamp": "2026-02-24T10:24:20",
  "methodComparisons": [],
  "summary": {
    "methodsCompared": 15,
    "methodsImproved": 12,
    "methodsDegraded": 2,
    "methodsUnchanged": 1,
    "overallAvgImprovementPercent": "28.73%",
    "bestImprovedMethod": "PostService.getAllPosts(..)",
    "bestImprovementPercent": "46.55%",
    "worstMethod": "CommentService.getAllCommentsByPostId(..)",
    "worstChangePercent": "-8.21%"
  },
  "timestamp": "2026-02-24T10:24:20"
}
```

---

### GET `/metrics/performance/comparison/database/{preCacheId}/{postCacheId}`

Compare two specific snapshots by id.

**Request:**

```
GET /api/metrics/performance/comparison/database/67bcf2690af45a151acde010/67bcf2690af45a151acde011
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "preCacheFile": "Database: PRE_CACHE(67bcf2690af45a151acde010) @ 2026-02-24T09:21:01",
  "postCacheTimestamp": "2026-02-24T09:22:10",
  "methodComparisons": [],
  "summary": {
    "methodsCompared": 18,
    "methodsImproved": 14,
    "methodsDegraded": 2,
    "methodsUnchanged": 2,
    "overallAvgImprovementPercent": "31.42%",
    "bestImprovedMethod": "PostService.getAllPosts(..)",
    "bestImprovementPercent": "46.55%",
    "worstMethod": "CommentService.getAllCommentsByPostId(..)",
    "worstChangePercent": "-8.21%"
  },
  "timestamp": "2026-02-24T10:24:45"
}
```

---

### POST `/metrics/performance/cache/save`

Persist cache metrics snapshot.

**Request:**

```
POST /api/metrics/performance/cache/save?snapshotType=MANUAL
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "id": "67bcf2690af45a151acde101",
  "timestamp": "2026-02-24T10:25:00",
  "snapshotType": "MANUAL",
  "totalCaches": 3,
  "totalHits": 3400,
  "totalMisses": 260,
  "totalRequests": 3660,
  "overallHitRate": 92.9,
  "totalPuts": 260,
  "totalEvictions": 17,
  "bestPerformingCacheName": "posts",
  "bestPerformingCacheHitRate": 89.55,
  "worstPerformingCacheName": "comments",
  "worstPerformingCacheHitRate": 81.22,
  "cacheMetrics": []
}
```

---

### POST `/metrics/performance/save-all`

Persist performance and cache snapshots asynchronously.

**Request:**

```
POST /api/metrics/performance/save-all?snapshotType=MANUAL
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "All metrics saved to database"
}
```

---

### GET `/metrics/performance/cache/history`

Get historical cache snapshots.

**Request:**

```
GET /api/metrics/performance/cache/history?limit=5
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
[
  {
    "id": "67bcf2690af45a151acde101",
    "timestamp": "2026-02-24T10:25:00",
    "snapshotType": "MANUAL",
    "totalCaches": 3,
    "totalHits": 3400,
    "totalMisses": 260,
    "totalRequests": 3660,
    "overallHitRate": 92.9,
    "totalPuts": 260,
    "totalEvictions": 17,
    "bestPerformingCacheName": "posts",
    "bestPerformingCacheHitRate": 89.55,
    "worstPerformingCacheName": "comments",
    "worstPerformingCacheHitRate": 81.22,
    "cacheMetrics": []
  }
]
```

---

### POST `/metrics/performance/simulation/run`

Run full cache simulation.

**Request:**

```
POST /api/metrics/performance/simulation/run
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "summary": "Cache performance simulation complete.",
  "results": {
    "getAllPosts": {
      "preCacheAvgMs": 58,
      "postCacheAvgMs": 29,
      "improvementPercent": 50.0
    }
  }
}
```

---

### POST `/metrics/performance/simulation/getAllPosts`

Run simulation for `getAllPosts`.

**Request:**

```
POST /api/metrics/performance/simulation/getAllPosts
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "method": "getAllPosts",
  "preCacheAvgMs": 58,
  "postCacheAvgMs": 29,
  "improvementPercent": 50.0
}
```

---

### POST `/metrics/performance/simulation/getPostById/{postId}`

Run simulation for `getPostById`.

**Request:**

```
POST /api/metrics/performance/simulation/getPostById/1
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "method": "getPostById",
  "resourceId": 1,
  "preCacheAvgMs": 42,
  "postCacheAvgMs": 17,
  "improvementPercent": 59.52
}
```

---

### POST `/metrics/performance/simulation/getCommentsByPostId/{postId}`

Run simulation for `getCommentsByPostId`.

**Request:**

```
POST /api/metrics/performance/simulation/getCommentsByPostId/1
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "method": "getCommentsByPostId",
  "resourceId": 1,
  "preCacheAvgMs": 36,
  "postCacheAvgMs": 15,
  "improvementPercent": 58.33
}
```

---

### POST `/metrics/performance/simulation/getPopularTags`

Run simulation for `getPopularTags`.

**Request:**

```
POST /api/metrics/performance/simulation/getPopularTags
Authorization: Bearer <admin-token>
```

**Response:** `200 OK`

```json
{
  "method": "getPopularTags",
  "preCacheAvgMs": 21,
  "postCacheAvgMs": 9,
  "improvementPercent": 57.14
}
```

---

## Error Responses

### 400 Bad Request (Validation Error)

```json
{
  "status": "error",
  "message": "Validation failed",
  "data": {
    "username": "Username cannot be less than 3 or greater than 36",
    "password": "Password must contain uppercase, lowercase and digit"
  }
}
```

### 401 Unauthorized

```json
{
  "status": "error",
  "message": "Invalid or expired token",
  "data": null
}
```

### 403 Forbidden

```json
{
  "status": "error",
  "message": "Not authorized to perform this action",
  "data": null
}
```

### 404 Not Found

```json
{
  "status": "error",
  "message": "Post not found with id: 999",
  "data": null
}
```

---

## HTTP Status Codes Summary

| Code | Description                          |
|------|--------------------------------------|
| 200  | Success                              |
| 201  | Created                              |
| 204  | No Content (successful deletion)     |
| 400  | Bad Request (validation errors)      |
| 401  | Unauthorized (missing/invalid token) |
| 403  | Forbidden (insufficient permissions) |
| 404  | Not Found                            |
| 500  | Internal Server Error                |
