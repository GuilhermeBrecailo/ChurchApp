$ErrorActionPreference = 'Stop'

$composePath = Join-Path $PSScriptRoot 'compose.yml'
$manifestPath = Join-Path $PSScriptRoot 'manifest.json'
$smokePath = Join-Path $PSScriptRoot 'smoke.sh'
$apiDockerfilePath = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'api/Dockerfile'
$webDockerfilePath = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'web/Dockerfile'
$compose = Get-Content -Raw $composePath
$manifest = Get-Content -Raw $manifestPath | ConvertFrom-Json
$smoke = Get-Content -Raw $smokePath
$apiDockerfile = Get-Content -Raw $apiDockerfilePath
$webDockerfile = Get-Content -Raw $webDockerfilePath
$apiServer = Get-Content -Raw (Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) 'api/server.ts')
$errors = [System.Collections.Generic.List[string]]::new()
$allowedPlaceholders = @('DEPLOY_SLOT', 'IMAGE_TAG', 'API_DIGEST', 'WEB_DIGEST', 'API_PORT', 'WEB_PORT', 'PROJECT_NAME')
$actualPlaceholders = @([regex]::Matches($compose, '\$\{([A-Z][A-Z0-9_]*)\}') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique)

if ($manifest.service -ne 'churchapp') { $errors.Add('manifest service must be churchapp') }
if ($manifest.repository -ne 'GuilhermeBrecailo/ChurchApp') { $errors.Add('repository mismatch') }
if ((Compare-Object $allowedPlaceholders $actualPlaceholders).Count -gt 0) {
    $errors.Add('compose placeholders must match the exact allowlist')
}
foreach ($required in @('DEPLOY_SLOT', 'IMAGE_TAG', 'API_DIGEST', 'WEB_DIGEST', 'API_PORT', 'WEB_PORT', 'PROJECT_NAME')) {
    if ($actualPlaceholders -notcontains $required) { $errors.Add("required placeholder missing: $required") }
}
if ($compose -match '\$\{[^}]*:-' -or $compose -match '\$\(' -or $compose -match '`') {
    $errors.Add('shell or default interpolation is forbidden')
}
if ($compose -match '(?m)^\s*network_mode\s*:\s*host\b') { $errors.Add('network_mode: host is forbidden') }
if ($compose -match '(?m)^\s*ports\s*:') {
    $portBlocks = [regex]::Matches($compose, '(?ms)^\s+ports\s*:\s*(.*?)(?=^\S|\z)')
    foreach ($block in $portBlocks) {
        if ($block.Value -notmatch 'host_ip:\s*127\.0\.0\.1') { $errors.Add('published ports must bind only to loopback') }
    }
}
if ($compose -match '(?m)^\s*volumes\s*:') { $errors.Add('slot volume mounts/declarations are forbidden') }
if ($compose -match '(?i)(password|secret|token|api[_-]?key|private[_-]?key)\s*[:=]') {
    $errors.Add('possible inline secret found')
}
if ($compose -notmatch 'churchapp-persistent\s*:\s*\r?\n\s+external:\s*true' -or
    $compose -notmatch 'internal:\s*true') { $errors.Add('slot networks must be internal and persistent network external') }
foreach ($image in [regex]::Matches($compose, '(?m)^\s+image:\s*(\S+)')) {
    if ($image.Groups[1].Value -notmatch '^ghcr\.io/guilhermebrecailo/churchapp-(?:api|web):\$\{IMAGE_TAG\}@sha256:\$\{(?:API|WEB)_DIGEST\}$') {
        $errors.Add("image must use release tag and digest placeholders: $($image.Groups[1].Value)")
    }
}
if ($compose -match '0000000000000000000000000000000000000000|@sha256:0{64}|:latest\b') {
    $errors.Add('zero, fixed, or mutable image reference found')
}
if (($manifest.volumes | Measure-Object).Count -ne 0) { $errors.Add('manifest must not declare slot volumes') }
if ($manifest.persistent_dependencies.services -notcontains 'application-database' -or
    $manifest.persistent_dependencies.services -notcontains 'keycloak') {
    $errors.Add('database and Keycloak must remain persistent external dependencies')
}
$expectedPorts = @(@{ api = 18080; web = 18081 }, @{ api = 18082; web = 18083 })
if ($manifest.slots.blue.api_port -ne $expectedPorts[0].api -or
    $manifest.slots.blue.web_port -ne $expectedPorts[0].web -or
    $manifest.slots.green.api_port -ne $expectedPorts[1].api -or
    $manifest.slots.green.web_port -ne $expectedPorts[1].web -or
    $manifest.slots.blue.api_port -eq $manifest.slots.green.api_port -or
    $manifest.slots.blue.web_port -eq $manifest.slots.green.web_port) {
    $errors.Add('slot ports must be distinct and match the deterministic manifest map')
}
if ($manifest.healthchecks.api -ne '/status' -or $manifest.healthchecks.web -ne '/login' -or
    $manifest.healthchecks.keycloak -ne '/realms/master') { $errors.Add('healthcheck paths mismatch') }
if ($apiServer -notmatch 'process\.env\.API_PORT\s*\|\|\s*8000' -or
    $compose -notmatch '(?ms)api:.*?target:\s*8000.*?http://127\.0\.0\.1:8000/status') {
    $errors.Add('API default port and healthcheck target must both be 8000')
}
if ($apiDockerfile -notmatch '(?m)^RUN apk add --no-cache curl\s*$') { $errors.Add('API image must install curl') }
if ($apiDockerfile -notmatch '(?m)^EXPOSE 8000\s*$' -or
    $apiDockerfile -match '(?m)^EXPOSE\s+3333\s*$') {
    $errors.Add('API Dockerfile must expose 8000 and must not expose 3333')
}
if ($webDockerfile -notmatch '(?ms)FROM node:20-slim AS runtime.*?apt-get install -y --no-install-recommends curl') {
    $errors.Add('web runtime image must install curl')
}
if ($smoke -notmatch '\$API_URL/status' -or $smoke -notmatch '\$WEB_URL/login' -or
    $smoke -notmatch '\$KEYCLOAK_URL/realms/master' -or $smoke -match '(?i)(create|delete|update).{0,30}user') {
    $errors.Add('smoke must check API, web and Keycloak without mutating users')
}
if ($compose -match '(?i)api[ _-]?promo|promo') { $errors.Add('forbidden service reference found') }

if ($errors.Count -gt 0) { throw ($errors -join [Environment]::NewLine) }
Write-Output 'ChurchApp blue-green static contract passed.'
