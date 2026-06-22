@echo off
echo ================================================
echo   LAN EXAM SYSTEM - Build and Run (Windows)
echo ================================================

REM ── Step 1: Check for mysql-connector JAR ──────
set JAR=mysql-connector-j-9.7.0.jar
if not exist %JAR% (
    echo.
    echo [ERROR] MySQL Connector JAR not found: %JAR%
    echo.
    echo  Download it from:
    echo  https://dev.mysql.com/downloads/connector/j/
    echo  Choose "Platform Independent" ZIP, extract the .jar here.
    echo.
    echo  OR if you have a different version, edit this script and
    echo  change the JAR variable to match your filename.
    echo.
    pause
    exit /b 1
)

REM ── Step 2: Compile ────────────────────────────
echo [1/2] Compiling Java sources...
javac -cp ".;%JAR%" src\*.java -d out 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Compilation failed. See errors above.
    pause
    exit /b 1
)
echo   Compilation successful.

REM ── Step 3: Copy connector to out folder ───────
copy %JAR% out\ >nul

REM ── Step 4: Run ────────────────────────────────
echo [2/2] Starting server...
echo.
cd out
java -cp ".;%JAR%" MainServer
cd ..
pause
