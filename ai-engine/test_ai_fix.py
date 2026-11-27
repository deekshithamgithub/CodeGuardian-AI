
from services.ai_explainer import generate_code_fix

sample_code = '''
import os

password = "admin123"

def login():
    if password == "admin123":
        print("Login successful")
    else:
        print("Login failed")
'''

sample_issue = {
    "tool": "Semgrep",
    "rule": "hardcoded-password",
    "severity": "ERROR",
    "message": "Possible hardcoded password detected.",
    "line": 4
}

print("CODEGUARDIAN AI FIX TEST")
print("========================")

result = generate_code_fix(sample_code, sample_issue)

if result:
    print("AI FIX GENERATED")
    print("================")
    print(result)

    if "admin123" not in result:
        print("\nPASS: Original password was removed.")
    else:
        print("\nFAIL: Original password is still present.")
else:
    print("AI FIX GENERATION FAILED")
