# Course Grade Tracker Backend

A comprehensive NestJS backend API for tracking course grades and projections.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Students, professors, and admin roles
- **Course Management**: Create courses with grade components and grade bands
- **Assignment Management**: Create and manage assignments with file uploads
- **Grade Tracking**: Students input grades, system calculates projections
- **File Uploads**: Local file storage for course materials

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **File Upload**: Multer for local storage
- **Validation**: class-validator and class-transformer
- **Containerization**: Docker & Docker Compose

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Docker (optional)

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd course-score-tracker/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start PostgreSQL** (if not using Docker)

   ```bash
   # Make sure PostgreSQL is running and create the database
   createdb course_grade_tracker
   ```

5. **Run the application**
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3000/api`

### Docker Development

1. **Using Docker Compose**
   ```bash
   docker-compose up -d
   ```

This will start both PostgreSQL and the backend application.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users

- `GET /api/users` - Get all users (Admin/Professor)
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/students` - Get all students (Admin/Professor)
- `PUT /api/users/profile` - Update profile
- `POST /api/users/enroll` - Enroll student in course

### Courses

- `POST /api/courses` - Create course (Professor)
- `GET /api/courses` - Get all courses
- `GET /api/courses/my` - Get my courses (Professor)
- `GET /api/courses/:id` - Get course by ID
- `PUT /api/courses/:id` - Update course
- `POST /api/courses/:id/upload` - Upload course file

### Assignments

- `POST /api/assignments` - Create assignment (Professor)
- `GET /api/assignments` - Get all assignments
- `GET /api/assignments/my` - Get my assignments (Professor)
- `GET /api/assignments/course/:courseId` - Get course assignments
- `PUT /api/assignments/:id` - Update assignment
- `POST /api/assignments/:id/upload` - Upload assignment file

### Grades

- `POST /api/grades` - Create grade (Student)
- `GET /api/grades/my` - Get my grades (Student)
- `GET /api/grades/course/:courseId` - Get course grades
- `GET /api/grades/projected/:courseId` - Get projected grade
- `PUT /api/grades/:id` - Update grade

## Environment Variables

| Variable            | Description            | Default              |
| ------------------- | ---------------------- | -------------------- |
| `DATABASE_HOST`     | PostgreSQL host        | localhost            |
| `DATABASE_PORT`     | PostgreSQL port        | 5432                 |
| `DATABASE_USERNAME` | PostgreSQL username    | postgres             |
| `DATABASE_PASSWORD` | PostgreSQL password    | password             |
| `DATABASE_NAME`     | Database name          | course_grade_tracker |
| `JWT_SECRET`        | JWT secret key         | (required)           |
| `JWT_EXPIRES_IN`    | JWT expiration         | 7d                   |
| `PORT`              | Application port       | 3000                 |
| `NODE_ENV`          | Environment            | development          |
| `UPLOAD_PATH`       | File upload path       | ./uploads            |
| `MAX_FILE_SIZE`     | Max file size in bytes | 10485760             |

## Database Schema

The application uses the following main entities:

- **User**: Students, professors, and admins
- **Course**: Courses with grade components and bands
- **Assignment**: Course assignments and labs
- **Grade**: Student grades for assignments
- **Enrollment**: Student-course relationships

## File Upload

Files are stored locally in the `uploads/` directory. The API serves files statically at `/uploads/*`.

## Production Deployment

1. **Build the Docker image**

   ```bash
   docker build -t course-grade-tracker-backend .
   ```

2. **Run with proper environment variables**
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_HOST=your-db-host \
     -e DATABASE_PASSWORD=your-db-password \
     -e JWT_SECRET=your-jwt-secret \
     course-grade-tracker-backend
   ```

## Development

### Running Tests

```bash
npm run test
npm run test:e2e
npm run test:cov
```

### Code Quality

```bash
npm run lint
npm run format
```

### Database Migrations

```bash
npm run migration:generate -- -n MigrationName
npm run migration:run
npm run migration:revert
```

## License

MIT
