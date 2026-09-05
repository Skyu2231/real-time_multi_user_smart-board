# Multi-User Smart Board

A real-time collaborative smart board platform designed for classrooms.

The platform allows a teacher to create a virtual classroom and students to join using a classroom code. Once inside the classroom, users can interact with a shared Excalidraw whiteboard in real time.

Teachers have control over which students are allowed to draw on the shared whiteboard.

---

## Project Overview

The Multi-User Smart Board is a web-based collaborative classroom platform focused on making classroom interaction more interactive and accessible.

The main idea is to provide a shared digital whiteboard where:

- A teacher can create and manage a classroom.
- Students can join the classroom using a classroom code.
- The teacher can see the students currently in the classroom.
- The teacher can control which students are allowed to draw.
- Students with drawing permission can interact with the shared whiteboard.
- Students without drawing permission can view the whiteboard without modifying it.
- Whiteboard changes are synchronized between connected users in real time.

The project is being developed as an MVP (Minimum Viable Product) first. The priority is to make the core functionality reliable before adding advanced UI/UX features.

---

## Project Objective

The objective of this project is to build a collaborative digital classroom environment that allows teachers and students to interact through a shared smart board.

The system aims to provide:

1. Simple classroom creation.
2. Easy classroom joining.
3. Authentication and role management.
4. Teacher-controlled student permissions.
5. Real-time classroom membership updates.
6. Real-time collaborative whiteboard synchronization.
7. Persistent whiteboard storage.
8. Reliable multi-user interaction.

---

## Features

### Authentication

The application uses Supabase Authentication for user authentication.

Users can have one of two roles:

- Teacher
- Student

Each authenticated user has a corresponding profile containing:

- User ID
- Name
- Role
- Creation timestamp

Unauthenticated users are redirected to the login page.

---

### Classroom Creation

Teachers can create classrooms.

Each classroom contains:

- Classroom name
- Unique classroom code
- Teacher
- Creation timestamp

The classroom information is stored in the Supabase database.

---

### Classroom Joining

Students can join a classroom using the classroom code.

Once a student joins, a classroom membership record is stored in Supabase so that membership persists across page refreshes.

---

### Classroom Members

Teachers can see the students currently belonging to their classroom.

When a new student joins, the teacher's classroom page can receive the membership change through Supabase Realtime without requiring a page refresh.

---

### Drawing Permissions

Teachers can control whether individual students are allowed to draw.

Each student has one of two drawing permissions:

- View Only
- Can Draw

Students cannot modify their own drawing permissions.

---

### Shared Whiteboard

The project uses Excalidraw as the underlying whiteboard engine.

The whiteboard supports:

- Freehand drawing
- Shapes
- Text
- Erasing
- Selection
- Other Excalidraw drawing tools

The whiteboard is integrated into the classroom page and is available to connected classroom users according to their permissions.

---

### Real-Time Whiteboard Synchronization

Whiteboard changes are synchronized using Supabase Realtime Broadcast.

Each classroom has a dedicated whiteboard channel:

```text
whiteboard-{classroomId}
```

The synchronization system:

- Sends whiteboard changes through realtime broadcast.
- Prevents a user's own broadcast from being applied back to itself.
- Prevents remote changes from creating feedback loops.
- Throttles outgoing updates.
- Tracks update sequences.
- Merges incoming Excalidraw elements using element versions.

The current synchronization system uses a 100 ms synchronization interval, which allows approximately:

```text
10 synchronization updates per second
```

This is the synchronization frequency and is not the screen rendering frame rate.

---

## Real-Time Architecture

The application currently uses Supabase Realtime for two major purposes.

### 1. Classroom Membership Realtime

The application listens for changes to:

```text
classroom_members
```

This allows classroom pages to react to:

- New students joining.
- Permission changes.
- Other membership updates.

### 2. Whiteboard Realtime

Each classroom creates a dedicated channel:

```text
whiteboard-{classroomId}
```

The overall flow is:

```text
Teacher
   |
   | Draw
   v
Excalidraw
   |
   | onChange
   v
100ms Throttle
   |
   v
Supabase Realtime
   |
   +-------------------+
   |                   |
   v                   v
Student 1           Student 2
   |                   |
   v                   v
Merge Elements      Merge Elements
   |                   |
   v                   v
Excalidraw          Excalidraw
```

---

## Whiteboard Synchronization Strategy

The project does not simply replace the entire local whiteboard whenever a realtime message arrives.

Incoming updates are processed using several mechanisms.

### Client Identification

Every connected client receives a temporary client ID.

```text
clientId
```

This allows the application to identify its own messages and ignore them.

### Update Sequencing

Each outgoing update receives a sequence number.

```text
1
2
3
4
5
...
```

If an older update arrives after a newer update, it can be ignored.

### Element Versioning

Excalidraw elements have versions.

When an incoming element and local element have the same ID, the application compares their versions.

The newer element is kept.

Conceptually:

```text
Local Element
Version: 5

Remote Element
Version: 7

       |
       v

Keep Remote Element
Version: 7
```

This makes synchronization more reliable than blindly replacing the complete whiteboard scene.

### Remote Update Protection

When a remote update is applied to Excalidraw, the application temporarily marks the update as remote.

```text
Remote update
     |
     v
isApplyingRemoteChange = true
     |
     v
Update Excalidraw
     |
     v
Prevent rebroadcast
     |
     v
isApplyingRemoteChange = false
```

This prevents realtime feedback loops.

---

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Excalidraw

### Backend

- Supabase

### Database

- PostgreSQL

### Authentication

- Supabase Auth

### Realtime Communication

- Supabase Realtime

### Development Tools

- VS Code
- Node.js
- npm
- Git

---

## Project Architecture

The application uses the Next.js App Router.

The current project structure is approximately:

```text
multi-user-smart-board/
|
├── app/
│   |
│   ├── page.tsx
│   │   └── Classroom creation / joining
│   |
│   ├── login/
│   │   └── page.tsx
│   │       └── User authentication
│   |
│   └── classroom/
│       |
│       └── [classroomId]/
│           └── page.tsx
│               └── Classroom and shared whiteboard
│
├── components/
│   |
│   └── ExcalidrawClient.tsx
│       └── Client-side Excalidraw component
│
├── lib/
│   |
│   └── supabase.ts
│       └── Supabase client configuration
│
├── types/
│   |
│   └── classroom.ts
│       └── Classroom and User types
│
├── public/
│   └── Static assets
│
├── .env.local
│   └── Local environment variables
│
├── package.json
├── tsconfig.json
└── README.md
```

---

# Database Design

The application currently uses four main database tables.

---

## `profiles`

Stores information about authenticated users.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | References Supabase Auth user |
| `name` | TEXT | User's name |
| `role` | TEXT | `teacher` or `student` |
| `created_at` | TIMESTAMPTZ | Profile creation time |

Relationship:

```text
auth.users
     |
     | 1 : 1
     v
profiles
```

---

## `classrooms`

Stores classroom information.

| Column | Type | Description |
|---|---|---|
| `id` | TEXT | Unique classroom code |
| `name` | TEXT | Classroom name |
| `teacher_id` | UUID | Classroom teacher |
| `created_at` | TIMESTAMPTZ | Creation time |

Relationship:

```text
Teacher
   |
   | owns
   v
Classroom
```

---

## `classroom_members`

Connects users to classrooms and stores student drawing permissions.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Membership ID |
| `classroom_id` | TEXT | Associated classroom |
| `user_id` | UUID | Associated user |
| `permission` | TEXT | `none` or `draw` |
| `joined_at` | TIMESTAMPTZ | Join time |

Relationship:

```text
Classroom
    |
    v
classroom_members
    |
    +-- Student 1
    +-- Student 2
    └── Student 3
```

---

## `whiteboards`

Stores persistent whiteboard data.

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Whiteboard ID |
| `classroom_id` | TEXT | Associated classroom |
| `data` | JSONB | Whiteboard data |
| `updated_at` | TIMESTAMPTZ | Last update time |

The database structure is prepared for persistent whiteboard storage.

---

# Security and Authorization

Supabase Row Level Security (RLS) is used to protect database operations.

Current authorization rules include:

### Classroom Creation

Only authenticated users can create classrooms for themselves.

```text
teacher_id = auth.uid()
```

### Classroom Membership

A user can create a membership only for their own authenticated user ID.

```text
user_id = auth.uid()
```

### Permission Updates

Teachers can update drawing permissions for students belonging to their classrooms.

Students cannot update their own permissions.

---

## Environment Variables

Create a `.env.local` file in the root of the project.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Important

Never expose or commit your Supabase service-role key.

Only the public/anonymous key intended for frontend use should be used in the client application.

Make sure `.env.local` is included in `.gitignore`.

---

# Installation

## 1. Clone the repository

```bash
git clone <repository-url>
```

## 2. Open the project

```bash
cd multi-user-smart-board
```

## 3. Install dependencies

```bash
npm install
```

## 4. Configure Supabase

Create a Supabase project and configure:

- Authentication
- PostgreSQL database
- Realtime
- Required database tables
- Required RLS policies

## 5. Configure environment variables

Create:

```text
.env.local
```

and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 6. Start the development server

```bash
npm run dev
```

The application should be available at:

```text
http://localhost:3000
```

---

# Testing

The application can be tested using separate browser sessions.

For example:

```text
Normal Browser
       |
       └── Teacher Account

Incognito Browser
       |
       └── Student Account
```

Using separate sessions is important because multiple tabs in the same browser generally share the same Supabase authentication session.

---

## Test 1 — Teacher Login

1. Open the application.
2. Log in using a teacher account.
3. Confirm that the teacher reaches the main page.

## Test 2 — Create Classroom

1. Create a classroom.
2. Confirm that the classroom is created.
3. Open the classroom.
4. Confirm that the classroom code is displayed.

Example:

```text
Classroom Code:

MATH123
```

## Test 3 — Student Login

1. Open an Incognito window.
2. Log in using a student account.
3. Enter the classroom code.
4. Join the classroom.

## Test 4 — Classroom Membership

From the teacher browser:

1. Keep the classroom page open.
2. Join the classroom from the student browser.
3. Check the teacher's student list.

The new student should appear without manually refreshing the teacher's page.

## Test 5 — Drawing Permission

From the teacher account:

```text
Allow Drawing
```

The student should receive drawing permission.

Then select:

```text
Revoke Drawing
```

The student should return to:

```text
View Only
```

## Test 6 — View-Only Mode

When the student does not have drawing permission, the student should be able to view the whiteboard but should not be able to edit it.

## Test 7 — Realtime Drawing

Give the student drawing permission.

Draw something from the teacher account.

The student should see the drawing appear without refreshing.

Then draw from the student account.

The teacher should see the drawing appear.

## Test 8 — Fast Drawing

Test:

- Fast scribbling
- Fast lines
- Circles
- Shapes
- Text
- Continuous mouse movement

The synchronization system is designed to handle frequent drawing changes while limiting the number of realtime broadcasts.

## Test 9 — Simultaneous Drawing

Test both users drawing at the same time.

```text
Teacher                    Student
   |                          |
   | Draw                     | Draw
   |                          |
   +------------+-------------+
                |
                v
          Realtime Sync
                |
                v
         Shared Whiteboard
```

Further improvements to simultaneous multi-user drawing are part of the development roadmap.

---

# Current MVP Status

The project has completed the following major functionality:

- [x] Next.js application setup
- [x] React integration
- [x] TypeScript setup
- [x] Excalidraw integration
- [x] Supabase project setup
- [x] Database schema
- [x] Teacher authentication
- [x] Student authentication
- [x] User profiles
- [x] Classroom creation
- [x] Classroom joining
- [x] Persistent classroom membership
- [x] Teacher/student roles
- [x] Drawing permissions
- [x] Permission persistence
- [x] Database authorization
- [x] Realtime permission updates
- [x] Realtime classroom member updates
- [x] Realtime Excalidraw synchronization
- [x] Fast drawing synchronization improvements
- [x] Version-based element merging
- [x] Realtime feedback-loop protection

---

# Development Roadmap

The project is being developed in stages.

## Step 1 — Project Setup

- [x] Next.js setup
- [x] React setup
- [x] TypeScript setup

## Step 2 — Excalidraw Integration

- [x] Install Excalidraw
- [x] Integrate Excalidraw into the classroom
- [x] Resolve client-side rendering issues

## Step 3 — Supabase Setup

- [x] Create Supabase project
- [x] Connect Supabase to Next.js
- [x] Configure environment variables

## Step 4 — Database Schema

- [x] Create profiles table
- [x] Create classrooms table
- [x] Create classroom_members table
- [x] Create whiteboards table

## Step 5 — Classroom Persistence

- [x] Store classrooms in Supabase
- [x] Store classroom membership
- [x] Load classroom information from database

## Step 6 — Authentication

- [x] Teacher authentication
- [x] Student authentication
- [x] Login page
- [x] Authentication checks

## Step 7 — Authorization and Permissions

- [x] Teacher/student roles
- [x] Drawing permissions
- [x] Persistent permissions
- [x] Database-level authorization

## Step 8 — Realtime Permission Updates

- [x] Supabase Realtime
- [x] Live permission updates
- [x] Student permission changes without refresh

## Step 9 — Realtime Classroom Members

- [x] Live classroom membership updates
- [x] New students appear without refresh

## Step 10 — Excalidraw Realtime Synchronization

- [x] Realtime whiteboard channel
- [x] Broadcast drawing changes
- [x] Client identification
- [x] Update sequencing
- [x] Version-based element merging
- [x] Remote update protection
- [x] Broadcast throttling

## Step 11 — Multiple Users Drawing Together

- [ ] Improve simultaneous drawing behavior
- [ ] Test multiple students drawing at the same time
- [ ] Handle drawing conflicts
- [ ] Ensure user changes are preserved

## Step 12 — Save Whiteboard

- [ ] Save whiteboard data to Supabase
- [ ] Update whiteboard data after changes
- [ ] Handle save timing
- [ ] Avoid excessive database writes

## Step 13 — Restore Whiteboard

- [ ] Load saved whiteboard data
- [ ] Restore classroom whiteboard after refresh
- [ ] Verify restored drawing state

## Step 14 — Disconnect / Reconnect

- [ ] Detect connection changes
- [ ] Handle temporary disconnections
- [ ] Reconnect realtime channels
- [ ] Synchronize missed/latest whiteboard state

## Step 15 — Full Testing

- [ ] Teacher testing
- [ ] Student testing
- [ ] Permission testing
- [ ] Realtime testing
- [ ] Fast drawing testing
- [ ] Multiple-user testing
- [ ] Refresh testing
- [ ] Authentication testing

## Step 16 — Bug Fixing

- [ ] Fix discovered synchronization issues
- [ ] Fix classroom issues
- [ ] Fix permission issues
- [ ] Fix authentication issues
- [ ] Improve error handling

## Step 17 — MVP Cleanup

- [ ] Improve UI
- [ ] Improve user experience
- [ ] Improve loading states
- [ ] Improve error messages
- [ ] Clean up code
- [ ] Remove unnecessary development logs

## Step 18 — Final Demo / Readiness

- [ ] Complete end-to-end demo
- [ ] Verify all core features
- [ ] Prepare project documentation
- [ ] Prepare project presentation
- [ ] Prepare deployment
- [ ] Final MVP review

---

# Future Improvements

After the core MVP is stable, the project can be extended with additional features.

## UI / UX

- Modern classroom dashboard
- Better navigation
- Responsive mobile/tablet interface
- Improved student list
- Better permission controls
- Loading indicators
- Toast notifications
- Connection status indicator

## Classroom Features

- Classroom removal
- Student removal
- Multiple teachers
- Classroom history
- Classroom sessions
- Student activity indicators

## Whiteboard Features

- Better multi-user conflict resolution
- Live cursors
- User names near cursors
- User-specific drawing indicators
- Whiteboard history
- Undo/redo synchronization
- Multiple pages
- Whiteboard export

## Persistence

- Automatic saving
- Whiteboard history
- Restore previous versions
- Classroom-specific whiteboard storage

## Realtime

- Better reconnect handling
- Connection status
- Presence indicators
- More efficient synchronization
- Conflict-free collaborative editing

## Integration

- IDE integration
- File sharing
- Code editor
- Classroom resources
- Assignment support

---

# Security Considerations

The current MVP uses Supabase Authentication and Row Level Security.

Before production deployment, additional security review should be performed.

Important areas include:

- Authentication validation
- Authorization policies
- Classroom access control
- Teacher ownership verification
- Student membership verification
- Realtime channel access
- Input validation
- Environment variable protection
- Database policies
- Rate limiting
- Error handling

The Supabase service-role key must never be exposed to the client.

---

# Current Limitations

The project is currently an MVP and therefore has some limitations.

## Simultaneous Editing

The current synchronization system has been improved using throttling, sequencing, and Excalidraw element versions.

However, advanced conflict resolution for many users drawing simultaneously is still being developed.

## Whiteboard Persistence

The database contains a `whiteboards` table, but complete automatic save and restore functionality is part of the upcoming roadmap.

## Reconnection

Handling temporary network disconnections and synchronization after reconnecting is also part of the upcoming roadmap.

## UI Polish

The current priority is functionality.

Advanced UI/UX improvements will be added after the core MVP is stable.

---

# Design Philosophy

The project follows a simple development philosophy:

```text
Functionality
     |
     v
Reliability
     |
     v
Testing
     |
     v
UI/UX
     |
     v
Advanced Features
```

The first priority is to make the core classroom and collaboration system work reliably.

Once the MVP is stable, the application can be improved with better visual design and additional features.

---

# Running the Project

For development:

```bash
npm run dev
```

For a production build:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

---

# Contributing

Contributions and suggestions are welcome.

If contributing:

1. Create a new branch.
2. Make your changes.
3. Test the functionality.
4. Make sure the project builds successfully.
5. Submit a pull request.

Example:

```bash
git checkout -b feature/new-feature
```

---

# License

This project uses Excalidraw as the underlying whiteboard technology.

Excalidraw is distributed under the MIT License.

When redistributing applicable Excalidraw code, the required copyright and license notices should be retained.

---

# Project Status

**Status: Active MVP Development**

The project currently has functional:

- Authentication
- Classroom creation
- Classroom joining
- Teacher/student roles
- Drawing permissions
- Realtime classroom membership
- Realtime permission updates
- Realtime Excalidraw whiteboard synchronization

The next major development focus is:

> Reliable multi-user simultaneous drawing.

After that, the project will move toward whiteboard persistence, reconnection handling, complete testing, and final MVP cleanup.

---

# Vision

The long-term vision of the Multi-User Smart Board is to create an interactive digital classroom where teachers and students can collaborate naturally in real time.

The platform aims to make a virtual classroom feel closer to a physical classroom:

```text
              +-------------------+
              |      Teacher      |
              |                   |
              |  Virtual Class   |
              +---------+---------+
                        |
                        |
                 Shared Smart Board
                        |
             +----------+----------+
             |          |          |
             v          v          v
          Student    Student    Student
             1          2          3
             |          |          |
             +----------+----------+
                        |
                 Real-Time Learning
```

The goal is to provide a simple, reliable, and collaborative environment where teachers can control classroom interaction while students can actively participate through a shared digital workspace.
