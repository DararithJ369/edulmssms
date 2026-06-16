"""Tests for app.utils.colors — ANSI color helper class."""

from io import StringIO
from unittest.mock import patch

from app.utils.colors import Colors


class TestColorsConstants:
    def test_ansi_codes_are_strings(self):
        for attr in ("HEADER", "OKBLUE", "OKCYAN", "OKGREEN", "WARNING", "FAIL", "ENDC", "BOLD", "UNDERLINE"):
            assert isinstance(getattr(Colors, attr), str)

    def test_endc_resets_ansi(self):
        assert Colors.ENDC == "\033[0m"


class TestColorsPrint:
    def test_print_uses_default_green(self):
        with patch("builtins.print") as mock_print:
            Colors.print("hello")
            mock_print.assert_called_once()
            output = mock_print.call_args[0][0]
            assert "hello" in output
            assert Colors.ENDC in output

    def test_print_uses_custom_color(self):
        with patch("builtins.print") as mock_print:
            Colors.print("warn", color=Colors.WARNING)
            output = mock_print.call_args[0][0]
            assert Colors.WARNING in output


class TestColorsShortcuts:
    def test_success(self):
        with patch("builtins.print") as mock_print:
            Colors.success("ok")
            output = mock_print.call_args[0][0]
            assert Colors.OKGREEN in output

    def test_error(self):
        with patch("builtins.print") as mock_print:
            Colors.error("fail")
            output = mock_print.call_args[0][0]
            assert Colors.FAIL in output

    def test_info(self):
        with patch("builtins.print") as mock_print:
            Colors.info("note")
            output = mock_print.call_args[0][0]
            assert Colors.OKCYAN in output

    def test_warning(self):
        with patch("builtins.print") as mock_print:
            Colors.warning("careful")
            output = mock_print.call_args[0][0]
            assert Colors.WARNING in output
