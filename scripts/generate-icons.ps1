# Generate PNG icons for Chrome Web Store (16, 32, 48, 128)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'icons'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

function New-GeminiTunerIcon([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::FromArgb(255, 11, 19, 32))

    $radius = [int]($size * 0.22)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $radius * 2, $radius * 2, 180, 90)
    $path.AddArc($size - $radius * 2, 0, $radius * 2, $radius * 2, 270, 90)
    $path.AddArc($size - $radius * 2, $size - $radius * 2, $radius * 2, $radius * 2, 0, 90)
    $path.AddArc(0, $size - $radius * 2, $radius * 2, $radius * 2, 90, 90)
    $path.CloseFigure()
    $g.SetClip($path)

    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
        [System.Drawing.Point]::new(0, 0),
        [System.Drawing.Point]::new($size, $size),
        [System.Drawing.Color]::FromArgb(255, 56, 189, 248),
        [System.Drawing.Color]::FromArgb(255, 236, 72, 153)
    )
    $g.FillRectangle($brush, 0, 0, $size, $size)
    $g.ResetClip()

    $cx = $size / 2.0
    $cy = $size / 2.0
    $r = $size * 0.28
    $star = New-Object System.Drawing.Drawing2D.GraphicsPath
    $star.AddEllipse($cx - $r, $cy - $r, $r * 2, $r * 2)
    $sparkle = New-Object System.Drawing.Drawing2D.GraphicsPath
    $sparkle.AddPolygon(@(
        [System.Drawing.PointF]::new($cx, $cy - $r),
        [System.Drawing.PointF]::new($cx + $r * 0.35, $cy - $r * 0.35),
        [System.Drawing.PointF]::new($cx + $r, $cy),
        [System.Drawing.PointF]::new($cx + $r * 0.35, $cy + $r * 0.35),
        [System.Drawing.PointF]::new($cx, $cy + $r),
        [System.Drawing.PointF]::new($cx - $r * 0.35, $cy + $r * 0.35),
        [System.Drawing.PointF]::new($cx - $r, $cy),
        [System.Drawing.PointF]::new($cx - $r * 0.35, $cy - $r * 0.35)
    ))
    $g.FillPath($brush, $sparkle)

    $g.Dispose()
    $brush.Dispose()
    return $bmp
}

foreach ($s in @(16, 32, 48, 128)) {
    $bmp = New-GeminiTunerIcon $s
    $path = Join-Path $outDir "icon$s.png"
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created $path"
}
