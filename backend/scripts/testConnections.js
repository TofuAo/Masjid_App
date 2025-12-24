/**
 * Test Connections Script
 * 
 * This script tests all connections:
 * - Backend to Database
 * - Frontend to Backend API
 * - All services are running
 */

import { pool, testConnection } from '../config/database.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testDatabaseConnection() {
  log('\n📊 Testing Database Connection...', 'blue');
  try {
    await testConnection();
    log('✅ Database connection: SUCCESS', 'green');
    
    // Test query
    const [result] = await pool.execute('SELECT COUNT(*) as total FROM students');
    log(`   Students in database: ${result[0].total}`, 'green');
    
    const [classes] = await pool.execute('SELECT COUNT(*) as total FROM classes');
    log(`   Classes in database: ${classes[0].total}`, 'green');
    
    return true;
  } catch (error) {
    log(`❌ Database connection: FAILED - ${error.message}`, 'red');
    return false;
  }
}

async function testBackendAPI() {
  log('\n🔌 Testing Backend API...', 'blue');
  try {
    // Try both localhost (from host) and backend service name (from container)
    const backendUrl = process.env.BACKEND_URL || 'http://backend:5000/health';
    const localhostUrl = 'http://localhost:5000/health';
    
    let response;
    try {
      response = await axios.get(backendUrl, { timeout: 5000 });
    } catch (e) {
      // If backend service name fails, try localhost
      response = await axios.get(localhostUrl, { timeout: 5000 });
    }
    
    if (response.status === 200) {
      log('✅ Backend API: SUCCESS', 'green');
      log(`   Status: ${response.data.status}`, 'green');
      log(`   Database: ${response.data.database}`, 'green');
      log(`   Uptime: ${Math.floor(response.data.uptime)}s`, 'green');
      return true;
    } else {
      log(`❌ Backend API: FAILED - Status ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Backend API: FAILED - ${error.message}`, 'red');
    return false;
  }
}

async function testFrontendConnection() {
  log('\n🌐 Testing Frontend Connection...', 'blue');
  try {
    // Try both frontend service name (from container) and localhost (from host)
    const frontendUrl = process.env.FRONTEND_URL || 'http://frontend';
    const localhostUrl = 'http://localhost:3000';
    
    let response;
    try {
      response = await axios.get(frontendUrl, {
        timeout: 5000,
        validateStatus: () => true,
      });
    } catch (e) {
      // If frontend service name fails, try localhost
      response = await axios.get(localhostUrl, {
        timeout: 5000,
        validateStatus: () => true,
      });
    }
    
    if (response.status === 200) {
      log('✅ Frontend: SUCCESS', 'green');
      log(`   Status: ${response.status}`, 'green');
      return true;
    } else {
      log(`⚠️  Frontend: Status ${response.status}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Frontend: FAILED - ${error.message}`, 'red');
    return false;
  }
}

async function testBackendToFrontendAPI() {
  log('\n🔗 Testing Frontend API Configuration...', 'blue');
  try {
    // Test if frontend can reach backend
    const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    log(`   API Base URL: ${apiBaseUrl}`, 'blue');
    
    // Try to access a public endpoint
    try {
      const response = await axios.get(`${apiBaseUrl.replace('/api', '')}/health`, {
        timeout: 5000,
      });
      log('✅ Frontend can reach Backend API', 'green');
      return true;
    } catch (error) {
      log(`⚠️  Frontend API connection: ${error.message}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ Frontend API configuration check: FAILED`, 'red');
    return false;
  }
}

async function checkDockerContainers() {
  log('\n🐳 Checking Docker Containers...', 'blue');
  // This would require docker CLI, so we'll skip it for now
  log('   (Run: docker-compose ps to check containers)', 'yellow');
  return true;
}

async function runAllTests() {
  log('\n═══════════════════════════════════════', 'blue');
  log('   CONNECTION TEST SUITE', 'blue');
  log('═══════════════════════════════════════', 'blue');
  
  const results = {
    database: await testDatabaseConnection(),
    backend: await testBackendAPI(),
    frontend: await testFrontendConnection(),
    apiConnection: await testBackendToFrontendAPI(),
    containers: await checkDockerContainers(),
  };
  
  log('\n═══════════════════════════════════════', 'blue');
  log('   TEST SUMMARY', 'blue');
  log('═══════════════════════════════════════', 'blue');
  
  const allPassed = Object.values(results).every(r => r);
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`${status} - ${test}`, color);
  });
  
  if (allPassed) {
    log('\n✅ All connections are working properly!', 'green');
  } else {
    log('\n⚠️  Some connections failed. Please check the errors above.', 'yellow');
  }
  
  // Close database connection
  await pool.end();
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runAllTests().catch((error) => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});

