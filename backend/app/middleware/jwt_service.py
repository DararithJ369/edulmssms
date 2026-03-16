from datetime import datetime, timedelta
from jose import JWTError, jwt


class JWTService:
    
    @staticmethod
    def create_access_token(data: dict, secret_key: str, algorithm: str, expires_delta: timedelta) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + expires_delta
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, secret_key, algorithm=algorithm)
        return encoded_jwt
    
    @staticmethod
    def decode_token(token: str, secret_key: str, algorithms: list) -> dict:
        try:
            payload = jwt.decode(token, secret_key, algorithms=algorithms)
            return payload
        except JWTError as e:
            raise JWTError(f"Token decode error: {str(e)}")
        
    @staticmethod
    def verify_token(token: str, secret_key: str, algorithms: list):
        return JWTService.decode_token(token, secret_key, algorithms)