
from fastapi import FastAPI, HTTPException

from schemas.scan_schema import ScanRequest, ExplainRequest
from services.ai_explainer import explain_code_issue, generate_code_fix
from analyzers.python_analyzer import analyze_python_code
from analyzers.javascript_analyzer import analyze_javascript_code
from analyzers.security_analyzer import analyze_security_code
from services.severity_classifier import classify_issues

app = FastAPI(
    title="CodeGuardian AI Engine",
    description="AI-powered code quality and security analysis",
    version="1.0.0"
)


@app.get("/")
def home():
    return {
        "success": True,
        "message": "CodeGuardian AI Engine is running!"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "AI Analysis Engine"
    }


def deduplicate_security_issues(issues):
    """Group duplicate security findings reported by different tools."""

    unique_issues = {}

    for issue in issues:
        message = issue.get("message", "")
        line = issue.get("line", 0)
        tool = issue.get("tool", "Unknown")

        # Identify common hardcoded-secret findings.
        normalized_message = message.lower()

        if (
            "hardcoded password" in normalized_message
            or "hardcoded" in normalized_message
            and "secret" in normalized_message
        ):
            category = "hardcoded-secret"
        else:
            category = normalized_message.strip()

        # Same category on the same line is treated as a duplicate.
        key = (category, line)

        if key not in unique_issues:
            issue_copy = issue.copy()
            issue_copy["detected_by"] = [tool]
            unique_issues[key] = issue_copy

        else:
            existing = unique_issues[key]

            if tool not in existing["detected_by"]:
                existing["detected_by"].append(tool)

    return list(unique_issues.values())



@app.post("/analyze")
def analyze_code(request: ScanRequest):

    # 1. Run language-specific quality analysis.
    if request.language == "python":
        result = analyze_python_code(request.code)

    elif request.language == "javascript":
        result = analyze_javascript_code(request.code)

    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported programming language"
        )

    if result.get("error"):
        raise HTTPException(
            status_code=500,
            detail=result["error"]
        )

    # 2. Run Semgrep security analysis.
    security_result = analyze_security_code(
        request.code,
        request.language
    )

    if security_result.get("error"):
        raise HTTPException(
            status_code=500,
            detail=security_result["error"]
        )

    # 3. Combine security findings.
    result.setdefault("security_issues", [])

    result["security_issues"].extend(
        security_result["security_issues"]
    )

    # 4. Remove duplicate security findings.
    result["security_issues"] = deduplicate_security_issues(
        result["security_issues"]
    )

    # 5. Assign severity to security findings.
    result["security_issues"] = classify_issues(
        result["security_issues"]
    )

    # 6. Assign severity to code quality findings.
    result["quality_issues"] = classify_issues(
        result.get("quality_issues", [])
    )

    # 7. AI explanations temporarily disabled.

    # 8. Return analysis report.
    return {
        "success": True,
        "results": result
    }



@app.post("/explain")
def explain_issue(request: ExplainRequest):
    try:
        explanation = explain_code_issue(
            request.code,
            request.issue
        )

        if not explanation or explanation.get("error"):
            raise HTTPException(
                status_code=502,
                detail=(
                    explanation.get("error")
                    if explanation
                    else "AI explanation could not be generated"
                )
            )

        return {
            "success": True,
            "explanation": explanation
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to generate AI explanation"
        )

@app.post("/generate-fix")
def generate_fix(request: ExplainRequest):
    try:
        corrected_code = generate_code_fix(
            request.code,
            request.issue
        )

        if not corrected_code:
            raise HTTPException(
                status_code=502,
                detail="AI code fix could not be generated"
            )

        return {
            "success": True,
            "corrected_code": corrected_code
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Code fix generation error:", error)

        raise HTTPException(
            status_code=500,
            detail="Failed to generate code fix"
        )