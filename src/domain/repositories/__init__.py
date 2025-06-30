"""
Repository interfaces cho Variables Sync Pipeline
"""

from .figma_repository import FigmaRepository
from .sheet_repository import SheetRepository
from .file_repository import FileRepository
from .variable_repository import VariableRepository

__all__ = [
    "FigmaRepository",
    "SheetRepository", 
    "FileRepository",
    "VariableRepository"
]
