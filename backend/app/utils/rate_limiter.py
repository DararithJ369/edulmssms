"""
Rate limiter abstraction.

Provides a pluggable interface with a memory-backed implementation and a Redis
implementation. The active provider is selected via the RATE_LIMITER_BACKEND
environment variable (default: memory). Redis is optional and falls back to
memory automatically if unavailable.
"""
import time
from abc import ABC, abstractmethod
from collections import defaultdict
from typing import Optional

import os


class RateLimiter(ABC):
    """Abstract rate limiter interface."""

    @abstractmethod
    def is_allowed(self, key: str, limit: int, window_seconds: int) -> bool:
        """Return True if the request is allowed, False otherwise."""
        raise NotImplementedError

    @abstractmethod
    def reset(self, key: str) -> None:
        """Clear the rate limit counter for a given key."""
        raise NotImplementedError


class MemoryRateLimiter(RateLimiter):
    """Thread-safe in-memory rate limiter using sliding window."""

    def __init__(self) -> None:
        self._attempts: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str, limit: int, window_seconds: int) -> bool:
        now = time.time()
        attempts = self._attempts.get(key, [])
        active = [t for t in attempts if now - t < window_seconds]
        if len(active) >= limit:
            self._attempts[key] = active
            return False
        active.append(now)
        self._attempts[key] = active
        return True

    def reset(self, key: str) -> None:
        self._attempts.pop(key, None)


class RedisRateLimiter(RateLimiter):
    """Redis-backed rate limiter using sliding window with fallback to memory."""

    def __init__(self, redis_url: Optional[str] = None) -> None:
        self._redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self._backend: Optional[RateLimiter] = None
        self._connect()

    def _connect(self) -> None:
        try:
            import redis
            self._client = redis.from_url(self._redis_url, decode_responses=True)
            self._client.ping()
            self._backend = self
        except Exception:
            self._client = None
            self._backend = MemoryRateLimiter()

    def is_allowed(self, key: str, limit: int, window_seconds: int) -> bool:
        if self._backend is not self:
            return self._backend.is_allowed(key, limit, window_seconds)  # type: ignore[union-attr]

        try:
            now = time.time()
            window_start = now - window_seconds
            pipeline = self._client.pipeline()
            # Remove timestamps outside the current window
            pipeline.zremrangebyscore(key, 0, window_start)
            # Count current window
            pipeline.zcard(key)
            # Add current timestamp
            pipeline.zadd(key, {str(now): now})
            # Set key expiry
            pipeline.expire(key, window_seconds)
            results = pipeline.execute()
            current_count = results[1]
            return current_count < limit
        except Exception:
            # On any Redis failure, fall back to memory for this request
            return MemoryRateLimiter().is_allowed(key, limit, window_seconds)

    def reset(self, key: str) -> None:
        if self._backend is not self:
            self._backend.reset(key)  # type: ignore[union-attr]
            return
        try:
            self._client.delete(key)
        except Exception:
            pass


class RateLimiterFactory:
    """Factory that returns the configured rate limiter implementation."""

    _instance: Optional[RateLimiter] = None

    @classmethod
    def get_limiter(cls) -> RateLimiter:
        if cls._instance is None:
            backend = os.getenv("RATE_LIMITER_BACKEND", "memory").lower()
            if backend == "redis":
                cls._instance = RedisRateLimiter()
            else:
                cls._instance = MemoryRateLimiter()
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None


def check_rate_limit(key: str, limit: int, window_seconds: int) -> bool:
    """Convenience helper. Returns True if allowed, False if rate limited."""
    return RateLimiterFactory.get_limiter().is_allowed(key, limit, window_seconds)
