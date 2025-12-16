// Comprehensive Functionality Test
import axios from 'axios';

const BASE_URL = 'http://localhost:5000';
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper function to log results
function logResult(testName, passed, message = '') {
  if (passed) {
    testResults.passed.push(testName);
    console.log(`✅ ${testName}: PASSED ${message}`);
  } else {
    testResults.failed.push(testName);
    console.log(`❌ ${testName}: FAILED ${message}`);
  }
}

function logWarning(testName, message) {
  testResults.warnings.push(testName);
  console.log(`⚠️  ${testName}: WARNING - ${message}`);
}

// Test 1: Health Check
async function testHealth() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    const isHealthy = response.data.status === 'healthy' && response.data.database === 'connected';
    logResult('Health Check', isHealthy, `- Status: ${response.data.status}, DB: ${response.data.database}`);
    return isHealthy;
  } catch (error) {
    logResult('Health Check', false, `- ${error.message}`);
    return false;
  }
}

// Test 2: Login - Student Account (uses student-login endpoint)
async function testLoginStudent() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/student-login`, {
      icNumber: '051003060229'
    });
    const isValid = response.data.success && response.data.data.token;
    logResult('Login - Student', isValid, `- User: ${response.data.data.user?.nama}`);
    return { success: isValid, token: response.data.data.token };
  } catch (error) {
    logResult('Login - Student', false, `- ${error.response?.data?.message || error.message}`);
    return { success: false, token: null };
  }
}

// Test 3: Login - Admin Account
async function testLoginAdmin() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      icNumber: '920312065113',
      password: 'Amir920313'
    });
    const isValid = response.data.success && response.data.data.token;
    logResult('Login - Admin', isValid, `- User: ${response.data.data.user?.nama}`);
    return { success: isValid, token: response.data.data.token };
  } catch (error) {
    logResult('Login - Admin', false, `- ${error.response?.data?.message || error.message}`);
    return { success: false, token: null };
  }
}

// Test 4: Get Students (authenticated)
async function testGetStudents(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/students`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const isValid = response.data.success && Array.isArray(response.data.data);
    logResult('Get Students', isValid, `- Count: ${response.data.data?.length || 0}`);
    return isValid;
  } catch (error) {
    logResult('Get Students', false, `- ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 5: Get Classes
async function testGetClasses(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/classes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const isValid = response.data.success;
    logResult('Get Classes', isValid, `- Count: ${response.data.data?.length || 0}`);
    return isValid;
  } catch (error) {
    logResult('Get Classes', false, `- ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 6: Get Fees
async function testGetFees(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/fees`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const isValid = response.data.success;
    logResult('Get Fees', isValid, `- Count: ${response.data.data?.length || 0}`);
    return isValid;
  } catch (error) {
    logResult('Get Fees', false, `- ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 7: Get Attendance
async function testGetAttendance(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/attendance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const isValid = response.data.success;
    logResult('Get Attendance', isValid, `- Count: ${response.data.data?.length || 0}`);
    return isValid;
  } catch (error) {
    logResult('Get Attendance', false, `- ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 8: Get Exams
async function testGetExams(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/exams`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const isValid = response.data.success;
    logResult('Get Exams', isValid, `- Count: ${response.data.data?.length || 0}`);
    return isValid;
  } catch (error) {
    logResult('Get Exams', false, `- ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 9: Get Profile
async function testGetProfile(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const isValid = response.data.success;
    logResult('Get Profile', isValid, `- Name: ${response.data.data?.nama}`);
    return isValid;
  } catch (error) {
    logResult('Get Profile', false, `- ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('========================================');
  console.log('  MyMasjidApp Functionality Test');
  console.log('========================================\n');

  // Test 1: Health
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('\n❌ Backend is not healthy. Stopping tests.');
    return;
  }

  console.log('');

  // Test 2 & 3: Login
  const studentLogin = await testLoginStudent();
  const adminLogin = await testLoginAdmin();

  console.log('');

  // Get a valid token for remaining tests
  const token = studentLogin.token || adminLogin.token;
  
  if (!token) {
    console.log('❌ No valid token obtained. Cannot test authenticated endpoints.');
    printSummary();
    return;
  }

  // Test authenticated endpoints
  await testGetStudents(token);
  await testGetClasses(token);
  await testGetFees(token);
  await testGetAttendance(token);
  await testGetExams(token);
  await testGetProfile(token);

  console.log('');
  printSummary();
}

function printSummary() {
  console.log('========================================');
  console.log('  Test Summary');
  console.log('========================================\n');
  
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
  
  if (testResults.failed.length > 0) {
    console.log('\nFailed Tests:');
    testResults.failed.forEach(test => console.log(`  - ${test}`));
  }
  
  console.log('\n========================================');
  if (testResults.failed.length === 0) {
    console.log('✅ ALL TESTS PASSED!');
  } else {
    console.log('❌ SOME TESTS FAILED');
  }
  console.log('========================================\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
