from pathlib import Path

def safe_file_access():
    base_dir = Path("uploads").resolve()
    file_path = (base_dir / "example.txt").resolve()

    if file_path.is_relative_to(base_dir):
        return file_path.read_text()

    raise ValueError("Invalid file path")