# Simula + (Simulador de Marketing no Mercado)

## Overview
Simula + is an educational application for high school and higher education students, providing a practical marketing simulation experience with academic rigor. It allows teachers to manage decision rounds and market events, while student teams make strategic decisions across the 4 Ps of marketing for multiple products. The project aims to deliver hands-on learning, integrate real-world economic data, offer advanced strategic analysis tools, and foster a deep understanding of marketing principles, economic theory, and strategic thinking in a dynamic, simulated environment.

## User Preferences
I want iterative development.
Ask before making major changes.
I prefer detailed explanations.
Do not make changes to files in the `server/services` directory unless explicitly requested.
Do not make changes to authentication or authorization mechanisms without prior discussion.
Do not modify the core `MemStorage` implementation or switch to PostgreSQL without confirmation.
**Manual Maintenance**: Whenever system features or UI flows are modified, always update the corresponding section in the Manual do Aluno (client/src/pages/manual.tsx), specifically the "Como Usar" tab, to reflect the current system behavior and ensure students have accurate guidance. The Manual do Professor (server/manual-professor.md) should be updated when pedagogical approaches or professor-specific features change.

## System Architecture

### UI/UX Decisions
The application utilizes Shadcn/ui and Tailwind CSS for a modern, responsive interface. Data visualization is achieved through interactive dashboards and graphical representations, including Recharts for economic history and radar charts for brand analysis. Strategic tools like SWOT, Porter, BCG, and PESTEL are presented with dedicated tabs and intuitive input methods. Company logo upload supports local files and external URLs, displayed across the Dashboard, Empresa page, and Resumo da Identidade card.

### Technical Implementations
- **Backend**: Node.js with Express, `express-session` for authentication, `bcrypt` for password hashing, and PostgreSQL for data persistence.
- **Frontend**: React with TypeScript, Vite, `TanStack Query` for state management, and `Wouter` for routing.
- **Authentication & Authorization**: Role-based access control (professor, equipe) with email validations, secure HttpOnly session cookies, and password recovery.
- **Data Schemas**: Zod ensures data integrity.
- **KPI Calculation**: A backend module calculates 19 key performance indicators based on student decisions, market events, and budget.
- **Strategic Tools**: Implements SWOT, Porter's Five Forces, BCG Matrix, and PESTEL analysis, all mandatory before marketing mix submission and directly impacting KPIs.
- **Progressive AI Assistance System**: Provides educational scaffolding with three levels of AI assistance that decrease over rounds to foster student autonomy.
- **Strategic Alignment Scoring System**: Automatically calculates an alignment score between strategic analyses and marketing mix decisions, impacting financial results via KPI modifiers.
- **Edit Tracking System & AI Content Penalty**: Tracks modifications to AI-generated strategic analyses using Levenshtein distance, penalizing unedited AI submissions to encourage personalization and deep engagement.
- **AI-Powered Strategic Analyses Generation**: Professors can generate automatic strategic analyses (SWOT, Porter, BCG, PESTEL) and 4P recommendations using GPT-4o-mini.
- **Dynamic Environment**: Integrates real-time (cached) economic data and an intelligent event generator for market events.
- **Market Information System**: Provides data for 12 Brazilian sectors, including trends, opportunities, challenges, and target audience profiles.
- **Multi-Product Marketing Mix System**: Students make independent Marketing Mix decisions for all 4 products simultaneously, with isolated state management, draft saving, and submission tracking.
- **Product & Target Audience Configuration System**: Allows students to configure all 4 products per round with custom names, descriptions, and specific target audiences. This section is always visible, but interaction is restricted to active rounds, supporting a draft/finalize workflow.
- **Comprehensive Media Catalog System**: Replaces generic promotional tools with 25 real promotional formats across 8 categories, featuring realistic pricing, suggested quantities, and minimum value enforcement.
- **AI-Powered Market Insights System**: Provides comprehensive market insights, including GPT-4o-mini generated strategic recommendations, sector analysis, performance badges, visual KPI comparisons, and competitive analysis.
- **AI-Powered Feedback System**: Offers intelligent, Socratic feedback after each round using GPT-4o-mini, analyzing decisions against results and KPIs.
- **Professor Analytics Dashboard**: Provides comprehensive class performance analytics, including class-wide metrics, KPI evolution timelines, team rankings, and engagement indicators.
- **Automated Round Scheduling System**: Full scheduling automation with professor-defined start/end dates, automatically activating and completing rounds.
- **Comprehensive Financial Dashboard**: Dual-tab interface in student results page with "KPIs e Desempenho" and "Demonstrativo Financeiro" (DRE and Balance Sheet). All 28 accounting values are calculated server-side using realistic accounting logic, ensuring accounting equation closure. Excel export generates 3 sheets with all 28 fields synchronized from PostgreSQL.
- **Manual do Aluno**: Frontend educational resource with high academic rigor, designed for both high school and university levels. It includes sections on system usage, marketing concepts (with practical applications for strategic tools), strategies, and a comprehensive glossary of KPIs and formulas. The glossary covers advanced finance, organizational economics, strategic theory, and methodological transparency, supported by formal academic references. A professional PDF export is also available.
- **Manual do Professor**: Backend-served comprehensive pedagogical guide (Markdown) for professors.
- **Guia de Mídias**: Dedicated student-accessible page with a downloadable PDF guide detailing all available media formats, pricing, and specifications.
- **KPI Balancing System**: Implements a comprehensive balancing mechanism to ensure realistic market simulation results and prevent excessive rewards, including LTV formula redesign, conversion rate ceiling, market share consolidation fix, strategic modifier caps, global modifier limits, and an ROI hard cap.
- **Intelligent Student Management System**: Professor-scoped student administration with data integrity safeguards, including automatic filtering of students by professor's classes and a robust manual duplicate cleanup method.
- **Manual Round Management System**: Professors can add new rounds, remove the last locked round with multi-layer validation (no active/completed rounds removal, dependency checking for campaigns, marketing mixes, results, and strategic analyses), and configure the total number of rounds per class (1-20, minimum = current round). Auto-generates strategic analyses for rounds ≤3 when adding.

## External Dependencies
- **PostgreSQL**: Primary database.
- **OpenAI**: Used for AI-powered market event generation, feedback, and strategic analyses generation (GPT-4o-mini).
- **exchangerate-api.com**: Fetches real-time USD/BRL exchange rates.
- **Vite**: Frontend build tool.
- **Shadcn/ui**: UI component library.
- **Tailwind CSS**: Utility-first CSS framework.
- **TanStack Query**: Data fetching and state management for React.
- **Wouter**: React routing library.
- **bcrypt**: Password hashing.
- **express-session**: Session management middleware.
- **Zod**: Schema declaration and validation.
- **Recharts**: Charting library for data visualization.