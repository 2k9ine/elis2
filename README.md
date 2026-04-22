# Eli's Learning School Management System

A production-grade web application for managing a music and arts school. Built for Eli's Learning in Sharjah, UAE.

## Features

- **Dashboard**: Overview of school stats, attendance rates, overdue fees, and recent activity
- **Student Management**: Complete student profiles with music progress tracking
- **Attendance**: One-tap attendance marking with calendar views
- **Fees & Billing**: Monthly fee tracking, payment recording, and receipt generation
- **Teachers**: Teacher management and performance analytics
- **Trinity Exams**: Full workflow for Trinity College London exam applications
- **Assessments**: Internal progress tracking with Chart.js visualizations
- **Events**: School events, recitals, and performance management
- **Reports**: Financial reports with PDF export
- **WhatsApp Integration**: One-click parent communication with pre-filled messages

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase
- **Charts**: Chart.js
- **Icons**: Lucide React
- **Deployment**: Vercel

## Design System

- **Colors**: Deep blacks (#0a0a0f, #111118) with rich blues (#1a56db, #2563eb)
- **Typography**: Inter font family
- **Style**: Dark-themed SaaS dashboard (Linear/Vercel aesthetic)
- **Components**: Sharp corners, subtle borders, 150ms transitions

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/elis-learning.git
cd elis-learning
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Add your Supabase credentials to `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start development server:
```bash
npm run dev
```

## Database Schema

The application expects the following Supabase tables:

- `students` - Student records
- `teachers` - Teacher profiles
- `attendance` - Daily attendance
- `music_pieces` - Student piece progress
- `fees` - Monthly fee tracking
- `trinity_applications` - Trinity exam pipeline
- `internal_assessments` - Internal exam results
- `events` - School events
- `event_students` - Event participation

See `supabase/migrations/` for SQL setup scripts.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Build

```bash
npm run build
```

Static files will be in `dist/` directory.

## Project Structure

```
elis-learning/
├── src/
│   ├── components/
│   │   ├── ui/           # Reusable UI components
│   │   ├── layout/         # Sidebar, Header, MobileNav
│   │   ├── students/       # Student-specific components
│   │   └── charts/         # Chart.js wrappers
│   ├── pages/              # Route-level components
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # Auth and Toast providers
│   ├── lib/                # Utilities, constants, Supabase config
│   └── styles/             # Global CSS
├── public/                 # Static assets
└── supabase/               # Database migrations
```

## Roles & Permissions

- **Admin (Elizabeth)**: Full access to all modules
- **Teacher**: Limited to their assigned students, can mark attendance and update progress

## License

Private - For Eli's Learning use only
