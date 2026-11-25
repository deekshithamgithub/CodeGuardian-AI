
import json
import subprocess
import sys
import tempfile
from pathlib import Path


def analyze_python_code(code: str):
    """
    Analyze Python source code using Pylint and Bandit.
    Returns structured code-quality and security findings.
    """

    results = {
        "language": "python",
        "quality_issues": [],
        "security_issues": [],
        "error": None
    }

    temp_path = None

    try:
        # Create a temporary Python file for analysis.
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".py",
            encoding="utf-8",
            delete=False
        ) as temp_file:
            temp_file.write(code)
            temp_path = temp_file.name

        # Run Pylint.
        pylint_result = subprocess.run(
    [
        sys.executable,
        "-m",
        "pylint",
        "--output-format=json",
        "--score=n",
        "--reports=n",
        temp_path
    ],
    capture_output=True,
    text=True,
    encoding="utf-8",
    errors="replace",
    timeout=30
)

        if pylint_result.stdout.strip():
            pylint_data = json.loads(pylint_result.stdout)

            for issue in pylint_data:
                results["quality_issues"].append({
                    "tool": "Pylint",
                    "type": issue.get("type"),
                    "message": issue.get("message"),
                    "symbol": issue.get("symbol"),
                    "line": issue.get("line"),
                    "column": issue.get("column")
                })

        # Run Bandit.
        bandit_result = subprocess.run(
    [
        sys.executable,
        "-m",
        "bandit",
        "-f",
        "json",
        temp_path
    ],
    capture_output=True,
    text=True,
    encoding="utf-8",
    errors="replace",
    timeout=30
)

        if bandit_result.stdout.strip():
            bandit_data = json.loads(bandit_result.stdout)

            for issue in bandit_data.get("results", []):
                results["security_issues"].append({
                    "tool": "Bandit",
                    "severity": issue.get("issue_severity"),
                    "confidence": issue.get("issue_confidence"),
                    "message": issue.get("issue_text"),
                    "test_id": issue.get("test_id"),
                    "line": issue.get("line_number")
                })

    except subprocess.TimeoutExpired:
        results["error"] = "Code analysis timed out."

    except json.JSONDecodeError:
        results["error"] = "Could not parse analyzer output."

    except Exception as error:
        results["error"] = str(error)

    finally:
        # Remove the temporary source file.
        if temp_path and Path(temp_path).exists():
            Path(temp_path).unlink()

    return results
