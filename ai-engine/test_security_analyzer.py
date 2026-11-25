
from analyzers.security_analyzer import analyze_security_code

sample_code = """
import subprocess

password = "admin123"

def run_command(command):
    subprocess.call(command, shell=True)
"""

result = analyze_security_code(sample_code, "python")

print("CODEGUARDIAN SECURITY ANALYSIS")
print("==============================")

for issue in result["security_issues"]:
    print(issue)

print("\nError:", result["error"])

