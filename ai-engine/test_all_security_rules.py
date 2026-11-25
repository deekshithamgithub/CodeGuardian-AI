
import subprocess

# 1. Hardcoded secret
password = "admin12345"

# 2. Python shell injection
def vulnerable_command(user_input):
    subprocess.run(user_input, shell=True)

# 3. Python SQL injection
def vulnerable_sql(cursor, user_id):
    cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")

# 4. Python path traversal
def vulnerable_file(request):
    filename = request.args.get("file")
    return open(filename).read()

# 5. GitHub token format
github_value = "ghp_abcdefghijklmnopqrstuvwxyz123456"

# 6. Google API key format
google_value = "AIzaSyAbcdefghijklmnopqrstuvwxyz123456"
