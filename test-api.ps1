$baseUrl = "http://127.0.0.1:3001"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "gabri+$timestamp@example.com"
$password = "123456"
$newPassword = "654321"
$name = "Gabri"
$updatedName = "Gabri Atualizado"

Write-Host ""
Write-Host "Testando API de autenticacao completa..." -ForegroundColor Cyan
Write-Host ""

function Show-Step($message) {
  Write-Host "[OK] $message" -ForegroundColor Green
}

try {
  $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
  Show-Step "Health: $($health.status)"
} catch {
  Write-Host "[ERRO] A API nao respondeu em $baseUrl" -ForegroundColor Red
  Write-Host "Inicie primeiro com: npm run dev" -ForegroundColor Yellow
  exit 1
}

try {
  $registerBody = @{
    name = $name
    email = $email
    password = $password
  } | ConvertTo-Json

  $register = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -ContentType "application/json" -Body $registerBody
  Show-Step "Register: $($register.message)"

  $accessToken = $register.accessToken
  $refreshToken = $register.refreshToken

  if (-not $accessToken -or -not $refreshToken) {
    throw "Cadastro nao retornou accessToken e refreshToken"
  }
} catch {
  Write-Host "[ERRO] Falha no cadastro" -ForegroundColor Red
  Write-Host $_
  exit 1
}

$headers = @{ Authorization = "Bearer $accessToken" }

try {
  $me = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers
  Show-Step "Perfil autenticado: $($me.user.email)"
} catch {
  Write-Host "[ERRO] Falha ao consultar /auth/me" -ForegroundColor Red
  Write-Host $_
  exit 1
}

try {
  $sessions = Invoke-RestMethod -Uri "$baseUrl/auth/sessions" -Method Get -Headers $headers
  $sessionId = $sessions.sessions[0].id
  Show-Step "Sessao ativa encontrada"
} catch {
  Write-Host "[ERRO] Falha ao consultar /auth/sessions" -ForegroundColor Red
  Write-Host $_
  exit 1
}

try {
  $updateBody = @{
    name = $updatedName
  } | ConvertTo-Json

  $updateProfile = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Patch -Headers $headers -ContentType "application/json" -Body $updateBody
  $accessToken = $updateProfile.accessToken
  $headers = @{ Authorization = "Bearer $accessToken" }
  Show-Step "Perfil atualizado: $($updateProfile.user.name)"
} catch {
  Write-Host "[ERRO] Falha ao atualizar perfil" -ForegroundColor Red
  Write-Host $_
  exit 1
}

try {
  $refreshBody = @{
    refreshToken = $refreshToken
  } | ConvertTo-Json

  $refresh = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method Post -ContentType "application/json" -Body $refreshBody
  $accessToken = $refresh.accessToken
  $refreshToken = $refresh.refreshToken
  $headers = @{ Authorization = "Bearer $accessToken" }
  Show-Step "Refresh token renovado"
} catch {
  Write-Host "[ERRO] Falha ao renovar token" -ForegroundColor Red
  Write-Host $_
  exit 1
}

try {
  $changePasswordBody = @{
    currentPassword = $password
    newPassword = $newPassword
  } | ConvertTo-Json

  $changePassword = Invoke-RestMethod -Uri "$baseUrl/auth/change-password" -Method Post -Headers $headers -ContentType "application/json" -Body $changePasswordBody
  Show-Step $changePassword.message
} catch {
  Write-Host "[ERRO] Falha ao alterar senha" -ForegroundColor Red
  Write-Host $_
  exit 1
}

try {
  $loginBody = @{
    email = $email
    password = $newPassword
  } | ConvertTo-Json

  $login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
  $accessToken = $login.accessToken
  $refreshToken = $login.refreshToken
  $headers = @{ Authorization = "Bearer $accessToken" }
  Show-Step "Login com nova senha: $($login.message)"
} catch {
  Write-Host "[ERRO] Falha no login com a nova senha" -ForegroundColor Red
  Write-Host $_
  exit 1
}

try {
  $logoutBody = @{
    refreshToken = $refreshToken
  } | ConvertTo-Json

  $logout = Invoke-RestMethod -Uri "$baseUrl/auth/logout" -Method Post -ContentType "application/json" -Body $logoutBody
  Show-Step $logout.message
} catch {
  Write-Host "[ERRO] Falha no logout" -ForegroundColor Red
  Write-Host $_
  exit 1
}

Write-Host ""
Write-Host "Tudo funcionando." -ForegroundColor Cyan
Write-Host "Usuario de teste criado: $email" -ForegroundColor Cyan
