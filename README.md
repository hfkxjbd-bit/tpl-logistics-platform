# Turkmenistanyn Poçtasy Limited (TPL) Logistics Platform

A production-grade, highly sophisticated, full-stack digital freight management and tracking system designed for Turkmenistanyn Poçtasy Limited (TPL). The platform handles international Silk Road shipments, customs clearances, automated booking clearances, staff email allocation, and SMS/Email notification logs.

## Core Architectural Stack
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend & APIs**: Node.js Express server (`server.ts`) with custom routing.
- **AI Integrations**: Gemini LLM utilizing the modern `@google/genai` SDK for automated customs clearance assessments and synthetic cargo reports.
- **Cloud Persistence**: Firebase (Firestore & Authentication) for reliable data persistence.

## Project Structure
- `/src/components/` - User interface modules separated by concerns.
- `/src/components/admin/` - Custom operator and administrator modules.
- `/src/lib/` - Shared services, geographic database registries, and Firebase adapters.
- `/server.ts` - Production-ready Express API Gateway and static file router.
