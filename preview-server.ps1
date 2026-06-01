$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), 4174)
$listener.Start()
Write-Host "Serving $root at http://localhost:4174/"

function Get-ContentType($file) {
  switch ([IO.Path]::GetExtension($file).ToLowerInvariant()) {
    ".html" { "text/html; charset=utf-8" }
    ".css" { "text/css; charset=utf-8" }
    ".js" { "application/javascript; charset=utf-8" }
    default { "application/octet-stream" }
  }
}

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    $stream = $client.GetStream()
    $stream.ReadTimeout = 1000
    $stream.WriteTimeout = 1000
    $reader = [IO.StreamReader]::new($stream)
    $requestLine = $null

    try {
      $requestLine = $reader.ReadLine()
    } catch {
      $stream.Close()
      $client.Close()
      continue
    }

    if ([string]::IsNullOrWhiteSpace($requestLine)) {
      $stream.Close()
      $client.Close()
      continue
    }

    try {
      while (($line = $reader.ReadLine()) -ne $null -and $line -ne "") {}
    } catch {}

    $urlPath = "/"
    if ($requestLine -match "^[A-Z]+\s+([^\s]+)\s+HTTP/") {
      $urlPath = $Matches[1].Split("?")[0]
    }

    $relativePath = [Uri]::UnescapeDataString($urlPath.TrimStart("/"))
    if ([string]::IsNullOrWhiteSpace($relativePath)) {
      $relativePath = "index.html"
    }

    $safePath = $relativePath -replace "/", [IO.Path]::DirectorySeparatorChar
    $file = [IO.Path]::GetFullPath((Join-Path $root $safePath))

    if (-not $file.StartsWith($root) -or -not (Test-Path -LiteralPath $file -PathType Leaf)) {
      $body = [Text.Encoding]::UTF8.GetBytes("Not found")
      $header = "HTTP/1.1 404 Not Found`r`nContent-Length: $($body.Length)`r`nContent-Type: text/plain; charset=utf-8`r`nConnection: close`r`n`r`n"
    } else {
      $body = [IO.File]::ReadAllBytes($file)
      $type = Get-ContentType $file
      $header = "HTTP/1.1 200 OK`r`nContent-Length: $($body.Length)`r`nContent-Type: $type`r`nConnection: close`r`n`r`n"
    }

    $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    $stream.Write($body, 0, $body.Length)
    $stream.Close()
    $client.Close()
  }
} finally {
  $listener.Stop()
}
