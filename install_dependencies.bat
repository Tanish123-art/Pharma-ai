@echo off
echo Installing Backend Dependencies...
cd Backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies.
    pause
    exit /b %errorlevel%
)
cd ..

echo Installing Frontend Dependencies...
cd Frontend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies.
    pause
    exit /b %errorlevel%
)
cd ..

echo All dependencies installed successfully.
pause
