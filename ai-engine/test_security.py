
import subprocess

password = "admin123"

def run_command(user_input):
    command = "echo " + user_input
    subprocess.call(command, shell=True)

def get_user_data(query):
    sql = "SELECT * FROM users WHERE name = '" + query + "'"
    return sql
