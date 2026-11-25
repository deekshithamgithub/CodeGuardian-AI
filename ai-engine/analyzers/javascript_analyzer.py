
import json
import subprocess
import tempfile
from pathlib import Path


def analyze_javascript_code(code: str):
    results = {
        "language": "javascript",
        "quality_issues": [],
        "error": None
    }

    temp_path = None

    project_directory = Path(__file__).resolve().parent.parent

    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".js",
            prefix="codeguardian_",
            encoding="utf-8",
            delete=False,
            dir=project_directory
        ) as temp_file:
            temp_file.write(code)
            temp_path = temp_file.name

        eslint_path = (
            project_directory
            / "node_modules"
            / "eslint"
            / "bin"
            / "eslint.js"
        )

        config_path = project_directory / "eslint.config.mjs"

        result = subprocess.run(
            [
                "node",
                str(eslint_path),
                "--config",
                str(config_path),
                "--format",
                "json",
                temp_path
            ],
            capture_output=True,
            text=True,
            encoding="utf-8",
errors="replace",
            timeout=30,
            cwd=str(project_directory)
        )

        if result.stdout.strip():
            data = json.loads(result.stdout)

            for file_result in data:
                for issue in file_result.get("messages", []):
                    results["quality_issues"].append({
                        "tool": "ESLint",
                        "severity": (
                            "error" if issue.get("severity") == 2
                            else "warning"
                        ),
                        "message": issue.get("message"),
                        "rule": issue.get("ruleId"),
                        "line": issue.get("line"),
                        "column": issue.get("column")
                    })

        if result.returncode not in (0, 1):
            results["error"] = (
                result.stderr.strip()
                or "ESLint could not complete analysis."
            )

    except subprocess.TimeoutExpired:
        results["error"] = "JavaScript analysis timed out."

    except json.JSONDecodeError:
        results["error"] = "Could not parse ESLint output."

    except Exception as error:
        results["error"] = str(error)

    finally:
        if temp_path and Path(temp_path).exists():
            Path(temp_path).unlink()

    return results
