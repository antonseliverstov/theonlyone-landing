# Makes web copies of the VK catalog photos: 720 px wide JPEG, quality 82, named 01.jpg ... 35.jpg.
# The default source is the photo folder inside D:\Work\theonlyone-catalog (found by lookup:
# Windows PowerShell reads this file as ANSI, so the script avoids Cyrillic literals).
param(
  [string]$Source = (Get-ChildItem 'D:\Work\theonlyone-catalog' -Directory | Select-Object -First 1).FullName,
  [string]$Target = (Join-Path $PSScriptRoot '..\img\catalog'),
  [int]$Width = 720,
  [long]$Quality = 82
)
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $Target | Out-Null
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $Quality)
Get-ChildItem -LiteralPath $Source -Filter '*.jpg' | Sort-Object Name | ForEach-Object {
  $num = $_.Name.Substring(0, 2)
  $src = [System.Drawing.Image]::FromFile($_.FullName)
  $h = [int][math]::Round($src.Height * $Width / $src.Width)
  $bmp = New-Object System.Drawing.Bitmap($Width, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($src, 0, 0, $Width, $h)
  $out = Join-Path $Target "$num.jpg"
  $bmp.Save($out, $codec, $params)
  $g.Dispose(); $bmp.Dispose(); $src.Dispose()
  '{0} {1}x{2} {3:N0} KB' -f "$num.jpg", $Width, $h, ((Get-Item $out).Length / 1KB)
}
