# Camply 🎓

Camply is where college students manage everything that matters — from exams to events, friends to clubs, all in one place. It's not another study app or social network — it's the space built just for your college life. Quiet when you need it, active when you want it. Whether you're trying to pass or make a mark, Camply fits how you move through college.

## Project Structure

- `student_desk/`: Python backend using Google ADK for student assistance
- `camply-web/`: React/TypeScript frontend application
- `.cursor/`: IDE configuration and rules for consistent development

## Setting up Student Desk

### Prerequisites

- Python 3.x
- pip

### Setup Steps

1. Create & activate virtual environment:

```bash
# Create venv
python -m venv .venv

# Activate venv - choose based on your OS:
# Mac / Linux
source .venv/bin/activate

# Windows CMD:
.venv\Scripts\activate.bat

# Windows PowerShell:
.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```bash
pip install google-adk

# Verify installation
pip show google-adk
```

## Setting up Camply Web

### Prerequisites

- Node.js (LTS version)
- npm/yarn

### Setup Steps

1. Navigate to web directory:

```bash
cd camply-web
```

2. Install dependencies:

```bash
npm install
```

3. Start development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` by default.

## Development Tools

### .cursor

The `.cursor` directory contains IDE configurations and rules that help maintain consistent code quality across the project. This includes:

- Code formatting rules
- Editor preferences
- Project-specific settings
