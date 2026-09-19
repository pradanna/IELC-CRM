# PowerShell Script to run all services concurrently in separate background jobs or windows
Param(
    [switch]$NewWindow = $true
)

$services = @(
    @{ Name = "Vite Dev"; Path = "c:\PROJECT\WEBSITE\IELC-CRM"; Cmd = "npm run dev" },
    @{ Name = "Laravel Serve"; Path = "c:\PROJECT\WEBSITE\IELC-CRM"; Cmd = "php artisan serve" },
    @{ Name = "Laravel Queue Worker"; Path = "c:\PROJECT\WEBSITE\IELC-CRM"; Cmd = "php artisan queue:work" },
    @{ Name = "Laravel Reverb"; Path = "c:\PROJECT\WEBSITE\IELC-CRM"; Cmd = "php artisan reverb:start" },
    @{ Name = "WA-Baileys Service"; Path = "c:\PROJECT\WEBSITE\wa-baileys"; Cmd = "npm start" }
)

Write-Host "Starting all 5 services..." -ForegroundColor Green

foreach ($s in $services) {
    if ($NewWindow) {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$($s.Path)'; Write-Host '=== $($s.Name) ===' -ForegroundColor Cyan; $($s.Cmd)"
    } else {
        Start-Job -Name $s.Name -ScriptBlock {
            param($path, $cmd)
            Set-Location $path
            Invoke-Expression $cmd
        } -ArgumentList $s.Path, $s.Cmd
    }
}

Write-Host "All 5 services launched!" -ForegroundColor Green
