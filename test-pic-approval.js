/**
 * PIC Approval Workflow Test
 * 
 * This script tests the complete PIC approval workflow:
 * 1. PIC user creates a request (e.g., create student, update attendance)
 * 2. Request appears in admin approval page
 * 3. Admin views request details
 * 4. Admin approves/rejects the request
 * 5. Action is executed when approved
 * 6. Status updates correctly
 */

import axios from 'axios';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}→${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

// Test configuration - Update these with actual test user credentials
const TEST_CONFIG = {
  admin: {
    ic: '990101010101', // Admin IC
    password: 'admin123' // Admin password
  },
  pic: {
    ic: 'PIC001010101', // PIC user IC (update with actual PIC user)
    password: 'pic123' // PIC password
  }
};

let adminToken = null;
let picToken = null;

// Helper function to make authenticated requests
const apiRequest = async (method, endpoint, token, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      ...(data && { data })
    };
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Step 1: Login as Admin
const loginAdmin = async () => {
  log.step('Step 1: Logging in as Admin...');
  const result = await apiRequest('POST', '/auth/login', null, {
    icNumber: TEST_CONFIG.admin.ic,
    password: TEST_CONFIG.admin.password
  });

  if (result.success && result.data?.success && result.data?.data?.token) {
    adminToken = result.data.data.token;
    log.success(`Admin logged in: ${result.data.data.user.nama}`);
    return true;
  } else {
    log.error(`Admin login failed: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
};

// Step 2: Login as PIC
const loginPic = async () => {
  log.step('Step 2: Logging in as PIC user...');
  const result = await apiRequest('POST', '/auth/login', null, {
    icNumber: TEST_CONFIG.pic.ic,
    password: TEST_CONFIG.pic.password
  });

  if (result.success && result.data?.success && result.data?.data?.token) {
    picToken = result.data.data.token;
    log.success(`PIC logged in: ${result.data.data.user.nama}`);
    return true;
  } else {
    log.error(`PIC login failed: ${result.error?.message || 'Unknown error'}`);
    log.warn('Note: You may need to create a PIC user first or update TEST_CONFIG');
    return false;
  }
};

// Step 3: PIC creates a request (e.g., create attendance)
const createPicRequest = async () => {
  log.step('Step 3: PIC user creating attendance request...');
  
  // Create a test attendance request
  const attendanceData = {
    student_ic: '051003060229', // Test student IC
    class_id: 1, // Test class ID
    tarikh: new Date().toISOString().split('T')[0],
    status: 'Hadir'
  };

  const result = await apiRequest('POST', '/attendance', picToken, attendanceData);

  if (result.success && result.data?.pendingApproval) {
    log.success('PIC request created successfully');
    log.info(`Pending ID: ${result.data.data?.pendingId}`);
    log.info(`Message: ${result.data.message}`);
    return result.data.data?.pendingId;
  } else if (result.success && !result.data?.pendingApproval) {
    log.warn('Request was executed immediately (PIC may have admin privileges or middleware not applied)');
    return null;
  } else {
    log.error(`Failed to create PIC request: ${result.error?.message || 'Unknown error'}`);
    return null;
  }
};

// Step 4: Admin views pending requests
const viewPendingRequests = async () => {
  log.step('Step 4: Admin viewing pending PIC requests...');
  const result = await apiRequest('GET', '/pending-pic-changes?status=pending', adminToken);

  if (result.success && result.data?.success) {
    const requests = result.data.data || [];
    log.success(`Found ${requests.length} pending request(s)`);
    
    if (requests.length > 0) {
      requests.forEach((req, index) => {
        log.info(`Request ${index + 1}:`);
        log.info(`  - ID: ${req.id}`);
        log.info(`  - Action: ${req.action_key}`);
        log.info(`  - Entity: ${req.entity_type}`);
        log.info(`  - Requester: ${req.requester_name || req.created_by}`);
        log.info(`  - Created: ${req.created_at}`);
      });
      return requests[0]; // Return first pending request
    } else {
      log.warn('No pending requests found');
      return null;
    }
  } else {
    log.error(`Failed to fetch pending requests: ${result.error?.message || 'Unknown error'}`);
    return null;
  }
};

// Step 5: Admin views request details
const viewRequestDetails = async (requestId) => {
  log.step(`Step 5: Admin viewing details for request ${requestId}...`);
  const result = await apiRequest('GET', `/pending-pic-changes/${requestId}`, adminToken);

  if (result.success && result.data?.success) {
    const request = result.data.data;
    log.success('Request details retrieved');
    log.info(`  - Action Key: ${request.action_key}`);
    log.info(`  - Entity Type: ${request.entity_type}`);
    log.info(`  - Entity ID: ${request.entity_id || 'N/A'}`);
    log.info(`  - Status: ${request.status}`);
    log.info(`  - Payload: ${JSON.stringify(request.payload, null, 2).substring(0, 200)}...`);
    return request;
  } else {
    log.error(`Failed to fetch request details: ${result.error?.message || 'Unknown error'}`);
    return null;
  }
};

// Step 6: Admin approves request
const approveRequest = async (requestId, notes = 'Test approval from automated test') => {
  log.step(`Step 6: Admin approving request ${requestId}...`);
  const result = await apiRequest('POST', `/pending-pic-changes/${requestId}/approve`, adminToken, {
    notes
  });

  if (result.success && result.data?.success) {
    log.success('Request approved successfully');
    log.info(`Message: ${result.data.message}`);
    if (result.data.data?.result) {
      log.info('Action executed successfully');
    }
    return true;
  } else {
    log.error(`Failed to approve request: ${result.error?.message || 'Unknown error'}`);
    if (result.error?.message?.includes('handler')) {
      log.warn('This error suggests the handler for this action may not be registered');
    }
    return false;
  }
};

// Step 7: Verify request status changed
const verifyRequestStatus = async (requestId, expectedStatus = 'approved') => {
  log.step(`Step 7: Verifying request ${requestId} status is ${expectedStatus}...`);
  const result = await apiRequest('GET', `/pending-pic-changes/${requestId}`, adminToken);

  if (result.success && result.data?.success) {
    const request = result.data.data;
    if (request.status === expectedStatus) {
      log.success(`Request status is ${expectedStatus} as expected`);
      log.info(`  - Approved by: ${request.approver_name || request.approved_by || 'N/A'}`);
      log.info(`  - Approved at: ${request.approved_at || 'N/A'}`);
      log.info(`  - Notes: ${request.notes || 'N/A'}`);
      return true;
    } else {
      log.error(`Request status is ${request.status}, expected ${expectedStatus}`);
      return false;
    }
  } else {
    log.error(`Failed to verify request status: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
};

// Step 8: Test rejection flow
const testRejectionFlow = async () => {
  log.step('Step 8: Testing rejection flow...');
  
  // Create another PIC request
  const pendingId = await createPicRequest();
  if (!pendingId) {
    log.warn('Skipping rejection test - could not create PIC request');
    return false;
  }

  // Reject the request
  log.info(`Rejecting request ${pendingId}...`);
  const result = await apiRequest('POST', `/pending-pic-changes/${pendingId}/reject`, adminToken, {
    notes: 'Test rejection from automated test'
  });

  if (result.success && result.data?.success) {
    log.success('Request rejected successfully');
    
    // Verify status
    const verified = await verifyRequestStatus(pendingId, 'rejected');
    return verified;
  } else {
    log.error(`Failed to reject request: ${result.error?.message || 'Unknown error'}`);
    return false;
  }
};

// Main test function
const runTests = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('  PIC Approval Workflow Test');
  console.log('='.repeat(60) + '\n');

  const results = {
    adminLogin: false,
    picLogin: false,
    createRequest: false,
    viewRequests: false,
    viewDetails: false,
    approveRequest: false,
    verifyStatus: false,
    rejectFlow: false
  };

  try {
    // Step 1: Login as Admin
    results.adminLogin = await loginAdmin();
    if (!results.adminLogin) {
      log.error('Cannot proceed without admin login');
      return results;
    }

    // Step 2: Login as PIC
    results.picLogin = await loginPic();
    if (!results.picLogin) {
      log.warn('PIC login failed - some tests will be skipped');
    }

    // Step 3: Create PIC request
    if (results.picLogin) {
      const pendingId = await createPicRequest();
      results.createRequest = pendingId !== null;
      
      if (pendingId) {
        // Step 4: View pending requests
        const pendingRequest = await viewPendingRequests();
        results.viewRequests = pendingRequest !== null;

        if (pendingRequest) {
          // Step 5: View request details
          const requestDetails = await viewRequestDetails(pendingRequest.id);
          results.viewDetails = requestDetails !== null;

          // Step 6: Approve request
          if (requestDetails && requestDetails.status === 'pending') {
            results.approveRequest = await approveRequest(pendingRequest.id);
            
            // Step 7: Verify status
            if (results.approveRequest) {
              results.verifyStatus = await verifyRequestStatus(pendingRequest.id, 'approved');
            }
          }
        }
      }
    } else {
      // If PIC login failed, try to view existing pending requests
      log.info('Attempting to view existing pending requests...');
      const pendingRequest = await viewPendingRequests();
      results.viewRequests = pendingRequest !== null;
      
      if (pendingRequest) {
        results.viewDetails = await viewRequestDetails(pendingRequest.id) !== null;
      }
    }

    // Step 8: Test rejection flow
    if (results.picLogin) {
      results.rejectFlow = await testRejectionFlow();
    }

  } catch (error) {
    log.error(`Test execution error: ${error.message}`);
    console.error(error);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('  Test Results Summary');
  console.log('='.repeat(60));
  console.log(`Admin Login:        ${results.adminLogin ? '✓' : '✗'}`);
  console.log(`PIC Login:          ${results.picLogin ? '✓' : '✗'}`);
  console.log(`Create Request:     ${results.createRequest ? '✓' : '✗'}`);
  console.log(`View Requests:      ${results.viewRequests ? '✓' : '✗'}`);
  console.log(`View Details:       ${results.viewDetails ? '✓' : '✗'}`);
  console.log(`Approve Request:    ${results.approveRequest ? '✓' : '✗'}`);
  console.log(`Verify Status:      ${results.verifyStatus ? '✓' : '✗'}`);
  console.log(`Reject Flow:        ${results.rejectFlow ? '✓' : '✗'}`);
  console.log('='.repeat(60));

  const passed = Object.values(results).filter(v => v === true).length;
  const total = Object.keys(results).length;
  console.log(`\nPassed: ${passed}/${total} tests`);

  if (passed === total) {
    log.success('All tests passed! PIC approval system is working correctly.');
  } else {
    log.warn('Some tests failed. Review the output above for details.');
  }

  return results;
};

// Run tests if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule) {
  runTests().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runTests, loginAdmin, loginPic, createPicRequest, viewPendingRequests, approveRequest };

