"""
Pipeline Service - Orchestrates end-to-end sync workflows
"""
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

from src.core.base import BaseService, OperationResult, OperationStatus
from src.services.figma_service import FigmaService
from src.services.sheet_service import SheetService
from src.services.data_processor_service import (
    DataProcessorService, SyncConfig, SyncDirection, 
    ConflictResolutionStrategy, SyncResult
)
from src.utils.logger import get_logger


class PipelineStatus(Enum):
    """Pipeline execution status"""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PARTIAL_SUCCESS = "partial_success"


class PipelineStage(Enum):
    """Các stage trong pipeline"""
    INIT = "initialization"
    LOAD_FIGMA = "load_figma_data"
    LOAD_SHEETS = "load_sheets_data"
    ANALYZE = "analyze_compatibility"
    TRANSFORM = "transform_data"
    DETECT_CONFLICTS = "detect_conflicts"
    RESOLVE_CONFLICTS = "resolve_conflicts"
    SYNC = "perform_sync"
    VALIDATE = "validate_results"
    CLEANUP = "cleanup"


@dataclass
class PipelineConfig:
    """Cấu hình cho pipeline execution"""
    figma_file_id: str
    spreadsheet_id: str
    sync_config: SyncConfig
    
    # Pipeline behavior
    auto_create_sheet: bool = True
    auto_resolve_conflicts: bool = True
    backup_before_sync: bool = True
    validate_after_sync: bool = True
    
    # Progress tracking
    progress_callback: Optional[Callable[[str, int], None]] = None
    stage_callback: Optional[Callable[[PipelineStage, Dict[str, Any]], None]] = None
    
    # Error handling
    stop_on_first_error: bool = False
    max_retry_attempts: int = 3
    retry_delay_seconds: int = 5


@dataclass
class StageResult:
    """Kết quả của một stage trong pipeline"""
    stage: PipelineStage
    status: PipelineStatus
    message: str
    data: Any = None
    errors: List[str] = None
    warnings: List[str] = None
    duration_seconds: float = 0.0
    metadata: Dict[str, Any] = None


@dataclass
class PipelineResult:
    """Kết quả hoàn chỉnh của pipeline execution"""
    pipeline_id: str
    status: PipelineStatus
    start_time: datetime
    end_time: Optional[datetime]
    total_duration_seconds: float
    
    # Stage results
    stage_results: List[StageResult]
    
    # Final results
    sync_result: Optional[SyncResult]
    backup_info: Optional[Dict[str, Any]]
    validation_result: Optional[Dict[str, Any]]
    
    # Summary
    total_stages: int
    successful_stages: int
    failed_stages: int
    
    # Error tracking
    errors: List[str]
    warnings: List[str]
    
    # Metadata
    config: PipelineConfig
    metadata: Dict[str, Any]


class PipelineService(BaseService):
    """Service orchestrates end-to-end sync workflows"""
    
    def __init__(
        self, 
        figma_service: FigmaService, 
        sheet_service: SheetService, 
        data_processor_service: DataProcessorService,
        logger=None
    ):
        super().__init__(logger)
        self.figma_service = figma_service
        self.sheet_service = sheet_service
        self.data_processor_service = data_processor_service
        self.logger = logger or get_logger(self.__class__.__name__)
        
        # Track running pipelines
        self._running_pipelines: Dict[str, PipelineResult] = {}
    
    def execute_sync_pipeline(self, config: PipelineConfig) -> OperationResult[PipelineResult]:
        """Execute complete sync pipeline"""
        pipeline_id = f"pipeline_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Initialize pipeline result
        pipeline_result = PipelineResult(
            pipeline_id=pipeline_id,
            status=PipelineStatus.RUNNING,
            start_time=datetime.now(),
            end_time=None,
            total_duration_seconds=0.0,
            stage_results=[],
            sync_result=None,
            backup_info=None,
            validation_result=None,
            total_stages=0,
            successful_stages=0,
            failed_stages=0,
            errors=[],
            warnings=[],
            config=config,
            metadata={}
        )
        
        self._running_pipelines[pipeline_id] = pipeline_result
        
        try:
            self.log_info(f"Starting sync pipeline {pipeline_id}")
            
            # Execute pipeline stages
            stages = self._get_pipeline_stages(config)
            pipeline_result.total_stages = len(stages)
            
            for i, stage in enumerate(stages):
                progress = int((i / len(stages)) * 100)
                
                # Progress callback
                if config.progress_callback:
                    config.progress_callback(f"Executing {stage.value}", progress)
                
                # Execute stage
                stage_result = self._execute_stage(stage, config, pipeline_result)
                pipeline_result.stage_results.append(stage_result)
                
                # Stage callback
                if config.stage_callback:
                    config.stage_callback(stage, {
                        "status": stage_result.status.value,
                        "message": stage_result.message,
                        "progress": progress
                    })
                
                # Track success/failure
                if stage_result.status == PipelineStatus.SUCCESS:
                    pipeline_result.successful_stages += 1
                else:
                    pipeline_result.failed_stages += 1
                    pipeline_result.errors.extend(stage_result.errors or [])
                    
                    # Stop on error if configured
                    if config.stop_on_first_error and stage_result.status == PipelineStatus.FAILED:
                        self.log_error(f"Pipeline {pipeline_id} stopped due to error in stage {stage.value}")
                        break
            
            # Determine final status
            if pipeline_result.failed_stages == 0:
                pipeline_result.status = PipelineStatus.SUCCESS
            elif pipeline_result.successful_stages > 0:
                pipeline_result.status = PipelineStatus.PARTIAL_SUCCESS
            else:
                pipeline_result.status = PipelineStatus.FAILED
            
            # Finalize
            pipeline_result.end_time = datetime.now()
            pipeline_result.total_duration_seconds = (
                pipeline_result.end_time - pipeline_result.start_time
            ).total_seconds()
            
            # Final progress update
            if config.progress_callback:
                config.progress_callback("Pipeline completed", 100)
            
            self.log_info(f"Pipeline {pipeline_id} completed with status: {pipeline_result.status.value}")
            
            return OperationResult(
                status=OperationStatus.SUCCESS if pipeline_result.status in [PipelineStatus.SUCCESS, PipelineStatus.PARTIAL_SUCCESS] else OperationStatus.FAILED,
                data=pipeline_result,
                message=f"Pipeline {pipeline_id} completed",
                metadata={
                    "pipeline_id": pipeline_id,
                    "final_status": pipeline_result.status.value,
                    "duration": pipeline_result.total_duration_seconds
                }
            )
            
        except Exception as e:
            error_msg = f"Pipeline {pipeline_id} failed with exception: {e}"
            self.log_error(error_msg)
            
            pipeline_result.status = PipelineStatus.FAILED
            pipeline_result.end_time = datetime.now()
            pipeline_result.errors.append(str(e))
            
            return OperationResult(
                status=OperationStatus.FAILED,
                data=pipeline_result,
                message=error_msg,
                errors=[str(e)]
            )
        
        finally:
            # Cleanup
            if pipeline_id in self._running_pipelines:
                del self._running_pipelines[pipeline_id]
    
    def get_pipeline_status(self, pipeline_id: str) -> OperationResult[PipelineResult]:
        """Get status of running pipeline"""
        if pipeline_id in self._running_pipelines:
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=self._running_pipelines[pipeline_id],
                message=f"Pipeline {pipeline_id} status retrieved"
            )
        else:
            return OperationResult(
                status=OperationStatus.FAILED,
                message=f"Pipeline {pipeline_id} not found",
                errors=["Pipeline not found"]
            )
    
    def cancel_pipeline(self, pipeline_id: str) -> OperationResult[bool]:
        """Cancel running pipeline"""
        if pipeline_id in self._running_pipelines:
            pipeline_result = self._running_pipelines[pipeline_id]
            pipeline_result.status = PipelineStatus.CANCELLED
            pipeline_result.end_time = datetime.now()
            
            return OperationResult(
                status=OperationStatus.SUCCESS,
                data=True,
                message=f"Pipeline {pipeline_id} cancelled"
            )
        else:
            return OperationResult(
                status=OperationStatus.FAILED,
                data=False,
                message=f"Pipeline {pipeline_id} not found",
                errors=["Pipeline not found"]
            )
    
    def create_quick_sync_config(
        self,
        figma_file_id: str,
        spreadsheet_id: str,
        direction: SyncDirection = SyncDirection.FIGMA_TO_SHEETS
    ) -> SyncConfig:
        """Tạo quick config cho common use cases"""
        return SyncConfig(
            direction=direction,
            conflict_resolution=ConflictResolutionStrategy.FIGMA_WINS,
            dry_run=False
        )
    
    def _get_pipeline_stages(self, config: PipelineConfig) -> List[PipelineStage]:
        """Get list of stages để execute dựa trên config"""
        stages = [
            PipelineStage.INIT,
            PipelineStage.LOAD_FIGMA,
        ]
        
        # Add sheet loading stage
        if not config.auto_create_sheet:
            stages.append(PipelineStage.LOAD_SHEETS)
        
        stages.extend([
            PipelineStage.ANALYZE,
            PipelineStage.TRANSFORM,
            PipelineStage.DETECT_CONFLICTS,
        ])
        
        # Add conflict resolution if auto-resolve enabled
        if config.auto_resolve_conflicts:
            stages.append(PipelineStage.RESOLVE_CONFLICTS)
        
        stages.append(PipelineStage.SYNC)
        
        # Add validation if enabled
        if config.validate_after_sync:
            stages.append(PipelineStage.VALIDATE)
        
        stages.append(PipelineStage.CLEANUP)
        
        return stages
    
    def _execute_stage(
        self, 
        stage: PipelineStage, 
        config: PipelineConfig, 
        pipeline_result: PipelineResult
    ) -> StageResult:
        """Execute individual pipeline stage"""
        start_time = datetime.now()
        
        try:
            self.log_info(f"Executing stage: {stage.value}")
            
            if stage == PipelineStage.INIT:
                return self._stage_init(config)
                
            elif stage == PipelineStage.LOAD_FIGMA:
                return self._stage_load_figma(config)
                
            elif stage == PipelineStage.LOAD_SHEETS:
                return self._stage_load_sheets(config)
                
            elif stage == PipelineStage.ANALYZE:
                return self._stage_analyze(config)
                
            elif stage == PipelineStage.TRANSFORM:
                return self._stage_transform(config)
                
            elif stage == PipelineStage.DETECT_CONFLICTS:
                return self._stage_detect_conflicts(config)
                
            elif stage == PipelineStage.RESOLVE_CONFLICTS:
                return self._stage_resolve_conflicts(config)
                
            elif stage == PipelineStage.SYNC:
                return self._stage_sync(config, pipeline_result)
                
            elif stage == PipelineStage.VALIDATE:
                return self._stage_validate(config, pipeline_result)
                
            elif stage == PipelineStage.CLEANUP:
                return self._stage_cleanup(config)
                
            else:
                return StageResult(
                    stage=stage,
                    status=PipelineStatus.FAILED,
                    message=f"Unknown stage: {stage.value}",
                    errors=[f"Unknown stage: {stage.value}"]
                )
                
        except Exception as e:
            error_msg = f"Stage {stage.value} failed: {e}"
            self.log_error(error_msg)
            
            return StageResult(
                stage=stage,
                status=PipelineStatus.FAILED,
                message=error_msg,
                errors=[str(e)],
                duration_seconds=(datetime.now() - start_time).total_seconds()
            )
    
    def _stage_init(self, config: PipelineConfig) -> StageResult:
        """Initialize pipeline"""
        start_time = datetime.now()
        
        # Validate config
        if not config.figma_file_id:
            return StageResult(
                stage=PipelineStage.INIT,
                status=PipelineStatus.FAILED,
                message="Missing Figma file ID",
                errors=["Missing Figma file ID"]
            )
        
        if not config.spreadsheet_id and not config.auto_create_sheet:
            return StageResult(
                stage=PipelineStage.INIT,
                status=PipelineStatus.FAILED,
                message="Missing spreadsheet ID and auto_create_sheet is disabled",
                errors=["Missing spreadsheet ID"]
            )
        
        return StageResult(
            stage=PipelineStage.INIT,
            status=PipelineStatus.SUCCESS,
            message="Pipeline initialized successfully",
            duration_seconds=(datetime.now() - start_time).total_seconds()
        )
    
    def _stage_load_figma(self, config: PipelineConfig) -> StageResult:
        """Load Figma data"""
        start_time = datetime.now()
        
        result = self.figma_service.get_file_with_variables(config.figma_file_id)
        
        if result.is_success:
            return StageResult(
                stage=PipelineStage.LOAD_FIGMA,
                status=PipelineStatus.SUCCESS,
                message=f"Loaded Figma file with {result.data.total_variable_count} variables",
                data=result.data,
                duration_seconds=(datetime.now() - start_time).total_seconds(),
                metadata=result.metadata
            )
        else:
            return StageResult(
                stage=PipelineStage.LOAD_FIGMA,
                status=PipelineStatus.FAILED,
                message=f"Failed to load Figma file: {result.message}",
                errors=result.errors,
                duration_seconds=(datetime.now() - start_time).total_seconds()
            )
    
    def _stage_load_sheets(self, config: PipelineConfig) -> StageResult:
        """Load Sheets data"""
        start_time = datetime.now()
        
        result = self.sheet_service.get_variables_data(config.spreadsheet_id)
        
        if result.is_success:
            return StageResult(
                stage=PipelineStage.LOAD_SHEETS,
                status=PipelineStatus.SUCCESS,
                message=f"Loaded sheet with {len(result.data)} variables",
                data=result.data,
                duration_seconds=(datetime.now() - start_time).total_seconds()
            )
        else:
            return StageResult(
                stage=PipelineStage.LOAD_SHEETS,
                status=PipelineStatus.FAILED,
                message=f"Failed to load sheet data: {result.message}",
                errors=result.errors,
                duration_seconds=(datetime.now() - start_time).total_seconds()
            )
    
    def _stage_analyze(self, config: PipelineConfig) -> StageResult:
        """Analyze compatibility"""
        start_time = datetime.now()
        
        result = self.data_processor_service.analyze_sync_feasibility(
            config.figma_file_id, config.spreadsheet_id
        )
        
        if result.is_success:
            return StageResult(
                stage=PipelineStage.ANALYZE,
                status=PipelineStatus.SUCCESS,
                message="Compatibility analysis completed",
                data=result.data,
                duration_seconds=(datetime.now() - start_time).total_seconds()
            )
        else:
            return StageResult(
                stage=PipelineStage.ANALYZE,
                status=PipelineStatus.FAILED,
                message=f"Analysis failed: {result.message}",
                errors=result.errors,
                duration_seconds=(datetime.now() - start_time).total_seconds()
            )
    
    def _stage_transform(self, config: PipelineConfig) -> StageResult:
        """Transform data"""
        start_time = datetime.now()
        
        # This is handled internally in sync operation
        return StageResult(
            stage=PipelineStage.TRANSFORM,
            status=PipelineStatus.SUCCESS,
            message="Data transformation prepared",
            duration_seconds=(datetime.now() - start_time).total_seconds()
        )
    
    def _stage_detect_conflicts(self, config: PipelineConfig) -> StageResult:
        """Detect conflicts"""
        start_time = datetime.now()
        
        # This is handled internally in sync operation
        return StageResult(
            stage=PipelineStage.DETECT_CONFLICTS,
            status=PipelineStatus.SUCCESS,
            message="Conflict detection prepared",
            duration_seconds=(datetime.now() - start_time).total_seconds()
        )
    
    def _stage_resolve_conflicts(self, config: PipelineConfig) -> StageResult:
        """Resolve conflicts"""
        start_time = datetime.now()
        
        # This is handled by conflict resolution strategy in sync
        return StageResult(
            stage=PipelineStage.RESOLVE_CONFLICTS,
            status=PipelineStatus.SUCCESS,
            message="Conflict resolution strategy applied",
            duration_seconds=(datetime.now() - start_time).total_seconds()
        )
    
    def _stage_sync(self, config: PipelineConfig, pipeline_result: PipelineResult) -> StageResult:
        """Perform actual sync"""
        start_time = datetime.now()
        
        if config.sync_config.direction == SyncDirection.FIGMA_TO_SHEETS:
            result = self.data_processor_service.sync_figma_to_sheets(
                config.figma_file_id, config.spreadsheet_id, config.sync_config
            )
        elif config.sync_config.direction == SyncDirection.SHEETS_TO_FIGMA:
            result = self.data_processor_service.sync_sheets_to_figma(
                config.spreadsheet_id, config.figma_file_id, config.sync_config
            )
        else:  # BIDIRECTIONAL
            result = self.data_processor_service.perform_bidirectional_sync(
                config.figma_file_id, config.spreadsheet_id, config.sync_config
            )
        
        if result.is_success:
            pipeline_result.sync_result = result.data
            return StageResult(
                stage=PipelineStage.SYNC,
                status=PipelineStatus.SUCCESS,
                message=f"Sync completed: {result.message}",
                data=result.data,
                duration_seconds=(datetime.now() - start_time).total_seconds(),
                metadata=result.metadata
            )
        else:
            return StageResult(
                stage=PipelineStage.SYNC,
                status=PipelineStatus.FAILED,
                message=f"Sync failed: {result.message}",
                errors=result.errors,
                duration_seconds=(datetime.now() - start_time).total_seconds()
            )
    
    def _stage_validate(self, config: PipelineConfig, pipeline_result: PipelineResult) -> StageResult:
        """Validate sync results"""
        start_time = datetime.now()
        
        # Simple validation - check if sync result exists
        if pipeline_result.sync_result:
            return StageResult(
                stage=PipelineStage.VALIDATE,
                status=PipelineStatus.SUCCESS,
                message="Sync validation completed",
                data={"validation_passed": True},
                duration_seconds=(datetime.now() - start_time).total_seconds()
            )
        else:
            return StageResult(
                stage=PipelineStage.VALIDATE,
                status=PipelineStatus.FAILED,
                message="No sync result to validate",
                errors=["Missing sync result"],
                duration_seconds=(datetime.now() - start_time).total_seconds()
            )
    
    def _stage_cleanup(self, config: PipelineConfig) -> StageResult:
        """Cleanup pipeline resources"""
        start_time = datetime.now()
        
        # Placeholder for cleanup operations
        return StageResult(
            stage=PipelineStage.CLEANUP,
            status=PipelineStatus.SUCCESS,
            message="Pipeline cleanup completed",
            duration_seconds=(datetime.now() - start_time).total_seconds()
        )
