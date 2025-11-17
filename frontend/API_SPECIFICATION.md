# ALS Model Training API Specification

## Database Schema

### Table: `model_runs`

Stores information about each model training run.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | UUID/STRING | PRIMARY KEY, NOT NULL | Unique identifier for the run record |
| `run_id` | STRING | UNIQUE, NOT NULL | Human-readable run identifier (e.g., "manual__2025-11-10T14:30:00") |
| `status` | ENUM | NOT NULL | Run status: 'success', 'failed', 'running', 'queued' |
| `start_time` | TIMESTAMP | NOT NULL | When the run started (ISO 8601 format) |
| `end_time` | TIMESTAMP | NULLABLE | When the run ended (ISO 8601 format), null if still running |
| `duration` | STRING | NULLABLE | Human-readable duration (e.g., "2h 15m"), null if still running |
| `triggered_by` | ENUM | NOT NULL | How the run was triggered: 'manual' or 'scheduled' |
| `logs` | TEXT | NULLABLE | Training logs/output from the run |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record last update timestamp |

**Indexes:**
- Index on `status` for filtering
- Index on `start_time` DESC for sorting recent runs
- Index on `triggered_by` for filtering

### Table: `training_schedule`

Stores the training schedule configuration.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | UUID/INTEGER | PRIMARY KEY, NOT NULL | Unique identifier |
| `cron_expression` | STRING | NOT NULL | Cron expression (e.g., "0 0 * * 0") |
| `is_paused` | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether the schedule is paused |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record last update timestamp |

**Note:** This table should typically have only one active record. Consider using a singleton pattern or adding a constraint.

---

## API Endpoints

### Base URL
```
/api/v1/model-training
```

### 1. Get All Model Runs

**Endpoint:** `GET /runs`

**Description:** Retrieve a list of all model training runs with optional filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by status (`success`, `failed`, `running`, `queued`)
- `triggered_by` (optional): Filter by trigger type (`manual`, `scheduled`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of results per page (default: 50, max: 100)
- `sort` (optional): Sort order (`start_time` ASC/DESC, default: DESC)

**Response:**
```json
{
  "data": [
    {
      "id": "1",
      "run_id": "manual__2025-11-10T14:30:00",
      "status": "success",
      "start_time": "2025-11-10T14:30:00Z",
      "end_time": "2025-11-10T16:45:00Z",
      "duration": "2h 15m",
      "triggered_by": "manual",
      "logs": "Model training completed successfully. RMSE: 0.89"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 6,
    "total_pages": 1
  }
}
```

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid query parameters
- `500 Internal Server Error`: Server error

---

### 2. Get Single Model Run

**Endpoint:** `GET /runs/{run_id}`

**Description:** Retrieve details of a specific model training run.

**Path Parameters:**
- `run_id`: The ID of the run (can be either `id` or `run_id` field)

**Response:**
```json
{
  "id": "1",
  "run_id": "manual__2025-11-10T14:30:00",
  "status": "success",
  "start_time": "2025-11-10T14:30:00Z",
  "end_time": "2025-11-10T16:45:00Z",
  "duration": "2h 15m",
  "triggered_by": "manual",
  "logs": "Model training completed successfully. RMSE: 0.89",
  "created_at": "2025-11-10T14:30:00Z",
  "updated_at": "2025-11-10T16:45:00Z"
}
```

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Run not found
- `500 Internal Server Error`: Server error

---

### 3. Trigger Manual Run

**Endpoint:** `POST /runs/trigger`

**Description:** Manually trigger a new model training run.

**Request Body:**
```json
{
  "priority": "normal"  // optional: "high", "normal", "low"
}
```

**Response:**
```json
{
  "id": "7",
  "run_id": "manual__2025-11-12T10:00:00",
  "status": "queued",
  "start_time": "2025-11-12T10:00:00Z",
  "end_time": null,
  "duration": null,
  "triggered_by": "manual",
  "logs": null,
  "message": "Run queued successfully"
}
```

**Status Codes:**
- `201 Created`: Run created and queued
- `400 Bad Request`: Invalid request
- `409 Conflict`: Another run is already in progress
- `500 Internal Server Error`: Server error

---

### 4. Get Training Schedule

**Endpoint:** `GET /schedule`

**Description:** Get the current training schedule configuration.

**Response:**
```json
{
  "id": "1",
  "cron_expression": "0 0 * * 0",
  "is_paused": false,
  "description": "Every Sunday at midnight",
  "next_run": "2025-11-17T00:00:00Z",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-11-10T14:30:00Z"
}
```

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Schedule not configured
- `500 Internal Server Error`: Server error

---

### 5. Update Training Schedule

**Endpoint:** `PUT /schedule`

**Description:** Update the training schedule configuration.

**Request Body:**
```json
{
  "cron_expression": "0 0 * * 0",
  "is_paused": false
}
```

**Validation:**
- `cron_expression`: Must be a valid cron expression (5 fields: minute hour day month weekday)
- `is_paused`: Boolean value

**Response:**
```json
{
  "id": "1",
  "cron_expression": "0 0 * * 0",
  "is_paused": false,
  "description": "Every Sunday at midnight",
  "next_run": "2025-11-17T00:00:00Z",
  "message": "Schedule updated successfully"
}
```

**Status Codes:**
- `200 OK`: Schedule updated successfully
- `400 Bad Request`: Invalid cron expression or request body
- `500 Internal Server Error`: Server error

---

### 6. Pause/Resume Schedule

**Endpoint:** `PATCH /schedule/pause` or `PATCH /schedule/resume`

**Description:** Pause or resume the training schedule.

**Request Body:**
```json
{
  "is_paused": true  // for pause endpoint
}
```

**Response:**
```json
{
  "id": "1",
  "cron_expression": "0 0 * * 0",
  "is_paused": true,
  "message": "Schedule paused successfully"
}
```

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Schedule not configured
- `500 Internal Server Error`: Server error

---

### 7. Get Training Statistics

**Endpoint:** `GET /statistics`

**Description:** Get aggregated statistics about model training runs.

**Response:**
```json
{
  "total_runs": 6,
  "success_count": 3,
  "failed_count": 1,
  "running_count": 1,
  "queued_count": 1,
  "success_rate": 75.0,
  "average_duration_minutes": 135,
  "last_run": {
    "id": "3",
    "run_id": "manual__2025-11-11T08:00:00",
    "status": "running",
    "start_time": "2025-11-11T08:00:00Z"
  },
  "next_scheduled_run": "2025-11-17T00:00:00Z"
}
```

**Status Codes:**
- `200 OK`: Success
- `500 Internal Server Error`: Server error

---

### 8. Get Run Logs

**Endpoint:** `GET /runs/{run_id}/logs`

**Description:** Get logs for a specific model training run.

**Path Parameters:**
- `run_id`: The ID of the run

**Response:**
```json
{
  "run_id": "1",
  "logs": "Model training completed successfully. RMSE: 0.89\nTraining started at 2025-11-10T14:30:00Z\n...",
  "log_size": 1024
}
```

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Run not found
- `500 Internal Server Error`: Server error

---

## Data Models (Pydantic Schemas for FastAPI)

### ModelRun
```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum

class RunStatus(str, Enum):
    SUCCESS = "success"
    FAILED = "failed"
    RUNNING = "running"
    QUEUED = "queued"

class TriggerType(str, Enum):
    MANUAL = "manual"
    SCHEDULED = "scheduled"

class ModelRunBase(BaseModel):
    run_id: str
    status: RunStatus
    start_time: datetime
    end_time: Optional[datetime] = None
    duration: Optional[str] = None
    triggered_by: TriggerType
    logs: Optional[str] = None

class ModelRunCreate(BaseModel):
    triggered_by: TriggerType
    priority: Optional[str] = "normal"

class ModelRunResponse(ModelRunBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ModelRunListResponse(BaseModel):
    data: list[ModelRunResponse]
    pagination: dict
```

### TrainingSchedule
```python
class TrainingScheduleBase(BaseModel):
    cron_expression: str
    is_paused: bool = False

class TrainingScheduleUpdate(BaseModel):
    cron_expression: Optional[str] = None
    is_paused: Optional[bool] = None

class TrainingScheduleResponse(TrainingScheduleBase):
    id: str
    description: Optional[str] = None
    next_run: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

### Statistics
```python
class TrainingStatistics(BaseModel):
    total_runs: int
    success_count: int
    failed_count: int
    running_count: int
    queued_count: int
    success_rate: float
    average_duration_minutes: Optional[float] = None
    last_run: Optional[ModelRunResponse] = None
    next_scheduled_run: Optional[datetime] = None
```

---

## Error Response Format

All error responses should follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}  // optional: additional error details
  }
}
```

**Common Error Codes:**
- `VALIDATION_ERROR`: Invalid request data
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict (e.g., run already in progress)
- `INTERNAL_ERROR`: Server error

---

## Notes for Implementation

1. **Duration Calculation**: The `duration` field should be calculated from `start_time` and `end_time` when a run completes. Format as human-readable (e.g., "2h 15m", "45m", "1d 3h").

2. **Run ID Generation**: Generate `run_id` in format: `{triggered_by}__{ISO_timestamp}` (e.g., "manual__2025-11-10T14:30:00").

3. **Cron Validation**: Validate cron expressions server-side. Consider using a library like `croniter` in Python.

4. **Schedule Singleton**: Ensure only one active schedule exists. Consider using database constraints or application logic.

5. **Logs Storage**: For large logs, consider storing in a separate table or file storage, and reference it from the main table.

6. **Real-time Updates**: Consider implementing WebSocket support for real-time status updates on running jobs.

7. **Pagination**: Implement cursor-based pagination for better performance with large datasets.

8. **Authentication**: Add authentication/authorization middleware as needed.

9. **Rate Limiting**: Consider rate limiting on trigger endpoint to prevent abuse.

10. **Background Jobs**: The actual model training should run as a background job/task. Update the run status as the job progresses.

