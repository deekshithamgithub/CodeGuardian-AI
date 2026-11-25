
def classify_severity(issue):
    """
    Assign a severity level to a code analysis finding.
    """

    message = str(issue.get("message", "")).lower()
    rule_id = str(issue.get("rule_id", "")).lower()
    issue_type = str(issue.get("type", "")).lower()
    tool = str(issue.get("tool", "")).lower()

    text = f"{message} {rule_id} {issue_type}"

    # Critical security vulnerabilities
    critical_keywords = [
        "remote code execution",
        "arbitrary code execution",
        "command injection",
        "sql injection",
        "unsafe deserialization"
    ]

    # High-risk vulnerabilities
    high_keywords = [
        "hardcoded password",
        "hardcoded secret",
        "hardcoded credential",
        "shell injection",
        "eval",
        "authentication bypass",
        "private key"
    ]

    # Medium-risk vulnerabilities
    medium_keywords = [
        "weak cryptography",
        "insecure random",
        "path traversal",
        "unsafe input",
        "sensitive information"
    ]

    if any(keyword in text for keyword in critical_keywords):
        severity = "CRITICAL"

    elif any(keyword in text for keyword in high_keywords):
        severity = "HIGH"

    elif any(keyword in text for keyword in medium_keywords):
        severity = "MEDIUM"

    elif tool == "semgrep":
        severity = "MEDIUM"

    else:
        severity = "LOW"

    issue["severity"] = severity

    return issue


def classify_issues(issues):
    """
    Assign severity to all findings and sort them.
    """

    severity_order = {
        "CRITICAL": 0,
        "HIGH": 1,
        "MEDIUM": 2,
        "LOW": 3
    }

    classified = [
        classify_severity(issue.copy())
        for issue in issues
    ]

    classified.sort(
        key=lambda issue: severity_order.get(
            issue.get("severity", "LOW"),
            3
        )
    )

    return classified
