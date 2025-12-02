/**
 * Utility script to assign multiple roles (admin, pic, staff) to an admin user
 * This allows admins to switch between different roles when logging in
 * 
 * Usage:
 *   node backend/utils/assignMultipleRolesToAdmin.js <IC_NUMBER> [roles...]
 * 
 * Example:
 *   node backend/utils/assignMultipleRolesToAdmin.js 920312065113 admin pic staff
 */

import { pool } from '../config/database.js';

const VALID_ROLES = ['admin', 'pic', 'staff', 'teacher', 'ib'];

async function assignRolesToUser(userIc, roles) {
  try {
    // Normalize IC (remove hyphens)
    const normalizedIc = userIc.replace(/-/g, '');
    
    // Verify user exists
    const [users] = await pool.execute(
      'SELECT ic, nama, role FROM users WHERE REPLACE(ic, "-", "") = ?',
      [normalizedIc]
    );

    if (users.length === 0) {
      console.error(`❌ User with IC ${userIc} not found`);
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ Found user: ${user.nama} (IC: ${user.ic})`);
    console.log(`   Current primary role: ${user.role}`);

    // Validate roles
    const validRoles = roles.filter(r => VALID_ROLES.includes(r.toLowerCase()));
    if (validRoles.length === 0) {
      console.error(`❌ No valid roles provided. Valid roles: ${VALID_ROLES.join(', ')}`);
      process.exit(1);
    }

    console.log(`\n📝 Assigning roles: ${validRoles.join(', ')}`);

    // Remove existing roles for this user (except primary role in users table)
    await pool.execute(
      'DELETE FROM user_roles WHERE user_ic = ?',
      [user.ic]
    );

    // Insert new roles
    for (const role of validRoles) {
      try {
        await pool.execute(
          'INSERT INTO user_roles (user_ic, role) VALUES (?, ?)',
          [user.ic, role.toLowerCase()]
        );
        console.log(`   ✅ Assigned role: ${role}`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`   ⚠️  Role ${role} already exists (skipped)`);
        } else {
          console.error(`   ❌ Failed to assign role ${role}:`, error.message);
        }
      }
    }

    // Verify roles were assigned
    const [assignedRoles] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_ic = ?',
      [user.ic]
    );

    console.log(`\n✅ Successfully assigned roles to ${user.nama}:`);
    console.log(`   Primary role (users table): ${user.role}`);
    console.log(`   Additional roles (user_roles table): ${assignedRoles.map(r => r.role).join(', ')}`);
    console.log(`\n💡 User can now switch between these roles when logging in.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error assigning roles:', error);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node assignMultipleRolesToAdmin.js <IC_NUMBER> <role1> [role2] [role3]...');
  console.log('Example: node assignMultipleRolesToAdmin.js 920312065113 admin pic staff');
  process.exit(1);
}

const [userIc, ...roles] = args;
assignRolesToUser(userIc, roles);

