$pptxPath = "C:\Users\PRIMA\timesweet-hris\PROPOSAL_PRIME_HRIS_PT_DWI_MARTHA_JAYA.pptx"
$pdfPath  = "C:\Users\PRIMA\timesweet-hris\PROPOSAL_PRIME_HRIS_PT_DWI_MARTHA_JAYA.pdf"

$ppt = New-Object -ComObject PowerPoint.Application
try {
    $presentation = $ppt.Presentations.Open($pptxPath, [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)
    # 32 is ppSaveAsPDF
    $presentation.SaveAs($pdfPath, 32)
    $presentation.Close()
    Write-Host "PDF Exported Successfully to: $pdfPath"
} catch {
    Write-Error $_.Exception.Message
} finally {
    $ppt.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
