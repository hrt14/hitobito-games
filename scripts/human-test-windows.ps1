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
    Write-Host "[Sleep] Could not enable sleep prevention. Starting server anyway." -ForegroundColor Yellow
} else {
    Write-Host "[Sleep] Sleep prevention is ON while playtest server is running. Display may turn off." -ForegroundColor Green
}

$exitCode = 0
try {
    & npm run human-test
    if ($null -ne $LASTEXITCODE) {
        $exitCode = $LASTEXITCODE
    }
}
finally {
    [void][HitobitoSleepBlocker]::SetThreadExecutionState($ES_CONTINUOUS)
    Write-Host "[Sleep] Sleep prevention is OFF." -ForegroundColor DarkGray
}

exit $exitCode
