# PIC Approval Workflow Test Script
# Tests the complete PIC approval system workflow

param(
    [string]$BaseUrl = "http://localhost:5000/api",
    [string]$AdminIC = "990101010101",
    [string]$AdminPassword = "admin123",
    [string]$PicIC = "",
    [string]$PicPassword = ""
)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   PIC Approval Workflow Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$successColor = "Green"
$errorColor = "Red"
$infoColor = "Yellow"
$warnColor = "Magenta"

$global:adminToken = $null
$global:picToken = $null
$global:testResults = @{}

function Log-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor $successColor }
function Log-Error { param($msg) Write-Host "✗ $msg" -ForegroundColor $errorColor }
function Log-Info { param($msg) Write-Host "ℹ $msg" -ForegroundColor $infoColor }
function Log-Step { param($msg) Write-Host "`n→ $msg" -ForegroundColor Cyan }
function Log-Warn { param($msg) Write-Host "⚠ $msg" -ForegroundColor $warnColor }

function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Token = $null,
        [object]$Body = $null
    )
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        if ($Token) {
            $headers["Authorization"] = "Bearer $Token"
        }
        
        $params = @{
            Uri = "$BaseUrl$Endpoint"
            Method = $Method
            Headers = $headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return @{
            Success = $true
            Data = $response
        }
    } catch {
        $errorData = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        return @{
            Success = $false
            Error = $errorData
            Status = $_.Exception.Response.StatusCode.value__
            Message = $errorData.message -or $_.Exception.Message
        }
    }
}

# Step 1: Login as Admin
function Test-AdminLogin {
    Log-Step "Step 1: Logging in as Admin..."
    $result = Invoke-ApiRequest -Method "POST" -Endpoint "/auth/login" -Body @{
        icNumber = $AdminIC
        password = $AdminPassword
    }
    
    if ($result.Success -and $result.Data.success -and $result.Data.data.token) {
        $script:adminToken = $result.Data.data.token
        Log-Success "Admin logged in: $($result.Data.data.user.nama)"
        $global:testResults.AdminLogin = $true
        return $true
    } else {
        Log-Error "Admin login failed: $($result.Message)"
        $global:testResults.AdminLogin = $false
        return $false
    }
}

# Step 2: Login as PIC
function Test-PicLogin {
    if (-not $PicIC -or -not $PicPassword) {
        Log-Warn "PIC credentials not provided. Skipping PIC login test."
        Log-Info "To test PIC workflow, provide -PicIC and -PicPassword parameters"
        $global:testResults.PicLogin = $false
        return $false
    }
    
    Log-Step "Step 2: Logging in as PIC user..."
    $result = Invoke-ApiRequest -Method "POST" -Endpoint "/auth/login" -Body @{
        icNumber = $PicIC
        password = $PicPassword
    }
    
    if ($result.Success -and $result.Data.success -and $result.Data.data.token) {
        $script:picToken = $result.Data.data.token
        Log-Success "PIC logged in: $($result.Data.data.user.nama)"
        $global:testResults.PicLogin = $true
        return $true
    } else {
        Log-Error "PIC login failed: $($result.Message)"
        Log-Warn "Note: You may need to create a PIC user first"
        $global:testResults.PicLogin = $false
        return $false
    }
}

# Step 3: Create PIC Request
function Test-CreatePicRequest {
    if (-not $script:picToken) {
        Log-Warn "Skipping PIC request creation - no PIC token"
        $global:testResults.CreateRequest = $false
        return $null
    }
    
    Log-Step "Step 3: PIC user creating attendance request..."
    
    $attendanceData = @{
        student_ic = "051003060229"
        class_id = 1
        tarikh = (Get-Date).ToString("yyyy-MM-dd")
        status = "Hadir"
    }
    
    $result = Invoke-ApiRequest -Method "POST" -Endpoint "/attendance" -Token $script:picToken -Body $attendanceData
    
    if ($result.Success -and $result.Data.pendingApproval) {
        Log-Success "PIC request created successfully"
        Log-Info "Pending ID: $($result.Data.data.pendingId)"
        Log-Info "Message: $($result.Data.message)"
        $global:testResults.CreateRequest = $true
        return $result.Data.data.pendingId
    } elseif ($result.Success -and -not $result.Data.pendingApproval) {
        Log-Warn "Request was executed immediately (PIC may have admin privileges or middleware not applied)"
        $global:testResults.CreateRequest = $false
        return $null
    } else {
        Log-Error "Failed to create PIC request: $($result.Message)"
        $global:testResults.CreateRequest = $false
        return $null
    }
}

# Step 4: View Pending Requests
function Test-ViewPendingRequests {
    if (-not $script:adminToken) {
        Log-Warn "Skipping - no admin token"
        $global:testResults.ViewRequests = $false
        return $null
    }
    
    Log-Step "Step 4: Admin viewing pending PIC requests..."
    $result = Invoke-ApiRequest -Method "GET" -Endpoint "/pending-pic-changes?status=pending" -Token $script:adminToken
    
    if ($result.Success -and $result.Data.success) {
        $requests = $result.Data.data
        if ($null -eq $requests) { $requests = @() }
        
        Log-Success "Found $($requests.Count) pending request(s)"
        
        if ($requests.Count -gt 0) {
            for ($i = 0; $i -lt $requests.Count; $i++) {
                $req = $requests[$i]
                Log-Info "Request $($i + 1):"
                Log-Info "  - ID: $($req.id)"
                Log-Info "  - Action: $($req.action_key)"
                Log-Info "  - Entity: $($req.entity_type)"
                Log-Info "  - Requester: $($req.requester_name -or $req.created_by)"
                Log-Info "  - Created: $($req.created_at)"
            }
            $global:testResults.ViewRequests = $true
            return $requests[0]
        } else {
            Log-Warn "No pending requests found"
            $global:testResults.ViewRequests = $false
            return $null
        }
    } else {
        Log-Error "Failed to fetch pending requests: $($result.Message)"
        $global:testResults.ViewRequests = $false
        return $null
    }
}

# Step 5: View Request Details
function Test-ViewRequestDetails {
    param([object]$Request)
    
    if (-not $Request -or -not $script:adminToken) {
        $global:testResults.ViewDetails = $false
        return $null
    }
    
    Log-Step "Step 5: Admin viewing details for request $($Request.id)..."
    $result = Invoke-ApiRequest -Method "GET" -Endpoint "/pending-pic-changes/$($Request.id)" -Token $script:adminToken
    
    if ($result.Success -and $result.Data.success) {
        $request = $result.Data.data
        Log-Success "Request details retrieved"
        Log-Info "  - Action Key: $($request.action_key)"
        Log-Info "  - Entity Type: $($request.entity_type)"
        Log-Info "  - Entity ID: $($request.entity_id -or 'N/A')"
        Log-Info "  - Status: $($request.status)"
        $global:testResults.ViewDetails = $true
        return $request
    } else {
        Log-Error "Failed to fetch request details: $($result.Message)"
        $global:testResults.ViewDetails = $false
        return $null
    }
}

# Step 6: Approve Request
function Test-ApproveRequest {
    param(
        [object]$Request,
        [string]$Notes = "Test approval from automated test"
    )
    
    if (-not $Request -or -not $script:adminToken) {
        $global:testResults.ApproveRequest = $false
        return $false
    }
    
    Log-Step "Step 6: Admin approving request $($Request.id)..."
    $result = Invoke-ApiRequest -Method "POST" -Endpoint "/pending-pic-changes/$($Request.id)/approve" -Token $script:adminToken -Body @{
        notes = $Notes
    }
    
    if ($result.Success -and $result.Data.success) {
        Log-Success "Request approved successfully"
        Log-Info "Message: $($result.Data.message)"
        if ($result.Data.data.result) {
            Log-Info "Action executed successfully"
        }
        $global:testResults.ApproveRequest = $true
        return $true
    } else {
        Log-Error "Failed to approve request: $($result.Message)"
        if ($result.Message -match "handler") {
            Log-Warn "This error suggests the handler for this action may not be registered"
        }
        $global:testResults.ApproveRequest = $false
        return $false
    }
}

# Step 7: Verify Request Status
function Test-VerifyRequestStatus {
    param(
        [object]$Request,
        [string]$ExpectedStatus = "approved"
    )
    
    if (-not $Request -or -not $script:adminToken) {
        $global:testResults.VerifyStatus = $false
        return $false
    }
    
    Log-Step "Step 7: Verifying request $($Request.id) status is $ExpectedStatus..."
    $result = Invoke-ApiRequest -Method "GET" -Endpoint "/pending-pic-changes/$($Request.id)" -Token $script:adminToken
    
    if ($result.Success -and $result.Data.success) {
        $request = $result.Data.data
        if ($request.status -eq $ExpectedStatus) {
            Log-Success "Request status is $ExpectedStatus as expected"
            Log-Info "  - Approved by: $($request.approver_name -or $request.approved_by -or 'N/A')"
            Log-Info "  - Approved at: $($request.approved_at -or 'N/A')"
            Log-Info "  - Notes: $($request.notes -or 'N/A')"
            $global:testResults.VerifyStatus = $true
            return $true
        } else {
            Log-Error "Request status is $($request.status), expected $ExpectedStatus"
            $global:testResults.VerifyStatus = $false
            return $false
        }
    } else {
        Log-Error "Failed to verify request status: $($result.Message)"
        $global:testResults.VerifyStatus = $false
        return $false
    }
}

# Step 8: Test Rejection Flow
function Test-RejectionFlow {
    if (-not $script:picToken -or -not $script:adminToken) {
        Log-Warn "Skipping rejection test - missing tokens"
        $global:testResults.RejectFlow = $false
        return $false
    }
    
    Log-Step "Step 8: Testing rejection flow..."
    
    $pendingId = Test-CreatePicRequest
    if (-not $pendingId) {
        Log-Warn "Skipping rejection test - could not create PIC request"
        $global:testResults.RejectFlow = $false
        return $false
    }
    
    # Get the request object
    $pendingRequest = @{ id = $pendingId }
    
    Log-Info "Rejecting request $pendingId..."
    $result = Invoke-ApiRequest -Method "POST" -Endpoint "/pending-pic-changes/$pendingId/reject" -Token $script:adminToken -Body @{
        notes = "Test rejection from automated test"
    }
    
    if ($result.Success -and $result.Data.success) {
        Log-Success "Request rejected successfully"
        $verified = Test-VerifyRequestStatus -Request $pendingRequest -ExpectedStatus "rejected"
        $global:testResults.RejectFlow = $verified
        return $verified
    } else {
        Log-Error "Failed to reject request: $($result.Message)"
        $global:testResults.RejectFlow = $false
        return $false
    }
}

# Main Test Execution
Write-Host "Starting PIC Approval Workflow Tests..." -ForegroundColor Cyan
Write-Host ""

# Run tests
$adminLoggedIn = Test-AdminLogin
if (-not $adminLoggedIn) {
    Log-Error "Cannot proceed without admin login"
    exit 1
}

$picLoggedIn = Test-PicLogin

if ($picLoggedIn) {
    $pendingId = Test-CreatePicRequest
    if ($pendingId) {
        $pendingRequest = Test-ViewPendingRequests
        if ($pendingRequest) {
            $requestDetails = Test-ViewRequestDetails -Request $pendingRequest
            if ($requestDetails -and $requestDetails.status -eq "pending") {
                $approved = Test-ApproveRequest -Request $pendingRequest
                if ($approved) {
                    Test-VerifyRequestStatus -Request $pendingRequest -ExpectedStatus "approved"
                }
            }
        }
    }
} else {
    # Try to view existing pending requests
    Log-Info "Attempting to view existing pending requests..."
    $pendingRequest = Test-ViewPendingRequests
    if ($pendingRequest) {
        Test-ViewRequestDetails -Request $pendingRequest
    }
}

# Test rejection flow
if ($picLoggedIn) {
    Test-RejectionFlow
}

# Print Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Test Results Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$testNames = @{
    AdminLogin = "Admin Login"
    PicLogin = "PIC Login"
    CreateRequest = "Create Request"
    ViewRequests = "View Requests"
    ViewDetails = "View Details"
    ApproveRequest = "Approve Request"
    VerifyStatus = "Verify Status"
    RejectFlow = "Reject Flow"
}

foreach ($key in $testNames.Keys) {
    $result = $global:testResults[$key]
    $symbol = if ($result) { "✓" } else { "✗" }
    $color = if ($result) { $successColor } else { $errorColor }
    Write-Host "$($testNames[$key]):`t$symbol" -ForegroundColor $color
}

Write-Host "========================================" -ForegroundColor Cyan

$passed = ($global:testResults.Values | Where-Object { $_ -eq $true }).Count
$total = $global:testResults.Count
Write-Host "`nPassed: $passed/$total tests" -ForegroundColor $(if ($passed -eq $total) { $successColor } else { $warnColor })

if ($passed -eq $total) {
    Log-Success "All tests passed! PIC approval system is working correctly."
} else {
    Log-Warn "Some tests failed. Review the output above for details."
    Log-Info "Note: Some tests may fail if PIC user doesn't exist or has admin privileges"
}

Write-Host ""
Write-Host "Usage:" -ForegroundColor Yellow
Write-Host "  .\test-pic-approval.ps1 -PicIC 'PIC001010101' -PicPassword 'pic123'" -ForegroundColor White
Write-Host ""

