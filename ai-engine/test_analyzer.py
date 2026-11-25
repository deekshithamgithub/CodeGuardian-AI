
from analyzers.python_analyzer import analyze_python_code

sample_code = """
import os

password = "admin123"

def calculate():
    x = 10
    y = 20
    return x
"""

result = analyze_python_code(sample_code)

print("PYTHON ANALYSIS RESULTS")
print("=======================")

print("Quality Issues:")
for issue in result["quality_issues"]:
    print(issue)

print("\nSecurity Issues:")
for issue in result["security_issues"]:
    print(issue)

print("\nError:", result["error"])
