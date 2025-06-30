"""
Custom exceptions module
"""

class ConfigError(Exception):
    """Raised for configuration related errors"""
    pass


class APIClientError(Exception):
    """Raised for errors in API clients"""
    pass


class DataProcessingError(Exception):
    """Raised for errors during data processing"""
    def __init__(self, message, errors=None):
        super().__init__(message)
        self.errors = errors


class ValidationError(Exception):
    """Raised for validation errors"""
    def __init__(self, message, errors=None):
        super().__init__(message)
        self.errors = errors

