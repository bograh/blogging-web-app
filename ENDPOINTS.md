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

### GET `/metrics/performance`

Get all performance metrics.

**Request:**

```
GET /api/metrics/performance
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`

```json
{
  "SERVICE::createPost": {
    "totalCalls": 150,
    "successCount": 148,
    "failureCount": 2,
    "averageExecutionTime": 45.6,
    "minExecutionTime": 12,
    "maxExecutionTime": 234,
    "lastExecutionTime": 38
  },
  "REPOSITORY::findById": {
    "totalCalls": 5000,
    "successCount": 4998,
    "failureCount": 2,
    "averageExecutionTime": 3.2,
    "minExecutionTime": 1,
    "maxExecutionTime": 45,
    "lastExecutionTime": 2
  }
}
```

---

### GET `/metrics/performance/{layer}/{methodName}`

Get metrics for a specific method.

**Request:**

```
GET /api/metrics/performance/SERVICE/createPost
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`

```json
{
  "totalCalls": 150,
  "successCount": 148,
  "failureCount": 2,
  "averageExecutionTime": 45.6,
  "minExecutionTime": 12,
  "maxExecutionTime": 234,
  "lastExecutionTime": 38
}
```

---

### GET `/metrics/performance/summary`

Get performance metrics summary.

**Request:**

```
GET /api/metrics/performance/summary
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`

```json
{
  "totalMethodsMonitored": 45,
  "totalCalls": 125000,
  "overallAverageExecutionTime": 23.5,
  "overallFailureRate": 0.02,
  "slowestMethod": "SERVICE::generateReport",
  "fastestMethod": "REPOSITORY::existsById",
  "mostCalledMethod": "REPOSITORY::findById"
}
```

---

### DELETE `/metrics/performance/reset`

Reset all performance metrics.

**Request:**

```
DELETE /api/metrics/performance/reset
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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

```
POST /api/metrics/performance/export-log
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`

```json
{
  "users": {
    "cacheName": "users",
    "hits": 4500,
    "misses": 500,
    "hitRate": "90.00%",
    "missRate": "10.00%",
    "totalRequests": 5000,
    "puts": 500,
    "evictions": 50,
    "clears": 2,
    "timestamp": "2024-01-16T15:30:00"
  },
  "posts": {
    "cacheName": "posts",
    "hits": 12000,
    "misses": 800,
    "hitRate": "93.75%",
    "missRate": "6.25%",
    "totalRequests": 12800,
    "puts": 800,
    "evictions": 100,
    "clears": 1,
    "timestamp": "2024-01-16T15:30:00"
  }
}
```

---

### GET `/metrics/performance/cache/{cacheName}`

Get metrics for a specific cache.

**Request:**

```
GET /api/metrics/performance/cache/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`

```json
{
  "cacheName": "users",
  "hits": 4500,
  "misses": 500,
  "hitRate": "90.00%",
  "missRate": "10.00%",
  "totalRequests": 5000,
  "puts": 500,
  "evictions": 50,
  "clears": 2,
  "timestamp": "2024-01-16T15:30:00"
}
```

---

### GET `/metrics/performance/cache/summary`

Get cache summary statistics.

**Request:**

```
GET /api/metrics/performance/cache/summary
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`

```json
{
  "totalCaches": 4,
  "overallHitRate": "91.50%",
  "totalHits": 25000,
  "totalMisses": 2300,
  "bestPerformingCache": "tags",
  "worstPerformingCache": "comments"
}
```

---

### DELETE `/metrics/performance/cache/reset`

Reset cache metrics.

**Request:**

```
DELETE /api/metrics/performance/cache/reset
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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

```
POST /api/metrics/performance/cache/export-log
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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

Export all metrics (performance + cache) to log file.

**Request:**

```
POST /api/metrics/performance/export-all
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Combined performance and cache metrics exported to application log and metrics folder"
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

```
This updated documentation now includes complete request/response JSON examples and proper `Authorization: Bearer` headers for all authenticated endpoints. Would you like me to add anything else?
```