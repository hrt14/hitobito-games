Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class HitobitoSleepBlocker
{
    private const uint ES_CONTINUOUS = 0x80000000;
    private const uint ES_SYSTEM_REQUIRED = 0x00000001;

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern uint SetThreadExecutionState(uint esFlags);

    public static bool PreventSleep()
    {
        return SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED) != 0;
    }

    public static void RestoreSleep()
    {
        SetThreadExecutionState(ES_CONTINUOUS);
    }
}
"@

$enabled = [HitobitoSleepBlocker]::PreventSleep()

if ($enabled) {
    Write-Host "[Sleep] Sleep prevention is ON while playtest server is running. Display may turn off." -ForegroundColor Green
} else {
    Write-Host "[Sleep] Could not enable sleep prevention. Starting server anyway." -ForegroundColor Yellow
}

$exitCode = 0
try {
    & npm run human-test
    if ($null -ne $LASTEXITCODE) {
        $exitCode = $LASTEXITCODE
    }
}
finally {
    [HitobitoSleepBlocker]::RestoreSleep()
    Write-Host "[Sleep] Sleep prevention is OFF." -ForegroundColor DarkGray
}

exit $exitCode
