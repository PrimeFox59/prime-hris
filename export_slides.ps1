$pptxPath = "C:\Users\PRIMA\timesweet-hris\PROPOSAL_PRIME_HRIS_PT_DWI_MARTHA_JAYA.pptx"
$slidesDir = "C:\Users\PRIMA\timesweet-hris\slides_export"

if (!(Test-Path $slidesDir)) {
    New-Item -ItemType Directory -Path $slidesDir | Out-Null
}

$ppt = New-Object -ComObject PowerPoint.Application
try {
    $presentation = $ppt.Presentations.Open($pptxPath, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    # 18 is ppSaveAsPNG
    $presentation.SaveAs($slidesDir, 18)
    $presentation.Close()
    Write-Host "Slides Exported Successfully to: $slidesDir"
} catch {
    Write-Error $_.Exception.Message
} finally {
    $ppt.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
