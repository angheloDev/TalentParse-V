---
name: TalentParse-V Architecture & Key Decisions
description: Full-stack resume parsing app — architecture, tech stack, and key implementation decisions made during the enhancement sprint
type: project
---

## Stack
- **Mobile**: React Native (Expo 54, Expo Router 6, NativeWind 4, Apollo Client 4, Zustand 5)
- **Server**: Node.js + Apollo Server 4 + Express + Mongoose 8 (MongoDB)
- **Python service**: FastAPI + pdfplumber + python-docx (replaced broken pyresparser)

## Architecture
Three-tier: Mobile → GraphQL server (port 4000) → Python parser service (port 8000)

## Enhancement Sprint (2026-05-08) — Key Changes
1. **Python service rewritten** — replaced pyresparser with pdfplumber + python-docx. Now extracts: name, email, phone, linkedin, github, portfolio, skills, experience, education, certifications, rawText. Supports both PDF and DOCX (previously PDF-only).
2. **Skill dictionary expanded** — from 22 to 200+ canonical skills with synonym matching using negative lookahead regex (avoids Java/JavaScript false positives).
3. **Contact info always extracted** — email, phone, LinkedIn, GitHub, portfolio are always returned from parsing and ranking regardless of user preferences.
4. **Criteria priority / weighted scoring** — `rankCandidates` now accepts optional `criteriaWeights` (skills, experience, education, certifications, default 40/30/20/10). Score = weighted sum.
5. **Education scoring** — PhD=100, Masters=90, Bachelors=80, Associates=68, Diploma=52, unknown=60.
6. **Certification extraction** — regex patterns for AWS/Google/Microsoft/Oracle certified, PMP, CISSP, CEH, CompTIA, etc.
7. **Experience parsing improved** — date range extraction, multi-block parsing, duration calculation.
8. **Schema additions** — PersonalInfo gets linkedin/github/portfolio; ParsedResume gets certifications/languages/totalYearsExperience; ScoreBreakdown gets educationScore/certificationScore; RankedCandidate gets contact fields; SavedJob gets criteriaWeights; new JobWeights output type.
9. **CandidateDetailScreen updated** — shows contact info and full 5-dimension breakdown.

## Why: The old parser had only 22 skills, no URL extraction, no certifications, no weighted ranking — resumes were frequently misidentified and rankings were inaccurate.
