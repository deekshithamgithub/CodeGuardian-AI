
from analyzers.javascript_analyzer import analyze_javascript_code

sample_code = """
const password = "admin123";

function calculate() {
    let total = 100;
    let unusedValue = 50;

    if (total == "100") {
        console.log(total);
    }

    return missingVariable;
}
"""

result = analyze_javascript_code(sample_code)

print("JAVASCRIPT ANALYSIS RESULTS")
print("===========================")

print("Quality Issues:")

for issue in result["quality_issues"]:
    print(issue)

print("\nError:", result["error"])
