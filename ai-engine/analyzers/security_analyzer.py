
import json
import subprocess
import tempfile
from pathlib import Path


def analyze_security_code(code: str, language: str):
    """
    Analyze Python or JavaScript code using custom Semgrep rules.
    """

    results = {
        "security_issues": [],
        "error": None
    }

    temp_path = None

    project_directory = Path(__file__).resolve().parent.parent
    config_path = project_directory / "semgrep_rules.yml"

    if language not in ("python", "javascript"):
        results["error"] = "Unsupported language."
        return results

    if not config_path.exists():
        results["error"] = "Semgrep rules configuration not found."
        return results

    suffix = ".py" if language == "python" else ".js"

    try:
        # Create a temporary file inside ai-engine.
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=suffix,
            prefix="security_scan_",
            encoding="utf-8",
            delete=False,
            dir=project_directory
        ) as temp_file:
            temp_file.write(code)
            temp_path = temp_file.name

        # Run Semgrep with our custom rules.
        scan_result = subprocess.run(
            [
                "semgrep",
                "scan",
                "--config",
                str(config_path),
                "--json",
                str(temp_path)
            ],
            capture_output=True,
            text=True,
            encoding="utf-8",
errors="replace",
            timeout=60,
            cwd=str(project_directory)
        )

        if scan_result.stdout.strip():
            data = json.loads(scan_result.stdout)

            for issue in data.get("results", []):
                extra = issue.get("extra", {})
                start = issue.get("start", {})

                results["security_issues"].append({
                    "tool": "Semgrep",
                    "rule": issue.get("check_id"),
                    "severity": extra.get("severity"),
                    "message": extra.get("message"),
                    "line": start.get("line"),
                    "column": start.get("col")
                })

        # Exit codes 0 and 1 can represent completed scans.
        if scan_result.returncode not in (0, 1):
            results["error"] = (
                scan_result.stderr.strip()
                or "Semgrep could not complete the scan."
            )

    except subprocess.TimeoutExpired:
        results["error"] = "Security analysis timed out."

    except json.JSONDecodeError:
        results["error"] = "Could not parse Semgrep output."

    except FileNotFoundError:
        results["error"] = (
            "Semgrep executable not found. "
            "Check that your AI engine virtual environment is activated."
        )

    except Exception as error:
        results["error"] = str(error)

    finally:
        if temp_path and Path(temp_path).exists():
            Path(temp_path).unlink()

    return results
