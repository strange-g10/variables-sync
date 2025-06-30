"""
Base classes và interfaces cho Variables Sync Pipeline
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, TypeVar, Generic
from dataclasses import dataclass
from enum import Enum

T = TypeVar('T')


class OperationStatus(Enum):
    """Status của các operations"""
    SUCCESS = "success"
    FAILED = "failed"
    WARNING = "warning"
    IN_PROGRESS = "in_progress"


@dataclass
class OperationResult(Generic[T]):
    """Kết quả của một operation"""
    status: OperationStatus
    data: Optional[T] = None
    message: str = ""
    errors: List[str] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []
        if self.metadata is None:
            self.metadata = {}
    
    @property
    def is_success(self) -> bool:
        return self.status == OperationStatus.SUCCESS
    
    @property
    def is_failed(self) -> bool:
        return self.status == OperationStatus.FAILED


class BaseRepository(ABC):
    """Base repository interface"""
    
    @abstractmethod
    def save(self, data: Any) -> OperationResult[bool]:
        pass
    
    @abstractmethod
    def load(self, identifier: str) -> OperationResult[Any]:
        pass
    
    @abstractmethod
    def exists(self, identifier: str) -> bool:
        pass


class BaseService(ABC):
    """Base service class"""
    
    def __init__(self, logger=None):
        self.logger = logger
    
    def log_info(self, message: str, **kwargs):
        if self.logger:
            self.logger.info(message, extra=kwargs)
    
    def log_error(self, message: str, **kwargs):
        if self.logger:
            self.logger.error(message, extra=kwargs)
    
    def log_warning(self, message: str, **kwargs):
        if self.logger:
            self.logger.warning(message, extra=kwargs)


class BaseProcessor(ABC):
    """Base processor for data transformations"""
    
    @abstractmethod
    def process(self, input_data: Any) -> OperationResult[Any]:
        pass
    
    @abstractmethod
    def validate_input(self, input_data: Any) -> bool:
        pass


class BaseClient(ABC):
    """Base client for external APIs"""
    
    def __init__(self, base_url: str, timeout: int = 30, max_retries: int = 3):
        self.base_url = base_url
        self.timeout = timeout
        self.max_retries = max_retries
    
    @abstractmethod
    def authenticate(self) -> bool:
        pass
    
    @abstractmethod
    def make_request(self, endpoint: str, method: str = "GET", **kwargs) -> OperationResult[Any]:
        pass


class BaseCLI(ABC):
    """Base CLI class"""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
    
    @abstractmethod
    def run(self, args: List[str]) -> OperationResult[Any]:
        pass
    
    def display_menu(self, options: List[str], title: str = "") -> int:
        """Display interactive menu and return selected index"""
        if title:
            print(f"\n=== {title} ===")
        
        for i, option in enumerate(options, 1):
            print(f"{i}. {option}")
        
        while True:
            try:
                choice = int(input(f"Select an option (1-{len(options)}): "))
                if 1 <= choice <= len(options):
                    return choice - 1
                else:
                    print(f"Please enter a number between 1 and {len(options)}")
            except ValueError:
                print("Please enter a valid number")


class ConfigurableComponent:
    """Mixin for components that need configuration"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
    
    def get_config(self, key: str, default: Any = None) -> Any:
        """Get configuration value with default"""
        return self.config.get(key, default)
    
    def update_config(self, updates: Dict[str, Any]):
        """Update configuration"""
        self.config.update(updates)


class Singleton(type):
    """Singleton metaclass"""
    _instances = {}
    
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]
