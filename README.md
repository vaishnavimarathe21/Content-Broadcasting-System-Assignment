# Content Broadcasting System - Backend API

Hey there! 👋 Welcome to the Content Broadcasting System Backend API.

Built completely from scratch using **Node.js, Express, TypeScript, and PostgreSQL**, the architecture focuses on being enterprise-grade, secure, and highly scalable.

## Quick Tech Stack Overview
- **Core:** Node.js, Express.js
- **Language:** TypeScript (because type safety is a must for clean, maintainable code!)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (JSON Web Tokens) & bcryptjs for password hashing
- **File Uploads:** Multer (Local storage + AWS S3 cloud storage)
- **Validation:** Zod (Strictly validates all incoming payloads)
- **Caching:** Redis (for caching the live broadcast API)
- **Security:** Helmet, CORS, Express Rate Limiter

## How to Run This on Your Machine

### Prerequisites
- **Node.js** (v18 or higher)
- **Docker Desktop** (for PostgreSQL and Redis)

### Step-by-Step Setup

**Step 1:** Clone the repository
```bash
git clone https://github.com/vaishnavimarathe21/Content-Broadcasting-System-Assignment.git
cd Content-Broadcasting-System-Assignment
```

**Step 2:** Set up your environment variables
```bash
cp .env.example .env
```
Edit the `.env` file and fill in your AWS credentials if you want S3 uploads. If left empty, the system falls back to local storage automatically.

**Step 3:** Start the Entire System
Because the infrastructure (Database, Redis) and the Application itself are fully containerized, you can start the entire stack with a single command:
```bash
docker-compose up -d --build
```
*(This will automatically build the backend API, run the Prisma database migrations, and start the server).*

You should see all containers running, and the API will be available at `http://localhost:3000`.

## How to Test the System

### Option 1: Using Postman (Recommended)

I've included a `postman_collection.json` file in the project root. Import it into Postman.

> **Note for Reviewers:** By default, all URLs in the Postman collection point to `http://localhost:3000`. To test the live deployed system, simply replace `http://localhost:3000` with the Live Deployment URL provided in my submission.

Follow this testing order:

1. **Register a Teacher** → Copy the `token` and `user.id` from the response
2. **Register a Principal** → Copy the `token`
3. **Upload Content (as Teacher)** → Paste teacher token in Authorization header, select a JPG/PNG/GIF file, hit Send
4. **View My Uploads** → See all uploads with status "PENDING"
5. **View Pending (as Principal)** → See content waiting for approval
6. **Approve Content** → Paste content ID in URL, hit Send
7. **Reject Content** → Include a rejection reason in the body
8. **Get Live Content** → Paste teacher ID in URL — see the approved content!
9. **Test Subject Filter** → Add `?subject=Maths` to the live URL
10. **Test Error Handling** → Try an invalid teacher ID or invalid subject — should get graceful empty responses
11. **View Analytics** → See subject-wise stats and content usage tracking


## API Endpoints Summary

### Auth
| Method | Endpoint             | Description                                | Auth Required |
| ------ | -------------------- | ------------------------------------------ | ------------- |
| POST   | `/api/auth/register` | Register a new user (Teacher or Principal) | No            |
| POST   | `/api/auth/login`    | Login and get a JWT token                  | No            |

### Teacher Flow
| Method | Endpoint                  | Description                            | Auth Required |
| ------ | ------------------------- | -------------------------------------- | ------------- |
| POST   | `/api/content/upload`     | Upload content (local or S3)           | Teacher only  |
| GET    | `/api/content/my-uploads` | View status of all my uploaded content | Teacher only  |

### Principal Flow
| Method | Endpoint                         | Description                                  | Auth Required  |
| ------ | -------------------------------- | -------------------------------------------- | -------------- |
| GET    | `/api/admin/content/all`         | View ALL content (with pagination & filters) | Principal only |
| GET    | `/api/admin/content/pending`     | View only content waiting for approval       | Principal only |
| PUT    | `/api/admin/content/:id/approve` | Approve a piece of content                   | Principal only |
| PUT    | `/api/admin/content/:id/reject`  | Reject content (must include reason in body) | Principal only |

### Analytics
| Method | Endpoint                        | Description                              | Auth Required  |
| ------ | ------------------------------- | ---------------------------------------- | -------------- |
| GET    | `/api/admin/analytics/subjects` | Most active subject + per-subject stats  | Principal only |
| GET    | `/api/admin/analytics/overview` | Total content, approval rate, user count | Principal only |

### Public Broadcasting (Students)
| Method | Endpoint                                     | Description                                   | Auth Required |
| ------ | -------------------------------------------- | --------------------------------------------- | ------------- |
| GET    | `/api/content/live/:teacherId`               | Get currently live content (cached via Redis) | No            |
| GET    | `/api/content/live/:teacherId?subject=Maths` | Filter live content by subject                | No            |

## How to Stop Everything
```bash
Ctrl+C                 # Stop the server
docker-compose down    # Stop PostgreSQL and Redis
```

## Advanced Features Implemented
1. **Redis Caching** — `/content/live` responses are cached for 60 seconds. Cache is automatically invalidated when content is approved/rejected.
2. **Rate Limiting** — Public broadcasting API is rate-limited to prevent spam (100 requests per 5 minutes per IP).
3. **S3 Upload** — When AWS credentials are configured, files are uploaded to S3 and the public URL is stored in the database. Falls back to local storage if not configured.
4. **Subject-wise Analytics** — Principal can view most active subject and content usage tracking.
5. **Pagination & Filters** — View all content endpoint supports pagination, and filtering by status, subject, and teacher.

## Assumptions & Notes
- **Storage:** Files are uploaded to AWS S3 when credentials are configured. If not, the system falls back to local storage in the `uploads/` folder.
- **Error Handling:** The API gracefully handles scenarios like missing content, content outside of scheduled time windows, or invalid subject filters by returning clean, empty arrays rather than errors.
- **Security:** UUIDs for all database IDs, JWT + role-based middleware, Helmet for secure headers, no sensitive data exposure.
- **Scheduling:** The rotation algorithm is completely stateless — calculates active content on-the-fly using modular arithmetic. No background jobs needed.
- **Caching:** Redis is optional. If Redis is not available, the system works normally without caching.

