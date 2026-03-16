import sys
import subprocess

def install_requirements():
    try:
        with open('requirements.txt', 'r') as f:
            requirements = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    except FileNotFoundError:
        print("requirements.txt not found.")
        return

    print(f"Found {len(requirements)} requirements.")
    for req in requirements:
        print(f"Installing {req}...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", req])
            print(f"SUCCESS: {req}")
        except subprocess.CalledProcessError:
            print(f"FAILED: {req}")
            sys.exit(1)

if __name__ == "__main__":
    install_requirements()
