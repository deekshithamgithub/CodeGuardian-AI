
from services.ai_explainer import explain_code_issue

sample_code = """
password = "admin123"

def login():
    print("Login successful")
"""

sample_issue = {
    "tool": "Semgrep",
    "rule": "hardcoded-password",
    "severity": "ERROR",
    "message": "Possible hardcoded password or secret detected.",
    "line": 2
}

result = explain_code_issue(
    sample_code,
    sample_issue
)

print("CODEGUARDIAN AI EXPLANATION")
print("===========================")
print(result)
