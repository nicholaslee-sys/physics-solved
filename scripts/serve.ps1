# Physics Solved — zero-dependency static server for previewing the demo on
# Windows (no Node or Python required). Serves the repo root; "/" -> demo page.
#
#   powershell -ExecutionPolicy Bypass -File scripts\serve.ps1
#   then open http://localhost:8123/
#
param(
  [int]$Port = 8123,
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try {
  $listener.Start()
} catch {
  Write-Host "Could not bind to port $Port. Is it already in use? $($_.Exception.Message)"
  exit 1
}
Write-Host "Physics Solved demo: http://localhost:$Port/   (serving $Root)"
Write-Host "Press Ctrl+C to stop."

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".mjs"  = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
  try { $ctx = $listener.GetContext() } catch { break }
  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $path = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)
    if ($path -eq "/" -or $path -eq "") { $path = "/demo/index.html" }
    $rel = $path.TrimStart("/") -replace "/", "\"
    $file = Join-Path $Root $rel
    $res.AddHeader("Access-Control-Allow-Origin", "*")
    if ((Test-Path $file) -and -not (Get-Item $file).PSIsContainer) {
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $ct = $mime[$ext]; if (-not $ct) { $ct = "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $res.ContentType = $ct
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $buf = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
      $res.OutputStream.Write($buf, 0, $buf.Length)
    }
  } catch {
    Write-Host "ERR $($_.Exception.Message)"
  } finally {
    try { $res.OutputStream.Close() } catch {}
  }
}
