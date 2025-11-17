
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from pyspark.sql import SparkSession
from pyspark.ml.recommendation import ALSModel
import uvicorn
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import os
# Import database models and session
from database import (
    init_db, get_db, Build, ModelVersion, Metric, Schedule, ModelRun, TrainingSchedule
)

# Import model training API router
from model_training_api import router as model_training_router, MetricsResponse, MetricResponse

# ============================================================================ #
# PART 1: Initialize FastAPI App
# ============================================================================ #
app = FastAPI(
    title="ALS Recommendation API",
    description="API for getting product recommendations using ALS model",
    version="1.0.0"
)

# Include model training API router
app.include_router(model_training_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Global variables for Spark and Model
spark = None
loaded_model = None
active_model_version = None

# ============================================================================ #
# PART 2: Pydantic Models for Request/Response
# ============================================================================ #
class RecommendationResponse(BaseModel):
    ProductId: int
    rating: float

class UserRecommendationsResponse(BaseModel):
    user_id: int
    recommendations: List[RecommendationResponse]
    count: int
    active_model_version: str

class MultipleUsersRequest(BaseModel):
    user_ids: List[int] = Field(..., description="List of user IDs", min_items=1)
    num_items: Optional[int] = Field(10, description="Number of recommendations per user", ge=1, le=100)

class MultipleUsersResponse(BaseModel):
    results: List[UserRecommendationsResponse]
    total_users: int 
    active_model_version: str

# --- Pydantic Models for Project Management API ---

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ScheduleCreate(BaseModel):
    cron_expression: str
    is_active: bool = True

class ScheduleResponse(BaseModel):
    project_id: int
    cron_expression: str
    is_active: bool
    next_run_time: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class BuildResponse(BaseModel):
    build_id: int
    status: str
    message: str

class BuildStatusResponse(BaseModel):
    build_id: int
    status: str
    logs: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    model_version_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class MetricResponse(BaseModel):
    metric_name: str
    metric_value: float
    timestamp: datetime
    
    class Config:
        from_attributes = True

class MetricCreate(BaseModel):
    metric_name: str
    metric_value: float
    timestamp: Optional[datetime] = None

class VersionResponse(BaseModel):
    version_id: int
    version_tag: str
    created_at: datetime
    artifact_path: str
    
    class Config:
        from_attributes = True

class BuildSummaryResponse(BaseModel):
    build_id: int
    status: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    model_version_id: Optional[int] = None
    
    class Config:
        from_attributes = True

class ProjectOverviewResponse(BaseModel):
    project_id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    schedule: Optional[ScheduleResponse] = None
    latest_build: Optional[BuildSummaryResponse] = None
    total_builds: int
    total_versions: int
    latest_version: Optional[VersionResponse] = None
    
    class Config:
        from_attributes = True

# ============================================================================ #
# PART 3: Startup Event - Initialize Spark and Load Model
# ============================================================================ #
@app.on_event("startup")
async def startup_event():
    """Initialize Spark session, load ALS model, and initialize database"""
    global spark, loaded_model
    
    print("\n" + "="*80)
    print("🔧 INITIALIZING DATABASE")
    print("="*80)
    init_db()
    print("✅ Database initialized")
    
    print("\n" + "="*80)
    print("🔧 INITIALIZING SPARK SESSION")
    print("="*80)
    
    spark = SparkSession.builder \
        .appName("ALS_Recommender_API") \
        .master("local[*]") \
        .config("spark.driver.memory", "4g") \
        .config("spark.ui.enabled", "false") \
        .getOrCreate()
    
    print(f"✅ Spark session ready. Version: {spark.version}")
    
    print("\n" + "="*80)
    print("📂 LOADING ACTIVE MODEL VERSION")
    print("="*80)

    # Try to load the active model version from database
    model_loaded, model_version = load_active_model()

    if model_loaded:
        print("✅ Active model loaded successfully")
    else:
        print("⚠️ No active model version configured or model loading failed")
        print("   The API will still start but recommendation endpoints will not work")
        print("   Please set an active model version using: POST /api/v1/model-training/model-versions/active")
    
    print("\n" + "="*80)
    print("🚀 SERVER READY TO ACCEPT REQUESTS")
    print("="*80)

# ============================================================================ #
# PART 4: Shutdown Event - Stop Spark Session
# ============================================================================ #
@app.on_event("shutdown")
async def shutdown_event():
    """Stop Spark session on server shutdown"""
    global spark
    if spark:
        spark.stop()
        print("\n✅ Spark session stopped")

# ============================================================================ #
# PART 5: Helper Functions
# ============================================================================ #

def load_active_model():
    """
    Load the active model version from the database.
    Returns the loaded ALS model and model version info.
    """
    global spark, loaded_model, active_model_version

    if spark is None:
        print("❌ Spark session not available")
        return None, None

    try:
        # Get database session
        db = next(get_db())

        # Get active model version (where isActive=True)
        model_version = db.query(ModelVersion).filter(
            ModelVersion.isActive == True
        ).first()

        if not model_version:
            print("⚠️ No active model version configured")
            return None, None

        # Load the model
        model_path = model_version.artifact_path
        print(f"📂 Loading model from: {model_path}")

        if not os.path.exists(model_path):
            print(f"❌ Model path does not exist: {model_path}")
            return None, None

        loaded_model = ALSModel.load(model_path)
        active_model_version = model_version

        print("✅ Model loaded successfully")        
        print(f"  • Version: {model_version.version_tag}")
        print(f"  • Created: {model_version.created_at}")
        print(f"  • Rank: {loaded_model.rank}")
        print(f"  • User factors: {loaded_model.userFactors.count()}")
        print(f"  • Item factors: {loaded_model.itemFactors.count()}")

        return loaded_model, model_version

    except Exception as e:
        print(f"❌ Error loading active model: {e}")
        return None, None
    finally:
        db.close()


def reload_active_model():
    """
    Force reload the active model version.
    This can be called after changing the active version.
    """
    global loaded_model, active_model_version
    loaded_model, active_model_version = load_active_model()
    return loaded_model is not None
def get_recommendations_for_user(user_id: int, num_items: int = 10) -> List[dict]:
    """
    Get top-N recommendations for a specific user.

    Args:
        user_id (int): User ID
        num_items (int): Number of items to recommend (default 10)

    Returns:
        list of dict: [{'ProductId': ..., 'rating': ...}, ...]
    """
    global spark, loaded_model
    
    if spark is None or loaded_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    
    try:
        user_df = spark.createDataFrame([(user_id,)], ["Account_Id"])
        recs_df = loaded_model.recommendForUserSubset(user_df, num_items)
        
        if recs_df.count() == 0:
            return []
        
        recs_pd = recs_df.toPandas()
        
        if len(recs_pd) == 0:
            return []
        
        recs_list = recs_pd.iloc[0]['recommendations']
        
        # Flatten recommendations - after toPandas(), recs are dictionaries
        return [
            {'ProductId': int(rec['ProductId']), 'rating': float(rec['rating'])} 
            for rec in recs_list
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

def get_recommendations_for_multiple_users(user_ids: List[int], num_items: int = 10) -> List[dict]:
    """
    Get top-N recommendations for multiple users efficiently.

    Args:
        user_ids (List[int]): List of user IDs
        num_items (int): Number of items to recommend per user

    Returns:
        list of dict: [{'user_id': ..., 'recommendations': [...], 'count': ...}, ...]
    """
    global spark, loaded_model
    
    if spark is None or loaded_model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    
    try:
        # Create DataFrame with all user IDs
        users_df = spark.createDataFrame([(uid,) for uid in user_ids], ["Account_Id"])
        
        # Get recommendations for all users at once (more efficient)
        recs_df = loaded_model.recommendForUserSubset(users_df, num_items)
        
        if recs_df.count() == 0:
            return []
        
        # Convert to pandas
        recs_pd = recs_df.toPandas()
        
        # Format results
        results = []
        for _, row in recs_pd.iterrows():
            user_id = int(row['Account_Id'])
            recommendations = [
                {'ProductId': int(rec['ProductId']), 'rating': float(rec['rating'])} 
                for rec in row['recommendations']
            ]
            results.append({
                'user_id': user_id,
                'recommendations': recommendations,
                'count': len(recommendations)
            })
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")

# ============================================================================ #
# PART 6: API Endpoints
# ============================================================================ #
@app.get("/")
async def root():
    """Root endpoint with API information"""
    global active_model_version

    return {
        "message": "ALS Recommendation API with Model Version Management",
        "version": "1.0.0",
        "active_model": {
            "version": active_model_version.version_tag if active_model_version else None,
            "path": active_model_version.artifact_path if active_model_version else None,
            "created": active_model_version.created_at.isoformat() if active_model_version else None
        },
        "endpoints": {
            "recommendations": {
                "get_recommendations": "/recommendations/{user_id}",
                "get_multiple_recommendations": "/recommendations/batch"
            },
            "model_management": {
                "reload_active_model": "POST /model/reload",
                "list_model_versions": "GET /api/v1/model-training/model-versions",
                "get_active_version": "GET /api/v1/model-training/model-versions/active",
                "set_active_version": "POST /api/v1/model-training/model-versions/active"
            },
            "training_management": {
                "trigger_training": "POST /api/v1/model-training/runs/trigger",
                "get_training_runs": "GET /api/v1/model-training/runs",
                "get_run_details": "GET /api/v1/model-training/runs/{run_id}",
                "get_run_logs": "GET /api/v1/model-training/runs/{run_id}/logs",
                "get_training_statistics": "GET /api/v1/model-training/statistics",
                "manage_schedule": "GET/PUT/PATCH /api/v1/model-training/schedule"
            }
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    global spark, loaded_model, active_model_version

    status = "healthy" if (spark is not None and loaded_model is not None) else "unhealthy"

    return {
        "status": status,
        "spark_initialized": spark is not None,
        "model_loaded": loaded_model is not None,
        "active_model_version": active_model_version.version_tag if active_model_version else None,
        "active_model_path": active_model_version.artifact_path if active_model_version else None,
        "active_model_created": active_model_version.created_at.isoformat() if active_model_version else None
    }

@app.get("/recommendations/{user_id}", response_model=UserRecommendationsResponse)
async def get_recommendations(user_id: int, num_items: int = 10):
    """
    Get product recommendations for a single user.
    
    Args:
        user_id (int): User ID to get recommendations for
        num_items (int): Number of recommendations to return (default: 10, max: 100)
    
    Returns:
        UserRecommendationsResponse: User ID with list of recommended products
    """
    if num_items < 1 or num_items > 100:
        raise HTTPException(status_code=400, detail="num_items must be between 1 and 100")
    
    recommendations = get_recommendations_for_user(user_id, num_items)
    
    if not recommendations:
        raise HTTPException(status_code=404, detail=f"No recommendations found for user {user_id}")
    
    return UserRecommendationsResponse(
        user_id=user_id,
        recommendations=recommendations,
        count=len(recommendations),
        active_model_version=active_model_version.version_tag if active_model_version else None
    )

@app.post("/recommendations/batch", response_model=MultipleUsersResponse)
async def get_batch_recommendations(request: MultipleUsersRequest):
    """
    Get product recommendations for multiple users at once.
    
    Args:
        request (MultipleUsersRequest): Contains list of user IDs and optional num_items
    
    Returns:
        MultipleUsersResponse: List of recommendations for each user
    """
    if request.num_items < 1 or request.num_items > 100:
        raise HTTPException(status_code=400, detail="num_items must be between 1 and 100")
    
    if len(request.user_ids) > 1000:
        raise HTTPException(status_code=400, detail="Maximum 1000 users per batch request")
    
    results = get_recommendations_for_multiple_users(request.user_ids, request.num_items)
    
    if not results:
        raise HTTPException(status_code=404, detail="No recommendations found for any user")
    
    return MultipleUsersResponse(
        results=results,
        total_users=len(results),
        active_model_version=active_model_version.version_tag if active_model_version else None
    )


@app.post("/model/reload")
async def reload_model():
    """
    Reload the active model version.
    This should be called after changing the active model version.
    """
    global loaded_model, active_model_version

    print("🔄 Reloading active model version...")

    success = reload_active_model()

    if success:
        return {
            "status": "success",
            "message": "Model reloaded successfully",
            "active_version": active_model_version.version_tag if active_model_version else None,
            "model_path": active_model_version.artifact_path if active_model_version else None
        }
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to reload model. Check server logs for details."
        )


# @app.get("/api/model-training/metrics", response_model=MetricsResponse)
# async def get_model_metrics_api(
#     version_id: int = Query(..., description="Model version ID"),
#     db: Session = Depends(get_db)
# ):
#     """
#     Get all metrics for a specific model version.
#     This endpoint matches the frontend's expected path: /api/model-training/metrics
#     """
#     # Verify that the model version exists
#     model_version = db.query(ModelVersion).filter(
#         ModelVersion.id == version_id
#     ).first()
    
#     if not model_version:
#         raise HTTPException(
#             status_code=404,
#             detail={
#                 "error": {
#                     "code": "NOT_FOUND",
#                     "message": f"Model version with id {version_id} not found"
#                 }
#             }
#         )
    
#     # Get all metrics for this model version
#     metrics = db.query(Metric).filter(
#         Metric.model_version_id == version_id
#     ).order_by(Metric.timestamp.desc()).all()
    
#     # Convert to response models
#     metric_responses = [
#         MetricResponse(
#             metric_name=metric.metric_name,
#             metric_value=metric.metric_value,
#             timestamp=metric.timestamp
#         )
#         for metric in metrics
#     ]
    
#     return MetricsResponse(
#         metrics=metric_responses,
#         version_id=version_id,
#         version_tag=model_version.version_tag
#     )



# ============================================================================ #
# PART 8: Run Server
# ============================================================================ #
if __name__ == "__main__":
    print("\n🚀 Starting ALS Recommendation API Server...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📚 API documentation at: http://localhost:8000/docs")
    print("📊 Alternative docs at: http://localhost:8000/redoc")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
