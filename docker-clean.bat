@echo off
echo =======================================================
echo  Stopping and Cleaning Up Job Intelligence Platform
echo =======================================================

echo Stopping containers and removing volumes and images...
docker compose down -v --rmi local --remove-orphans

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Docker compose down had issues. Trying standard down...
    docker compose down -v
)

echo.
echo =======================================================
echo  Cleanup Complete!
echo  All containers, networks, volumes, and images removed.
echo =======================================================
pause
