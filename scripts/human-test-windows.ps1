Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class HitobitoSleepBlocker
{
    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern uint SetThreadExecutionState(uint esFlags);
}
"@

$ES_CONTINUOUS = [uint32]0x80000000
$ES_SYSTEM_REQUIRED = [uint32]0x00000001

$preventFlags = [uint32]($ES_CONTINUOUS -bor $ES_SYSTEM_REQUIRED)
$result = [HitobitoSleepBlocker]::SetThreadExecutionState($preventFlags)

if ($result -eq 0) {
    Write-Host "[Sleep] スリープ防止を有効にできませんでした。テストサーバーはそのまま起動します。" -ForegroundColor Yellow
} else {
    Write-Host "[Sleep] 人間テスト中はPCのスリープを防止します。画面オフは可能です。" -ForegroundColor Green
}

try {
    & npm run human-test
    $exitCode = $LASTEXITCODE
}
finally {
    [void][HitobitoSleepBlocker]::SetThreadExecutionState($ES_CONTINUOUS)
    Write-Host "[Sleep] スリープ防止を解除しました。" -ForegroundColor DarkGray
}

if ($null -eq $exitCode) {
    $exitCode = 0
}

exit $exitCode
