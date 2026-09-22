Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " Starting Job Intelligence Platform (Full Stack)" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

docker compose up --build -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Docker compose failed to start." -ForegroundColor Red
    Write-Host "Please ensure Docker Desktop is running and try again." -ForegroundColor Yellow
    exit $LASTEXITCODE
}

Write-Host "Seeding database with initial accounts and demo data..." -ForegroundColor Cyan
docker compose exec -T web node prisma/seed.mjs

Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host " All Services Running Successfully!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host " - Web Application:       http://localhost:3000" -ForegroundColor White
Write-Host " - Python Backend API:    http://localhost:8000/docs" -ForegroundColor White
Write-Host " - PostgreSQL (pgvector): localhost:5433" -ForegroundColor White
Write-Host ""
Write-Host " Default Credentials:" -ForegroundColor Yellow
Write-Host " - Admin User: admin@jobintel.com / AdminPassword123" -ForegroundColor White
Write-Host " - Demo User:  demo@jobintel.com  / DemoPassword123" -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Green
Write-Host "To follow logs: docker compose logs -f" -ForegroundColor Gray
Write-Host "To cleanup:     ./docker-clean.ps1" -ForegroundColor Gray
