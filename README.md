# Auto Guesser

![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Drizzle](https://img.shields.io/badge/drizzle-%23C5F74F.svg?style=for-the-badge&logo=drizzle&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&logoColor=black)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

Auto Guesser is a crowdsourced, digital "20 Questions" game designed for car enthusiast. Players think of a specific vehicle, and the engine asks a series of strategic questions to narrow down the possibilities. Powered by a custom Naive Bayes probabilistic model, the engine dynamically recalculates the board after every answer to reduce entropy and confidently guess the target vehicle.

If the engine is stumped, or if a player introduces an unmapped car, the active learning pipeline allows the community to inject new attributes directly into the database, making the engine continuously smarter with every playthrough.

## Key Features

*   **Naive Bayes Decision Engine**: Uses relative scoring math to weight probabilities. The engine specifically targets questions that perfectly split the remaining probability mass 50/50, ensuring maximum information gain per turn.
*   **Active Learning & Crowdsourcing**: Players can teach the engine new cars or create new differentiating questions when the engine guesses incorrectly. 
*   **Live Prediction Debugger**: A toggleable developer panel that exposes the live matrix mathematics, allowing players to watch the algorithm sort and recalculate the global leaderboards in real-time.
*   **Global Analytics Dashboard**: Built with Recharts, providing visual insights into the engine's efficiency bell curve, engine blind spots, most popular cars, and highest-utilization questions.
*   **Wikimedia Commons Image Caching**: The engine dynamically fetches and formats high-quality imagery for the final guess screen via the Wikipedia Action API, natively caching URLs in PostgreSQL to eliminate redundant network requests.

## Tech Stack

*   **Frontend**: Next.js (App Router), React, Tailwind CSS, Shadcn UI (Radix / cmdk), Recharts
*   **Backend**: Next.js Serverless API Routes
*   **Database**: PostgreSQL hosted on Neon
*   **ORM**: Drizzle ORM
*   **Deployment**: Vercel
