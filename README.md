# CS Recommendation System

## Overview

A fully containerized product recommendation system built using collaborative filtering (ALS) in Apache Spark, served through a FastAPI backend and a modern Next.js frontend.

* **Machine Learning**: Collaborative Filtering using Apache Spark's **ALS (Alternating Least Squares)** algorithm
* **Backend**: FastAPI + Uvicorn, exposing RESTful endpoints to serve ML predictions
* **Frontend**: Next.js client UI for browsing and receiving personalized recommendations
* **Deployment**: Fully containerized using Docker Compose for easy setup

---

## Prerequisites

| Tool               | Purpose                                                  |
| ------------------ | -------------------------------------------------------- |
| **Docker Engine**  | Required to run containerized services                   |
| **Docker Compose** | Required to orchestrate the multi-container architecture |
| **Git**            | Used to clone the repository                             |

---

## Setup & Installation

Follow the steps below to run the application locally.

### Clone the Repository

```bash
git clone [YOUR_REPOSITORY_URL]
cd CS-RECOMMENDATION-SYSTEM
```

---

## Running the Application

### 1️⃣ Build and Run the Containers

From the project root directory, run:

```bash
docker compose up --build
```

---

### 2️⃣ Verify Service Startup

Watch the logs until both services are fully ready:

| Component    | Successful Output                                                            |
| ------------ | ---------------------------------------------------------------------------- |
| **Backend**  | `SERVER READY TO ACCEPT REQUESTS` + `Uvicorn running on http://0.0.0.0:8000` |
| **Frontend** | Build complete + `http://localhost:3000 ready`                               |

---

## Accessing the Application

Once running, open the following URLs:

| Service                       | Port   | Purpose                | URL                                                          |
| ----------------------------- | ------ | ---------------------- | ------------------------------------------------------------ |
| **Frontend UI**               | `3000` | User interface         | [http://localhost:3000](http://localhost:3000)               |
| **Backend API** | `8000` | Backend REST API | [http://localhost:8000](http://localhost:8000/docs)     |

---

**Your recommendation engine is now up and running!**
Enjoy experimenting with the system — build new models, extend endpoints, or customize UI components.

---

🎄✨🎆 Merry Christmas & Happy Coding 🚀🔥