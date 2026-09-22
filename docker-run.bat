@echo off
echo =======================================================
echo  Starting Job Intelligence Platform (Full Stack)
echo =======================================================

docker compose up --build -d

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Docker compose failed to start.
    echo Please make sure Docker Desktop is running and try again.
    pause
    exit /b %ERRORLEVEL%
)

echo Seeding database with initial accounts and demo data...
docker compose exec -T web node prisma/seed.mjs

echo.
echo =======================================================
echo  All Services Running Successfully!
echo =======================================================
echo  - Web Application:       http://localhost:3000
echo  - Python Backend API:    http://localhost:8000/docs
echo  - PostgreSQL (pgvector): localhost:5433
echo.
echo  Default Accounts:
echo  - Admin: admin@jobintel.com / AdminPassword123
echo  - Demo:  demo@jobintel.com  / DemoPassword123
echo =======================================================
echo To view logs: docker compose logs -f
echo To stop and cleanup: run docker-clean.bat
pause
