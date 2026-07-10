🔗 LinkShift

A fast, modern, and clean URL shortener built with the MERN stack. LinkShift takes long, cumbersome URLs and transforms them into crisp, shareable short links.

🚀 Tech Stack

Frontend:

React.js (Vite)

Tailwind CSS for styling

Clean, minimalist UI design

Backend:

Node.js & Express.js

MongoDB & Mongoose (Database & ORM)

nanoid for collision-resistant unique ID generation

Redis (Coming soon for high-speed caching)

✨ Features Currently Implemented

Seamless UI: A beautiful mint/teal interface built with React and Tailwind.

Instant Shortening: Generates a 6-character unique hash for any valid URL.

Database Persistence: Saves original URLs, short IDs, and creation dates to MongoDB.

Cross-Origin Configuration: Fully configured Vite Proxy to seamlessly route frontend requests to the Express backend without CORS issues.

🛠️ Local Development Setup

Because this is a monorepo, you will need to run both the frontend and backend servers simultaneously in separate terminal windows.

Prerequisites

Node.js installed

MongoDB running locally (default port 27017) or a MongoDB Atlas URI.

1. Backend Setup

Open a terminal and navigate to the root directory, then into the backend:

cd backend
npm install

Create a .env file in the backend directory with the following variables:

PORT=8000
MONGO_URI=mongodb://localhost:27017/linkshift

Start the backend server:

npm run dev

2. Frontend Setup

Open a second terminal window and navigate to the frontend directory:

cd frontend
npm install

Start the Vite development server:

npm run dev

Navigate to http://localhost:5173 (or the port Vite provides) in your browser to use the app!

🛣️ Roadmap / Next Steps

[ ] Implement GET /:shortId redirection logic.

[ ] Integrate Redis caching to reduce database read load and latency.

[ ] Add click-tracking analytics (count how many times a short link is visited).

[ ] Implement rate limiting to prevent API abuse.

[ ] Deploy frontend to Vercel and backend to Render.
