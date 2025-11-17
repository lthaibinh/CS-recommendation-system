"""
ALS Model Training API Router
Implements all endpoints for model training management
"""
from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from enum import Enum
import math
import uuid

from database import get_db, ModelRun, TrainingSchedule, ModelVersion, Metric

router = APIRouter(prefix="/api/v1/model-training", tags=["Model Training"])


# ============================================================================ #
# Enums
# ============================================================================ #

class RunStatus(str, Enum):
    SUCCESS = "success"
    FAILED = "failed"
    RUNNING = "running"
    QUEUED = "queued"
    CANCELLED = "cancelled"


class TriggerType(str, Enum):
    MANUAL = "manual"
    SCHEDULED = "scheduled"


# ============================================================================ #
# Pydantic Models
# ============================================================================ #

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
    priority: Optional[str] = Field("normal", description="Priority: high, normal, low")
    rank: Optional[int] = Field(10, description="Number of latent factors")
    regParam: Optional[float] = Field(0.01, description="Regularization parameter")
    alpha: Optional[float] = Field(1.0, description="Confidence amplification factor")
    maxIter: Optional[int] = Field(10, description="Maximum number of iterations")


class ModelRunResponse(ModelRunBase):
    id: str
    created_at: datetime
    updated_at: datetime
    hyper_parameters: Optional[dict] = None # Hyperparameters: rank, regParam, alpha, maxIter
    
    class Config:
        from_attributes = True


class ModelRunListResponse(BaseModel):
    data: List[ModelRunResponse]
    pagination: dict


class TrainingScheduleBase(BaseModel):
    cron_expression: str
    is_paused: bool = False
    rank: Optional[int] = Field(None, description="Number of latent factors")
    regParam: Optional[float] = Field(None, description="Regularization parameter")
    alpha: Optional[float] = Field(None, description="Confidence amplification factor")
    maxIter: Optional[int] = Field(None, description="Maximum number of iterations")


class TrainingScheduleUpdate(BaseModel):
    cron_expression: Optional[str] = None
    is_paused: Optional[bool] = None
    rank: Optional[int] = Field(None, description="Number of latent factors")
    regParam: Optional[float] = Field(None, description="Regularization parameter")
    alpha: Optional[float] = Field(None, description="Confidence amplification factor")
    maxIter: Optional[int] = Field(None, description="Maximum number of iterations")


class TrainingScheduleResponse(TrainingScheduleBase):
    id: int
    description: Optional[str] = None
    next_run: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TrainingStatistics(BaseModel):
    total_runs: int
    success_count: int
    failed_count: int
    running_count: int
    queued_count: int
    cancelled_count: int
    success_rate: float
    average_duration_minutes: Optional[float] = None
    last_run: Optional[ModelRunResponse] = None
    next_scheduled_run: Optional[datetime] = None


class ErrorResponse(BaseModel):
    error: dict


# ============================================================================ #
# Helper Functions
# ============================================================================ #

def calculate_duration(start_time: datetime, end_time: datetime) -> str:
    """Calculate human-readable duration between two timestamps"""
    if not end_time:
        return None
    
    delta = end_time - start_time
    total_seconds = int(delta.total_seconds())
    
    days = total_seconds // 86400
    hours = (total_seconds % 86400) // 3600
    minutes = (total_seconds % 3600) // 60
    
    parts = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    
    if not parts:
        return "0m"
    
    return " ".join(parts)


def generate_run_id(triggered_by: str) -> str:
    """Generate run_id in format: {triggered_by}__{ISO_timestamp}"""
    timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")
    return f"{triggered_by}__{timestamp}"


def validate_cron_expression(cron_expr: str) -> bool:
    """Validate cron expression (5 fields: minute hour day month weekday)"""
    try:
        parts = cron_expr.strip().split()
        if len(parts) != 5:
            return False
        
        # Basic validation - check if all parts are valid
        for part in parts:
            if not part or part == "":
                return False
        
        # You can add more sophisticated validation here
        # For now, just check format
        return True
    except:
        return False


def get_cron_description(cron_expr: str) -> str:
    """Get human-readable description of cron expression"""
    # Simple mapping - can be enhanced
    common_crons = {
        "0 0 * * *": "Daily at midnight",
        "0 0 * * 0": "Every Sunday at midnight",
        "0 0 1 * *": "First day of month at midnight",
        "0 */6 * * *": "Every 6 hours",
    }
    return common_crons.get(cron_expr, f"Cron: {cron_expr}")


def calculate_next_run(cron_expr: str) -> Optional[datetime]:
    """Calculate next run time from cron expression"""
    # For now, return None - in production, use croniter library
    # try:
    #     from croniter import croniter
    #     base = datetime.utcnow()
    #     iter = croniter(cron_expr, base)
    #     return iter.get_next(datetime)
    # except:
    #     return None
    return None  # Placeholder - implement with croniter if needed


# ============================================================================ #
# Model Version Management Pydantic Models
# ============================================================================ #

class ModelVersionResponse(BaseModel):
    id: int
    version_tag: str
    artifact_path: str
    created_at: datetime
    isActive: bool

    class Config:
        from_attributes = True


class ActiveModelVersionResponse(BaseModel):
    active_version: Optional[ModelVersionResponse] = None
    message: str


class SetActiveVersionRequest(BaseModel):
    model_version_id: int


class MetricResponse(BaseModel):
    metric_name: str
    metric_value: float
    timestamp: datetime
    
    class Config:
        from_attributes = True


class MetricsResponse(BaseModel):
    metrics: List[MetricResponse]
    version_id: int
    version_tag: Optional[str] = None


# ============================================================================ #
# API Endpoints
# ============================================================================ #

@router.get("/runs", response_model=ModelRunListResponse)
async def get_all_model_runs(
    status: Optional[str] = Query(None, description="Filter by status"),
    triggered_by: Optional[str] = Query(None, description="Filter by trigger type"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Results per page"),
    sort: str = Query("start_time", description="Sort field"),
    order: str = Query("DESC", description="Sort order: ASC or DESC"),
    db: Session = Depends(get_db)
):
    """Get all model training runs with optional filtering and pagination"""
    query = db.query(ModelRun)
    
    # Apply filters
    if status:
        if status not in ["success", "failed", "running", "queued"]:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "Invalid status value. Must be one of: success, failed, running, queued"
                    }
                }
            )
        query = query.filter(ModelRun.status == status)
    
    if triggered_by:
        if triggered_by not in ["manual", "scheduled"]:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "Invalid triggered_by value. Must be one of: manual, scheduled"
                    }
                }
            )
        query = query.filter(ModelRun.triggered_by == triggered_by)
    
    # Apply sorting
    if sort == "start_time":
        if order.upper() == "ASC":
            query = query.order_by(ModelRun.start_time.asc())
        else:
            query = query.order_by(ModelRun.start_time.desc())
    else:
        query = query.order_by(ModelRun.start_time.desc())
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    runs = query.offset(offset).limit(limit).all()
    
    # Convert to response models
    run_responses = [
        ModelRunResponse(
            id=r.id,
            run_id=r.run_id,
            status=RunStatus(r.status),
            start_time=r.start_time,
            end_time=r.end_time,
            duration=r.duration,
            triggered_by=TriggerType(r.triggered_by),
            logs=r.logs,
            created_at=r.created_at,
            updated_at=r.updated_at,
            hyper_parameters={
                "rank": r.rank,
                "regParam": r.regParam,
                "alpha": r.alpha,
                "maxIter": r.maxIter
            } if r.rank is not None else None
        )
        for r in runs
    ]
    
    total_pages = math.ceil(total / limit) if total > 0 else 0
    
    return ModelRunListResponse(
        data=run_responses,
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages
        }
    )


@router.get("/runs/{run_id}", response_model=ModelRunResponse)
async def get_single_model_run(run_id: str, db: Session = Depends(get_db)):
    """Get details of a specific model training run"""
    # Try to find by id or run_id
    run = db.query(ModelRun).filter(
        or_(ModelRun.id == run_id, ModelRun.run_id == run_id)
    ).first()
    
    if not run:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"Run with id {run_id} not found"
                }
            }
        )
    
    return ModelRunResponse(
        id=run.id,
        run_id=run.run_id,
        status=RunStatus(run.status),
        start_time=run.start_time,
        end_time=run.end_time,
        duration=run.duration,
        triggered_by=TriggerType(run.triggered_by),
        logs=run.logs,
        created_at=run.created_at,
        updated_at=run.updated_at,
        hyper_parameters={
            "rank": run.rank,
            "regParam": run.regParam,
            "alpha": run.alpha,
            "maxIter": run.maxIter
        } if run.rank is not None else None
    )


@router.post("/runs/trigger", response_model=ModelRunResponse, status_code=201)
async def trigger_manual_run(
    request: ModelRunCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Manually trigger a new model training run"""
    # Cancel any existing running or queued runs
    running_or_queued_runs = db.query(ModelRun).filter(
        ModelRun.status.in_(["running", "queued"])
    ).all()
    
    if running_or_queued_runs:
        for existing_run in running_or_queued_runs:
            existing_run.status = "cancelled"
            existing_run.end_time = datetime.utcnow()
            if existing_run.start_time:
                existing_run.duration = calculate_duration(existing_run.start_time, existing_run.end_time)
            existing_run.logs = (existing_run.logs or "") + f"\n⚠️ Run cancelled: A new run was triggered.\n"
            existing_run.updated_at = datetime.utcnow()
        
        db.commit()
        print(f"⚠️ Cancelled {len(running_or_queued_runs)} existing run(s) to start new run")
    
    # If triggered by schedule, use schedule hyperparameters if not provided in request
    rank = request.rank
    regParam = request.regParam
    alpha = request.alpha
    maxIter = request.maxIter
    
    if request.triggered_by == TriggerType.SCHEDULED:
        schedule = db.query(TrainingSchedule).first()
        if schedule:
            # Use schedule hyperparameters if not provided in request
            rank = rank if rank is not None else schedule.rank
            regParam = regParam if regParam is not None else schedule.regParam
            alpha = alpha if alpha is not None else schedule.alpha
            maxIter = maxIter if maxIter is not None else schedule.maxIter
    
    # Fallback to defaults if still None
    rank = rank or 10
    regParam = regParam or 0.01
    alpha = alpha or 1.0
    maxIter = maxIter or 10
    
    # Generate run_id
    run_id = generate_run_id(request.triggered_by.value)
    # Check if run_id already exists (very unlikely but handle it)
    existing_run = db.query(ModelRun).filter(ModelRun.run_id == run_id).first()
    if existing_run:
        # If collision, add a counter suffix
        base_run_id = run_id
        counter = 1
        while existing_run and counter < 100:
            run_id = f"{base_run_id}_{counter}"
            existing_run = db.query(ModelRun).filter(ModelRun.run_id == run_id).first()
            counter += 1
    
    # Create new run record
    new_run = ModelRun(
        id=str(uuid.uuid4()),
        run_id=run_id,
        status="queued",
        start_time=datetime.utcnow(),
        end_time=None,
        duration=None,
        triggered_by=request.triggered_by.value,
        logs=None,
        rank=rank,
        regParam=regParam,
        alpha=alpha,
        maxIter=maxIter
    )
    
    db.add(new_run)
    db.commit()
    db.refresh(new_run)
    
    # Add background task to run actual training
    background_tasks.add_task(
        run_training_task, 
        new_run.id,
        rank=rank,
        regParam=regParam,
        alpha=alpha,
        maxIter=maxIter
    )
    
    # Build hyperparameters dict
    hyper_params = {
        "rank": new_run.rank,
        "regParam": new_run.regParam,
        "alpha": new_run.alpha,
        "maxIter": new_run.maxIter
    } if new_run.rank is not None else None
    
    return ModelRunResponse(
        id=new_run.id,
        run_id=new_run.run_id,
        status=RunStatus(new_run.status),
        start_time=new_run.start_time,
        end_time=new_run.end_time,
        duration=new_run.duration,
        triggered_by=TriggerType(new_run.triggered_by),
        logs=new_run.logs,
        created_at=new_run.created_at,
        updated_at=new_run.updated_at,
        hyper_parameters=hyper_params
    )


async def run_training_task(
    run_id: str,
    rank: int = 10,
    regParam: float = 0.01,
    alpha: float = 1.0,
    maxIter: int = 10
):
    """
    Background task to run model training by executing train_model.py as a subprocess.
    
    This function calls train_model.py via command line to maintain separation of concerns:
    - Data Scientists (DS) can modify train_model.py independently
    - Software Engineers (SE) only need to maintain this API integration layer
    
    The training script is executed as: python train_model.py --rank X --regParam Y ...
    """
    import sys
    import os
    import re
    import asyncio
    from database import SessionLocal
    
    db = SessionLocal()
    try:
        run = db.query(ModelRun).filter(ModelRun.id == run_id).first()
        if not run:
            return
        
        # Check if run was cancelled before starting
        if run.status == "cancelled":
            print(f"⚠️ Run {run_id} was cancelled before training started")
            return
        
        # Update status to running
        run.status = "running"
        run.logs = f"Training started...\n"
        run.logs += f"Hyperparameters: rank={rank}, regParam={regParam}, alpha={alpha}, maxIter={maxIter}\n"
        db.commit()
        
        # ========================================================================
        # Command Line Execution Setup
        # ========================================================================
        # Get the directory where train_model.py is located
        # Note: train_model.py should be in the same directory as this API file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        train_script_path = os.path.join(current_dir, "train_model.py")
        
        # Verify the script exists
        if not os.path.exists(train_script_path):
            raise FileNotFoundError(
                f"Training script not found at: {train_script_path}\n"
                f"Please ensure train_model.py exists in the same directory as model_training_api.py"
            )
        
        # Generate version tag for this training run
        version_tag = datetime.utcnow().strftime("%Y-%m-%d_%H-%M-%S")

        # Build command line command to execute train_model.py
        # Format: python train_model.py --rank X --regParam Y --alpha Z --maxIter W
        python_executable = sys.executable  # Use the same Python interpreter
        cmd = [
            python_executable,
            train_script_path,
            "--rank", str(rank),
            "--regParam", str(regParam),
            "--alpha", str(alpha),
            "--maxIter", str(maxIter),
            "--versionTag", version_tag
        ]
        
        # Log the exact command being executed for debugging
        cmd_string = " ".join(cmd)
        run.logs += f"\n{'='*60}\n"
        run.logs += f"Executing command:\n{cmd_string}\n"
        run.logs += f"{'='*60}\n"
        db.commit()
        
        # ========================================================================
        # Execute train_model.py as async subprocess (non-blocking)
        # ========================================================================
        # Execute the training script as a separate process via command line
        # Using asyncio.create_subprocess_exec for non-blocking execution
        # This allows DS to modify train_model.py without affecting API code
        # and allows the API to handle other requests while training runs
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,      # Capture stdout for logging
            stderr=asyncio.subprocess.STDOUT,    # Redirect stderr to stdout
            cwd=current_dir                      # Set working directory so relative paths work
        )
        
        # Capture output in real-time (non-blocking)
        output_lines = []
        ndcg_value = None
        extracted_metrics = {}  # Dictionary to store all extracted metrics: {k: {metric_type: value}}
        
        try:
            # Read output line by line asynchronously (non-blocking)
            while True:
                # Check if run was cancelled during execution (check more frequently)
                db.refresh(run)
                if run.status == "cancelled":
                    run.logs += "\n⚠️ Run was cancelled during training, terminating process...\n"
                    db.commit()
                    
                    # Terminate the process gracefully first
                    try:
                        if process.returncode is None:
                            process.terminate()
                            # Wait up to 5 seconds for graceful shutdown
                            try:
                                await asyncio.wait_for(process.wait(), timeout=5.0)
                            except asyncio.TimeoutError:
                                # Force kill if process doesn't respond
                                run.logs += "⚠️ Process did not terminate gracefully, forcing kill...\n"
                                try:
                                    process.kill()
                                    # Wait a bit more for kill to take effect
                                    await asyncio.wait_for(process.wait(), timeout=2.0)
                                except asyncio.TimeoutError:
                                    run.logs += "⚠️ Warning: Process may still be running after kill attempt\n"
                    except Exception as term_error:
                        run.logs += f"⚠️ Error during process termination: {str(term_error)}\n"
                    
                    # Clean up process resources
                    try:
                        if process.stdout:
                            process.stdout.close()
                        if process.stderr and process.stderr != process.stdout:
                            process.stderr.close()
                    except Exception as cleanup_error:
                        pass  # Ignore cleanup errors
                    
                    # Update final status
                    run.logs += "⚠️ Training process terminated due to cancellation.\n"
                    run.end_time = datetime.utcnow()
                    run.duration = calculate_duration(run.start_time, run.end_time)
                    run.status = "cancelled"
                    db.commit()
                    return
                
                # Read one line (this is non-blocking with async subprocess)
                line_bytes = await process.stdout.readline()
                
                # Empty line means EOF or process ended
                if not line_bytes:
                    break
                
                # Decode line
                line = line_bytes.decode('utf-8', errors='replace').rstrip('\n\r')
                
                if line:
                    output_lines.append(line)
                    # Save every line from train_model.py to run.logs in real-time
                    run.logs += line + "\n"
                    
                    # Parse structured metric logs: "METRIC|k=10|precision=0.123|recall=0.456|map=0.789|ndcg=0.012|coverage=0.345|hitRate=0.567"
                    metric_match = re.search(r'METRIC\|k=(\d+)\|precision=([\d.]+)\|recall=([\d.]+)\|map=([\d.]+)\|ndcg=([\d.]+)\|coverage=([\d.]+)\|hitRate=([\d.]+)', line)
                    if metric_match:
                        try:
                            k = int(metric_match.group(1))
                            precision = float(metric_match.group(2))
                            recall = float(metric_match.group(3))
                            map_score = float(metric_match.group(4))
                            ndcg = float(metric_match.group(5))
                            coverage = float(metric_match.group(6))
                            hit_rate = float(metric_match.group(7))
                            
                            extracted_metrics[k] = {
                                'precision': precision,
                                'recall': recall,
                                'map': map_score,
                                'ndcg': ndcg,
                                'coverage': coverage,
                                'hitRate': hit_rate
                            }
                        except (ValueError, IndexError) as e:
                            pass
                    
                    # Also keep backward compatibility for NDCG@10
                    # Pattern: "Kết quả (Validation) NDCG@10 = 0.8523 ..."
                    ndcg_match = re.search(r'NDCG@10\s*=\s*([\d.]+)', line)
                    if ndcg_match:
                        try:
                            ndcg_value = float(ndcg_match.group(1))
                            if 10 not in extracted_metrics:
                                extracted_metrics[10] = {}
                            if 'ndcg' not in extracted_metrics[10]:
                                extracted_metrics[10]['ndcg'] = ndcg_value
                        except ValueError:
                            pass
                    
                    # Commit logs in real-time after every line so users can see progress immediately
                    # Refresh run object to check for cancellation and commit to database
                    db.refresh(run)
                    
                    # Check for cancellation more frequently (every line)
                    if run.status == "cancelled":
                        # Break out of the loop to handle cancellation
                        break
                    
                    db.commit()
                    
                    # Yield control to event loop periodically to allow other tasks to run
                    if len(output_lines) % 5 == 0:
                        await asyncio.sleep(0)  # Yield to event loop
            
            # Check if we broke out of loop due to cancellation
            db.refresh(run)
            if run.status == "cancelled":
                # Handle cancellation - terminate process if still running
                run.logs += "\n⚠️ Run was cancelled, terminating process...\n"
                try:
                    if process.returncode is None:
                        process.terminate()
                        try:
                            await asyncio.wait_for(process.wait(), timeout=5.0)
                        except asyncio.TimeoutError:
                            run.logs += "⚠️ Process did not terminate gracefully, forcing kill...\n"
                            try:
                                process.kill()
                                await asyncio.wait_for(process.wait(), timeout=2.0)
                            except asyncio.TimeoutError:
                                run.logs += "⚠️ Warning: Process may still be running after kill attempt\n"
                except Exception as term_error:
                    run.logs += f"⚠️ Error during process termination: {str(term_error)}\n"
                
                # Clean up process resources
                try:
                    if process.stdout:
                        process.stdout.close()
                    if process.stderr and process.stderr != process.stdout:
                        process.stderr.close()
                except Exception:
                    pass
                
                run.logs += "⚠️ Training process terminated due to cancellation.\n"
                run.end_time = datetime.utcnow()
                run.duration = calculate_duration(run.start_time, run.end_time)
                db.commit()
                return
            
            # Wait for process to complete (non-blocking)
            return_code = await process.wait()
            
            # Final log update
            run.logs += f"\n{'='*60}\n"
            run.logs += f"Training process completed with return code: {return_code}\n"
            run.logs += f"{'='*60}\n"
            
            run.end_time = datetime.utcnow()
            run.duration = calculate_duration(run.start_time, run.end_time)
            
            if return_code == 0:
                run.status = "success"
                if ndcg_value is not None:
                    run.logs += f"\n✓ Model training completed successfully.\n"
                    run.logs += f"Validation NDCG@10: {ndcg_value:.4f}\n"
                else:
                    run.logs += f"\n✓ Model training completed successfully.\n"

                # Save successful model to model_versions table
                try:
                    # Create model version entry
                    model_path = f"models/als_model_{version_tag}"
                    # Set project_id=1 for single-project system (or None if nullable)
                    # Check if project_id column exists and handle accordingly
                    model_version = ModelVersion(
                        version_tag=version_tag,
                        artifact_path=model_path,
                        project_id=1  # Default project ID for single-project system
                    )
                    db.add(model_version)
                    
                    # log hyperparameters
                    run.logs += f"Hyperparameters: rank={rank}, regParam={regParam}, alpha={alpha}, maxIter={maxIter}\n"
                    run.logs += f"✓ Model version saved to database: {version_tag}\n"
                    run.logs += f"  Model path: {model_path}\n"
                    
                    # Commit model version first to get the ID
                    db.commit()
                    
                    # Save metrics to database
                    if extracted_metrics:
                        try:
                            metric_count = 0
                            for k, metrics in extracted_metrics.items():
                                # Save each metric type for this k value
                                # Available metrics: precision, recall, map, ndcg, coverage, hitRate
                                metric_types = ['precision', 'recall', 'map', 'ndcg', 'coverage', 'hitRate']
                                for metric_type in metric_types:
                                    if metric_type in metrics:
                                        # Format metric name: Precision@10, Recall@15, Map@20, etc.
                                        metric_name = f"{metric_type.capitalize()}@{k}"
                                        metric = Metric(
                                            model_version_id=model_version.id,
                                            metric_name=metric_name,
                                            metric_value=metrics[metric_type]
                                        )
                                        db.add(metric)
                                        metric_count += 1
                            
                            db.commit()
                            run.logs += f"✓ Saved {metric_count} metrics to database\n"
                        except Exception as metric_error:
                            run.logs += f"⚠️ Warning: Failed to save metrics to database: {str(metric_error)}\n"
                            db.rollback()
                            # Model version is already saved, so we continue
                    else:
                        run.logs += f"⚠️ Warning: No metrics extracted from training logs\n"

                except Exception as e:
                    run.logs += f"⚠️ Warning: Failed to save model version to database: {str(e)}\n"
                    db.rollback()
            else:
                run.status = "failed"
                run.logs += f"\n❌ Model training failed with return code {return_code}.\n"
                run.logs += "Check the logs above for error details.\n"
        except Exception as proc_error:
            # If process execution fails
            db.refresh(run)
            # Don't change status if it was cancelled
            if run.status != "cancelled":
                run.status = "failed"
            run.end_time = datetime.utcnow()
            run.duration = calculate_duration(run.start_time, run.end_time)
            run.logs += f"\n❌ Error executing training script: {str(proc_error)}\n"
            
            # Try to clean up process and get any remaining output
            try:
                if process.returncode is None:
                    # Process is still running, try to terminate it
                    try:
                        process.terminate()
                        await asyncio.wait_for(process.wait(), timeout=3.0)
                    except (asyncio.TimeoutError, Exception):
                        try:
                            process.kill()
                            await asyncio.wait_for(process.wait(), timeout=2.0)
                        except Exception:
                            pass
                
                # Try to read any remaining output (non-blocking)
                try:
                    remaining_output = []
                    while True:
                        try:
                            line_bytes = await asyncio.wait_for(process.stdout.readline(), timeout=0.1)
                            if not line_bytes:
                                break
                            line = line_bytes.decode('utf-8', errors='replace').rstrip('\n\r')
                            if line:
                                remaining_output.append(line)
                        except asyncio.TimeoutError:
                            break
                    
                    if remaining_output:
                        run.logs += f"\nRemaining output:\n" + "\n".join(remaining_output) + "\n"
                except Exception:
                    pass
                
                # Clean up process resources
                try:
                    if process.stdout:
                        process.stdout.close()
                    if process.stderr and process.stderr != process.stdout:
                        process.stderr.close()
                except Exception:
                    pass
            except Exception as cleanup_error:
                run.logs += f"⚠️ Error during cleanup: {str(cleanup_error)}\n"
        
        db.commit()
        
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        
        run = db.query(ModelRun).filter(ModelRun.id == run_id).first()
        if run:
            # Don't change status if it was cancelled
            if run.status != "cancelled":
                run.status = "failed"
            run.end_time = datetime.utcnow()
            run.duration = calculate_duration(run.start_time, run.end_time)
            run.logs = (run.logs or "") + f"\n❌ Fatal Error: {str(e)}\n\nTraceback:\n{error_traceback}\n"
            
            # Try to clean up process if it exists
            try:
                if 'process' in locals() and process.returncode is None:
                    try:
                        process.terminate()
                        await asyncio.wait_for(process.wait(), timeout=2.0)
                    except Exception:
                        try:
                            process.kill()
                            await asyncio.wait_for(process.wait(), timeout=1.0)
                        except Exception:
                            pass
            except Exception:
                pass
            
            db.commit()
    finally:
        # Ensure database session is closed
        try:
            db.close()
        except Exception:
            pass


@router.get("/schedule", response_model=TrainingScheduleResponse)
async def get_training_schedule(db: Session = Depends(get_db)):
    """Get the current training schedule configuration"""
    schedule = db.query(TrainingSchedule).first()
    
    if not schedule:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Schedule not configured"}}
        )
    
    description = get_cron_description(schedule.cron_expression)
    next_run = calculate_next_run(schedule.cron_expression)
    
    return TrainingScheduleResponse(
        id=schedule.id,
        cron_expression=schedule.cron_expression,
        is_paused=schedule.is_paused,
        rank=schedule.rank,
        regParam=schedule.regParam,
        alpha=schedule.alpha,
        maxIter=schedule.maxIter,
        description=description,
        next_run=next_run,
        created_at=schedule.created_at,
        updated_at=schedule.updated_at
    )


@router.put("/schedule", response_model=TrainingScheduleResponse)
async def update_training_schedule(
    request: TrainingScheduleUpdate,
    db: Session = Depends(get_db)
):
    """Update the training schedule configuration"""
    schedule = db.query(TrainingSchedule).first()
    
    if not schedule:
        # Create new schedule if doesn't exist
        if not request.cron_expression:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "cron_expression is required for new schedule"
                    }
                }
            )
        
        schedule = TrainingSchedule(
            cron_expression=request.cron_expression,
            is_paused=request.is_paused if request.is_paused is not None else False,
            rank=request.rank,
            regParam=request.regParam,
            alpha=request.alpha,
            maxIter=request.maxIter
        )
        db.add(schedule)
    else:
        # Update existing schedule
        if request.cron_expression:
            if not validate_cron_expression(request.cron_expression):
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": {
                            "code": "VALIDATION_ERROR",
                            "message": "Invalid cron expression. Must be 5 fields: minute hour day month weekday"
                        }
                    }
                )
            schedule.cron_expression = request.cron_expression
        
        if request.is_paused is not None:
            schedule.is_paused = request.is_paused
        
        # Update hyperparameters if provided
        if request.rank is not None:
            schedule.rank = request.rank
        if request.regParam is not None:
            schedule.regParam = request.regParam
        if request.alpha is not None:
            schedule.alpha = request.alpha
        if request.maxIter is not None:
            schedule.maxIter = request.maxIter
        
        schedule.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(schedule)
    
    description = get_cron_description(schedule.cron_expression)
    next_run = calculate_next_run(schedule.cron_expression)
    
    return TrainingScheduleResponse(
        id=schedule.id,
        cron_expression=schedule.cron_expression,
        is_paused=schedule.is_paused,
        rank=schedule.rank,
        regParam=schedule.regParam,
        alpha=schedule.alpha,
        maxIter=schedule.maxIter,
        description=description,
        next_run=next_run,
        created_at=schedule.created_at,
        updated_at=schedule.updated_at
    )


@router.patch("/schedule/pause", response_model=TrainingScheduleResponse)
async def pause_schedule(db: Session = Depends(get_db)):
    """Pause the training schedule"""
    schedule = db.query(TrainingSchedule).first()
    
    if not schedule:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Schedule not configured"}}
        )
    
    schedule.is_paused = True
    schedule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(schedule)
    
    description = get_cron_description(schedule.cron_expression)
    next_run = calculate_next_run(schedule.cron_expression)
    
    return TrainingScheduleResponse(
        id=schedule.id,
        cron_expression=schedule.cron_expression,
        is_paused=schedule.is_paused,
        rank=schedule.rank,
        regParam=schedule.regParam,
        alpha=schedule.alpha,
        maxIter=schedule.maxIter,
        description=description,
        next_run=next_run,
        created_at=schedule.created_at,
        updated_at=schedule.updated_at
    )


@router.patch("/schedule/resume", response_model=TrainingScheduleResponse)
async def resume_schedule(db: Session = Depends(get_db)):
    """Resume the training schedule"""
    schedule = db.query(TrainingSchedule).first()
    
    if not schedule:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Schedule not configured"}}
        )
    
    schedule.is_paused = False
    schedule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(schedule)
    
    description = get_cron_description(schedule.cron_expression)
    next_run = calculate_next_run(schedule.cron_expression)
    
    return TrainingScheduleResponse(
        id=schedule.id,
        cron_expression=schedule.cron_expression,
        is_paused=schedule.is_paused,
        rank=schedule.rank,
        regParam=schedule.regParam,
        alpha=schedule.alpha,
        maxIter=schedule.maxIter,
        description=description,
        next_run=next_run,
        created_at=schedule.created_at,
        updated_at=schedule.updated_at
    )


@router.get("/statistics", response_model=TrainingStatistics)
async def get_training_statistics(db: Session = Depends(get_db)):
    """Get aggregated statistics about model training runs"""
    # Get all runs
    all_runs = db.query(ModelRun).all()
    
    total_runs = len(all_runs)
    success_count = sum(1 for r in all_runs if r.status == "success")
    failed_count = sum(1 for r in all_runs if r.status == "failed")
    running_count = sum(1 for r in all_runs if r.status == "running")
    queued_count = sum(1 for r in all_runs if r.status == "queued")
    cancelled_count = sum(1 for r in all_runs if r.status == "cancelled")
    
    success_rate = (success_count / total_runs * 100) if total_runs > 0 else 0.0
    
    # Calculate average duration
    completed_runs = [r for r in all_runs if r.duration and r.status in ["success", "failed"]]
    average_duration_minutes = None
    if completed_runs:
        total_minutes = 0
        count = 0
        for run in completed_runs:
            if run.start_time and run.end_time:
                delta = run.end_time - run.start_time
                total_minutes += delta.total_seconds() / 60
                count += 1
        if count > 0:
            average_duration_minutes = total_minutes / count
    
    # Get last run
    last_run = db.query(ModelRun).order_by(ModelRun.start_time.desc()).first()
    last_run_response = None
    if last_run:
        last_run_response = ModelRunResponse(
            id=last_run.id,
            run_id=last_run.run_id,
            status=RunStatus(last_run.status),
            start_time=last_run.start_time,
            end_time=last_run.end_time,
            duration=last_run.duration,
            triggered_by=TriggerType(last_run.triggered_by),
            logs=last_run.logs,
            created_at=last_run.created_at,
            updated_at=last_run.updated_at,
            hyper_parameters={
                "rank": last_run.rank,
                "regParam": last_run.regParam,
                "alpha": last_run.alpha,
                "maxIter": last_run.maxIter
            } if last_run.rank is not None else None
        )
    
    # Get next scheduled run
    schedule = db.query(TrainingSchedule).first()
    next_scheduled_run = None
    if schedule and not schedule.is_paused:
        next_scheduled_run = calculate_next_run(schedule.cron_expression)
    
    return TrainingStatistics(
        total_runs=total_runs,
        success_count=success_count,
        failed_count=failed_count,
        running_count=running_count,
        queued_count=queued_count,
        cancelled_count=cancelled_count,
        success_rate=round(success_rate, 2),
        average_duration_minutes=round(average_duration_minutes, 2) if average_duration_minutes else None,
        last_run=last_run_response,
        next_scheduled_run=next_scheduled_run
    )


@router.get("/runs/{run_id}/logs")
async def get_run_logs(run_id: str, db: Session = Depends(get_db)):
    """Get logs for a specific model training run"""
    run = db.query(ModelRun).filter(
        or_(ModelRun.id == run_id, ModelRun.run_id == run_id)
    ).first()

    if not run:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"Run with id {run_id} not found"
                }
            }
        )

    log_size = len(run.logs.encode('utf-8')) if run.logs else 0

    return {
        "run_id": run.run_id,
        "logs": run.logs or "",
        "log_size": log_size
    }


# ============================================================================ #
# Model Version Management Endpoints
# ============================================================================ #

@router.get("/model-versions", response_model=List[ModelVersionResponse])
async def get_model_versions(db: Session = Depends(get_db)):
    """Get all available model versions"""
    versions = db.query(ModelVersion).order_by(ModelVersion.created_at.desc()).all()
    return [
        ModelVersionResponse(
            id=v.id,
            version_tag=v.version_tag,
            artifact_path=v.artifact_path,
            created_at=v.created_at,
            isActive=v.isActive
        )
        for v in versions
    ]


@router.get("/model-versions/active", response_model=ActiveModelVersionResponse)
async def get_active_model_version(db: Session = Depends(get_db)):
    """Get the currently active model version"""
    # Get active model version (where isActive=True)
    active_version = db.query(ModelVersion).filter(
        ModelVersion.isActive == True
    ).first()

    if active_version:
        active_version_response = ModelVersionResponse(
            id=active_version.id,
            version_tag=active_version.version_tag,
            artifact_path=active_version.artifact_path,
            created_at=active_version.created_at,
            isActive=active_version.isActive
        )
        
        return ActiveModelVersionResponse(
            active_version=active_version_response,
            message=f"Active version: {active_version_response.version_tag}"
        )
    else:
        return ActiveModelVersionResponse(
            active_version=None,
            message="No active model version configured"
        )


@router.post("/model-versions/active", response_model=ActiveModelVersionResponse)
async def set_active_model_version(
    request: SetActiveVersionRequest,
    db: Session = Depends(get_db)
):
    """Set a specific model version as active"""
    # Check if the model version exists
    model_version = db.query(ModelVersion).filter(
        ModelVersion.id == request.model_version_id
    ).first()

    if not model_version:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"Model version with id {request.model_version_id} not found"
                }
            }
        )

    # Set all model versions to inactive first
    db.query(ModelVersion).update({ModelVersion.isActive: False})
    
    # Set the selected model version as active
    model_version.isActive = True
    db.commit()
    db.refresh(model_version)
    
    active_version_response = ModelVersionResponse(
        id=model_version.id,
        version_tag=model_version.version_tag,
        artifact_path=model_version.artifact_path,
        created_at=model_version.created_at,
        isActive=model_version.isActive
    )

    return ActiveModelVersionResponse(
        active_version=active_version_response,
        message=f"Successfully set active version to: {active_version_response.version_tag}"
    )


@router.get("/metrics", response_model=MetricsResponse)
async def get_model_metrics(
    version_id: int = Query(..., description="Model version ID"),
    db: Session = Depends(get_db)
):
    """Get all metrics for a specific model version"""
    # Verify that the model version exists
    model_version = db.query(ModelVersion).filter(
        ModelVersion.id == version_id
    ).first()
    
    if not model_version:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "NOT_FOUND",
                    "message": f"Model version with id {version_id} not found"
                }
            }
        )
    
    # Get all metrics for this model version
    metrics = db.query(Metric).filter(
        Metric.model_version_id == version_id
    ).order_by(Metric.timestamp.desc()).all()
    
    # Convert to response models
    metric_responses = [
        MetricResponse(
            metric_name=metric.metric_name,
            metric_value=metric.metric_value,
            timestamp=metric.timestamp
        )
        for metric in metrics
    ]
    
    return MetricsResponse(
        metrics=metric_responses,
        version_id=version_id,
        version_tag=model_version.version_tag
    )

