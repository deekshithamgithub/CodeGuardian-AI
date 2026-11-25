from flask import request
from pathlib import Path

def vulnerable():
    filename = request.args.get("file")
    return open(filename).read()

def safe():
    return Path("uploads/example.txt").read_text()