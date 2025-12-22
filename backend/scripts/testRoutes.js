// Test script to verify all routes and database connections
import { pool, testConnection } from '../config/database.js';
import express from 'express';

const app = express();

async function testDatabaseConnection() {
  console.log('\n🔍 Testing Database Connection...');
  try {
    await testConnection();
    const [result] = await pool.execute('SELECT DATABASE() as db, COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = DATABASE()');
    console.log('✅ Database connected:', result[0].db);
    console.log('✅ Tables found:', result[0].table_count);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testKeyTables() {
  console.log('\n🔍 Testing Key Tables...');
  const tables = ['users', 'students', 'teachers', 'classes', 'fees', 'payments', 'receipts'];
  const results = {};
  
  for (const table of tables) {
    try {
      const [result] = await pool.execute(`SELECT COUNT(*) as count FROM ${table}`);
      results[table] = { exists: true, count: result[0].count };
      console.log(`✅ ${table}: ${result[0].count} records`);
    } catch (error) {
      results[table] = { exists: false, error: error.message };
      console.error(`❌ ${table}: ${error.message}`);
    }
  }
  
  return results;
}

async function testDataFetching() {
  console.log('\n🔍 Testing Data Fetching Queries...');
  
  const tests = [
    {
      name: 'Fetch Students',
      query: 'SELECT COUNT(*) as count FROM students',
    },
    {
      name: 'Fetch Teachers',
      query: 'SELECT COUNT(*) as count FROM teachers',
    },
    {
      name: 'Fetch Classes',
      query: 'SELECT COUNT(*) as count FROM classes',
    },
    {
      name: 'Fetch Fees',
      query: 'SELECT COUNT(*) as count FROM fees',
    },
    {
      name: 'Fetch Payments',
      query: 'SELECT COUNT(*) as count FROM payments',
    },
    {
      name: 'Student with Class Info',
      query: `
        SELECT s.user_ic, u.nama, c.nama_kelas, t.nama as guru_nama
        FROM students s
        LEFT JOIN users u ON s.user_ic = u.ic
        LEFT JOIN classes c ON s.kelas_id = c.id
        LEFT JOIN users t ON c.guru_ic = t.ic
        LIMIT 1
      `,
    },
    {
      name: 'Teacher with Classes',
      query: `
        SELECT u.ic, u.nama, COUNT(c.id) as class_count
        FROM users u
        LEFT JOIN classes c ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(c.guru_ic, '-', ''), ' ', '')
        WHERE u.role IN ('teacher', 'staff', 'admin')
        GROUP BY u.ic, u.nama
        LIMIT 1
      `,
    },
  ];
  
  const results = {};
  
  for (const test of tests) {
    try {
      const [result] = await pool.execute(test.query);
      results[test.name] = { success: true, data: result };
      console.log(`✅ ${test.name}: Success`);
    } catch (error) {
      results[test.name] = { success: false, error: error.message };
      console.error(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  return results;
}

async function testRouteQueries() {
  console.log('\n🔍 Testing Route-Specific Queries...');
  
  const tests = [
    {
      name: 'Get Student by IC (with teacher info)',
      query: `
        SELECT 
          u.ic, 
          u.nama, 
          s.kelas_id, 
          c.nama_kelas,
          c.level,
          t.nama as guru_nama,
          t.ic as guru_ic
        FROM users u
        JOIN students s ON u.ic = s.user_ic
        LEFT JOIN classes c ON s.kelas_id = c.id
        LEFT JOIN users t ON c.guru_ic = t.ic
        WHERE u.role = 'student'
        LIMIT 1
      `,
    },
    {
      name: 'Get Teacher by IC (with classes)',
      query: `
        SELECT 
          u.ic, 
          u.nama, 
          c.id as kelas_id,
          c.nama_kelas,
          c.level,
          COUNT(DISTINCT s.user_ic) as student_count
        FROM users u
        LEFT JOIN classes c ON REPLACE(REPLACE(u.ic, '-', ''), ' ', '') = REPLACE(REPLACE(c.guru_ic, '-', ''), ' ', '')
        LEFT JOIN students s ON c.id = s.kelas_id
        WHERE u.role IN ('teacher', 'staff', 'admin')
        GROUP BY u.ic, u.nama, c.id, c.nama_kelas, c.level
        LIMIT 1
      `,
    },
    {
      name: 'Get Receipts',
      query: `
        SELECT 
          f.no_resit,
          f.resit_img,
          p.no_resit as payment_resit,
          p.resit_img as payment_resit_img
        FROM fees f
        LEFT JOIN payments p ON f.user_ic = p.user_ic
        WHERE f.status = 'paid' OR p.status = 'completed'
        LIMIT 1
      `,
    },
  ];
  
  const results = {};
  
  for (const test of tests) {
    try {
      const [result] = await pool.execute(test.query);
      results[test.name] = { success: true, data: result, count: result.length };
      console.log(`✅ ${test.name}: Success (${result.length} results)`);
    } catch (error) {
      results[test.name] = { success: false, error: error.message };
      console.error(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  return results;
}

async function runAllTests() {
  console.log('🚀 Starting Route and Database Connection Tests...\n');
  
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error('\n❌ Database connection failed. Cannot proceed with tests.');
    process.exit(1);
  }
  
  const tableResults = await testKeyTables();
  const dataFetchResults = await testDataFetching();
  const routeQueryResults = await testRouteQueries();
  
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const allTableTests = Object.values(tableResults).every(r => r.exists);
  const allDataTests = Object.values(dataFetchResults).every(r => r.success);
  const allRouteTests = Object.values(routeQueryResults).every(r => r.success);
  
  console.log(`Database Connection: ${dbConnected ? '✅' : '❌'}`);
  console.log(`Key Tables: ${allTableTests ? '✅' : '❌'}`);
  console.log(`Data Fetching: ${allDataTests ? '✅' : '❌'}`);
  console.log(`Route Queries: ${allRouteTests ? '✅' : '❌'}`);
  
  if (dbConnected && allTableTests && allDataTests && allRouteTests) {
    console.log('\n✅ All tests passed! Backend and database are properly connected.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});

