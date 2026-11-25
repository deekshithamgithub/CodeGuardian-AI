import sqlite3

def vulnerable_query(user_id):
    cursor = sqlite3.connect("test.db").cursor()
    cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")

def safe_query(user_id):
    cursor = sqlite3.connect("test.db").cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))