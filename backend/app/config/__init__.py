import importlib

from app.config.config import settings
from app.config.session import get_db, local_session

security_logger = None

def get_security_logger():
    global security_logger
    
    if security_logger is None:
        logger_module = importlib.import_module(".logger", __package__)
        security_logger_instance = logger_module.security_logger
        globals()['security_logger'] = security_logger_instance
        security_logger = security_logger_instance
        
    return security_logger