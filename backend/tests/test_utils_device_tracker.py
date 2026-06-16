"""Tests for app.utils.device_tracker — DeviceTracker."""

from unittest.mock import MagicMock

from app.utils.device_tracker import DeviceTracker


def _make_request(
    user_agent: str = "Mozilla/5.0",
    x_forwarded_for: str | None = None,
    client_host: str = "127.0.0.1",
):
    """Build a minimal mock FastAPI Request."""
    headers = {"User-Agent": user_agent}
    if x_forwarded_for is not None:
        headers["X-Forwarded-For"] = x_forwarded_for

    request = MagicMock()
    request.headers = headers
    request.client = MagicMock()
    request.client.host = client_host
    return request


class TestGetClientIp:
    def test_uses_x_forwarded_for_first_ip(self):
        req = _make_request(x_forwarded_for="1.2.3.4, 5.6.7.8", client_host="10.0.0.1")
        assert DeviceTracker.get_client_ip(req) == "1.2.3.4"

    def test_falls_back_to_client_host(self):
        req = _make_request(client_host="192.168.1.1")
        assert DeviceTracker.get_client_ip(req) == "192.168.1.1"

    def test_single_forwarded_ip(self):
        req = _make_request(x_forwarded_for="9.8.7.6")
        assert DeviceTracker.get_client_ip(req) == "9.8.7.6"


class TestGetDeviceInfo:
    CHROME_UA = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )

    def test_returns_expected_keys(self):
        req = _make_request(user_agent=self.CHROME_UA)
        info = DeviceTracker.get_device_info(req)
        expected_keys = {"ip", "is_mobile", "is_tablet", "is_pc", "browser", "browser_version", "os", "os_version", "device"}
        assert set(info.keys()) == expected_keys

    def test_detects_pc(self):
        req = _make_request(user_agent=self.CHROME_UA)
        info = DeviceTracker.get_device_info(req)
        assert info["is_pc"] == "True"
        assert info["is_mobile"] == "False"

    def test_detects_chrome_browser(self):
        req = _make_request(user_agent=self.CHROME_UA)
        info = DeviceTracker.get_device_info(req)
        assert "Chrome" in info["browser"]

    def test_mobile_user_agent(self):
        mobile_ua = (
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) "
            "Version/17.0 Mobile/15E148 Safari/604.1"
        )
        req = _make_request(user_agent=mobile_ua)
        info = DeviceTracker.get_device_info(req)
        assert info["is_mobile"] == "True"
        assert info["is_pc"] == "False"

    def test_unknown_user_agent(self):
        req = _make_request(user_agent="Unknown")
        info = DeviceTracker.get_device_info(req)
        assert "ip" in info
