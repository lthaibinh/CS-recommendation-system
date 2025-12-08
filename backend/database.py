"""
Database models and session management for PostgreSQL

The database connection string can be set via the DATABASE_URL environment variable.
If not set, it defaults to the Neon PostgreSQL connection string.
"""
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Float, Boolean, ForeignKey, Index, LargeBinary
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import uuid
import os

Base = declarative_base()


class Build(Base):
    """Bảng Build - Đại diện cho một lần thực thi build"""
    __tablename__ = "builds"
    
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, nullable=False, default="PENDING")  # PENDING, RUNNING, SUCCESS, FAILED
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    logs = Column(Text, nullable=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=True)
    
    # Relationships
    model_version = relationship("ModelVersion", back_populates="builds")


class ModelVersion(Base):
    """Bảng ModelVersion - Quản lý các phiên bản model đã build thành công"""
    __tablename__ = "model_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, nullable=True)  # Legacy column for single-project system (no FK constraint)
    version_tag = Column(String, nullable=False)  # e.g., "v1.0.0", "v1.1.0", "2025-11-12_12-30-00"
    artifact_path = Column(String, nullable=True)  # Optional: file path for backward compatibility
    model_data = Column(LargeBinary, nullable=True)  # Binary data of the model (zipped directory)
    isActive = Column(Boolean, default=False, nullable=False)  # Indicates if this model version is active/loaded
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    builds = relationship("Build", back_populates="model_version")
    metrics = relationship("Metric", back_populates="model_version", cascade="all, delete-orphan")


class Metric(Base):
    """Bảng Metric - Lưu trữ các metrics cho dashboard"""
    __tablename__ = "metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False)
    metric_name = Column(String, nullable=False)  # e.g., "RMSE", "Precision@10"
    metric_value = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    model_version = relationship("ModelVersion", back_populates="metrics")


class Schedule(Base):
    """Bảng Schedule - Lưu trữ thông tin lịch chạy"""
    __tablename__ = "schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    cron_expression = Column(String, nullable=False)  # e.g., "0 5 * * *"
    is_active = Column(Boolean, default=True, nullable=False)
    next_run_time = Column(DateTime, nullable=True)


class ModelRun(Base):
    """Table: model_runs - Stores information about each model training run"""
    __tablename__ = "model_runs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id = Column(String, unique=True, nullable=False, index=True)
    status = Column(String, nullable=False)  # 'success', 'failed', 'running', 'queued', 'cancelled'
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    duration = Column(String, nullable=True)  # Human-readable duration
    triggered_by = Column(String, nullable=False)  # 'manual' or 'scheduled'
    logs = Column(Text, nullable=True)
    # Hyperparameters used for model training
    rank = Column(Integer, nullable=True)  # Number of latent factors
    regParam = Column(Float, nullable=True)  # Regularization parameter
    alpha = Column(Float, nullable=True)  # Confidence amplification factor
    maxIter = Column(Integer, nullable=True)  # Maximum number of iterations
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Indexes
    __table_args__ = (
        Index('idx_model_runs_status', 'status'),
        Index('idx_model_runs_start_time', 'start_time'),
        Index('idx_model_runs_triggered_by', 'triggered_by'),
    )


class TrainingSchedule(Base):
    """Table: training_schedule - Stores the training schedule configuration"""
    __tablename__ = "training_schedule"
    
    id = Column(Integer, primary_key=True, index=True)
    cron_expression = Column(String, nullable=False)
    is_paused = Column(Boolean, default=False, nullable=False)
    # Hyperparameters used for scheduled training runs
    rank = Column(Integer, nullable=True)  # Number of latent factors
    regParam = Column(Float, nullable=True)  # Regularization parameter
    alpha = Column(Float, nullable=True)  # Confidence amplification factor
    maxIter = Column(Integer, nullable=True)  # Maximum number of iterations
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# Database setup
# Use PostgreSQL connection string from environment variable or default
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_uyQw3XCvVd9m@ep-late-recipe-a1io9vga-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=5,  # Connection pool size
    max_overflow=10  # Max overflow connections
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def migrate_add_model_data_column():
    """Add model_data column to model_versions table if it doesn't exist"""
    from sqlalchemy import inspect, text
    
    try:
        inspector = inspect(engine)
        if 'model_versions' not in inspector.get_table_names():
            return
        
        columns = [col['name'] for col in inspector.get_columns('model_versions')]
        
        if 'model_data' not in columns:
            print("🔄 Migrating database: Adding model_data column to model_versions table...")
            with engine.connect() as conn:
                # PostgreSQL supports IF NOT EXISTS
                conn.execute(text("ALTER TABLE model_versions ADD COLUMN IF NOT EXISTS model_data BYTEA"))
                conn.commit()
            print("✅ Migration completed: model_data column added to model_versions")
    except Exception as e:
        print(f"⚠️ Migration note: {e}")


def init_db():
    """Initialize database - create all tables"""
    Base.metadata.create_all(bind=engine)
    # Migrate existing database to add isActive column to model_versions if it doesn't exist
    migrate_add_isActive_to_model_versions()
    # Migrate existing database to remove project_id columns (for single-project system)
    migrate_remove_project_id_columns()
    # Migrate existing database to add hyperparameter columns to model_runs if they don't exist
    migrate_add_hyperparameters_to_model_runs()
    # Migrate existing database to add hyperparameter columns to training_schedule if they don't exist
    migrate_add_hyperparameters_to_training_schedule()
    # Migrate existing database to add model_data column to model_versions if it doesn't exist
    migrate_add_model_data_column()


def migrate_add_isActive_to_model_versions():
    """Add isActive column to model_versions table if it doesn't exist"""
    from sqlalchemy import inspect, text
    
    try:
        # Check if table exists
        inspector = inspect(engine)
        if 'model_versions' not in inspector.get_table_names():
            # Table doesn't exist yet, will be created by create_all
            return
        
        # Check if column exists
        columns = [col['name'] for col in inspector.get_columns('model_versions')]
        
        if 'isActive' not in columns:
            print("🔄 Migrating database: Adding isActive column to model_versions table...")
            with engine.connect() as conn:
                # PostgreSQL supports IF NOT EXISTS
                conn.execute(text("ALTER TABLE model_versions ADD COLUMN IF NOT EXISTS \"isActive\" BOOLEAN DEFAULT FALSE"))
                conn.commit()
            print("✅ Migration completed: isActive column added to model_versions")
    except Exception as e:
        # If migration fails, log but don't crash - table might be created fresh
        print(f"⚠️ Migration note: {e}")


def migrate_remove_project_id_columns():
    """Make project_id nullable in model_versions table (migration to single-project system)"""
    from sqlalchemy import inspect, text
    
    try:
        inspector = inspect(engine)
        
        # For model_versions table, make project_id nullable if it exists
        if 'model_versions' in inspector.get_table_names():
            columns = [col['name'] for col in inspector.get_columns('model_versions')]
            if 'project_id' in columns:
                # Check if it's already nullable
                col_info = next((col for col in inspector.get_columns('model_versions') if col['name'] == 'project_id'), None)
                if col_info and col_info.get('nullable') is False:
                    print("🔄 Migrating database: Making project_id nullable in model_versions table...")
                    with engine.connect() as conn:
                        # PostgreSQL supports ALTER COLUMN
                        conn.execute(text("ALTER TABLE model_versions ALTER COLUMN project_id DROP NOT NULL"))
                        conn.commit()
                    print("✅ Migration completed: project_id is now nullable")
        
        # Check other tables
        tables_to_check = ['builds', 'schedules']
        for table_name in tables_to_check:
            if table_name in inspector.get_table_names():
                columns = [col['name'] for col in inspector.get_columns(table_name)]
                if 'project_id' in columns:
                    print(f"⚠️ Note: {table_name} table still has project_id column. "
                          f"This will be ignored in the single-project system.")
    except Exception as e:
        print(f"⚠️ Migration note: {e}")


def migrate_add_hyperparameters_to_model_runs():
    """Add hyperparameter columns to model_runs table if they don't exist"""
    from sqlalchemy import inspect, text
    
    try:
        inspector = inspect(engine)
        if 'model_runs' not in inspector.get_table_names():
            return
        
        columns = [col['name'] for col in inspector.get_columns('model_runs')]
        columns_to_add = {
            'rank': 'INTEGER',
            'regParam': 'DOUBLE PRECISION',
            'alpha': 'DOUBLE PRECISION',
            'maxIter': 'INTEGER'
        }
        
        added_columns = []
        for col_name, col_type in columns_to_add.items():
            if col_name not in columns:
                print(f"🔄 Migrating database: Adding {col_name} column to model_runs table...")
                with engine.connect() as conn:
                    # PostgreSQL supports IF NOT EXISTS
                    conn.execute(text(f"ALTER TABLE model_runs ADD COLUMN IF NOT EXISTS \"{col_name}\" {col_type}"))
                    conn.commit()
                added_columns.append(col_name)
        
        if added_columns:
            print(f"✅ Migration completed: Added columns {', '.join(added_columns)} to model_runs")
    except Exception as e:
        print(f"⚠️ Migration note: {e}")


def migrate_add_hyperparameters_to_training_schedule():
    """Add hyperparameter columns to training_schedule table if they don't exist"""
    from sqlalchemy import inspect, text
    
    try:
        inspector = inspect(engine)
        if 'training_schedule' not in inspector.get_table_names():
            return
        
        columns = [col['name'] for col in inspector.get_columns('training_schedule')]
        columns_to_add = {
            'rank': 'INTEGER',
            'regParam': 'DOUBLE PRECISION',
            'alpha': 'DOUBLE PRECISION',
            'maxIter': 'INTEGER'
        }
        
        added_columns = []
        for col_name, col_type in columns_to_add.items():
            if col_name not in columns:
                print(f"🔄 Migrating database: Adding {col_name} column to training_schedule table...")
                with engine.connect() as conn:
                    # PostgreSQL supports IF NOT EXISTS
                    conn.execute(text(f"ALTER TABLE training_schedule ADD COLUMN IF NOT EXISTS \"{col_name}\" {col_type}"))
                    conn.commit()
                added_columns.append(col_name)
        
        if added_columns:
            print(f"✅ Migration completed: Added columns {', '.join(added_columns)} to training_schedule")
    except Exception as e:
        print(f"⚠️ Migration note: {e}")


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

