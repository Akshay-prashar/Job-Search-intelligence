Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host " Stopping and Cleaning Up Job Intelligence Platform" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

Write-Host "Removing containers, networks, volumes, and local images..." -ForegroundColor Yellow
docker compose down -v --rmi local --remove-orphans

if ($LASTEXITCODE -ne 0) {
    Write-Host "Retrying with standard down..." -ForegroundColor Gray
    docker compose down -v
}

Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host " Cleanup Complete!" -ForegroundColor Green
Write-Host " All containers, networks, volumes, and built images removed." -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
