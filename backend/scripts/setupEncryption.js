import { pool } from '../config/database.js';
import { generateEncryptionKey } from '../utils/encryption.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Setup Encryption System
 * 
 * This script:
 * 1. Creates encrypted_files table
 * 2. Generates encryption key if not exists
 * 3. Sets up necessary database structures
 */

async function setupEncryption() {
  console.log('🔐 Setting up encryption system...\n');
  
  try {
    // 1. Create encrypted_files table
    console.log('📊 Creating encrypted_files table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS encrypted_files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_path VARCHAR(500) NOT NULL UNIQUE,
        encrypted_path VARCHAR(500) NOT NULL,
        iv VARCHAR(255) NOT NULL,
        auth_tag VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        mime_type VARCHAR(100),
        file_size BIGINT,
        user_ic VARCHAR(20),
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_ic (user_ic),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ encrypted_files table created\n');
    
    // 2. Create audit_log_signatures table for signed audit logs
    console.log('📊 Creating audit_log_signatures table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS audit_log_signatures (
        id INT AUTO_INCREMENT PRIMARY KEY,
        log_id INT NOT NULL,
        log_type VARCHAR(50) NOT NULL,
        signature VARCHAR(255) NOT NULL,
        signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_log_id_type (log_id, log_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ audit_log_signatures table created\n');
    
    // 3. Check if ENCRYPTION_KEY exists in .env
    console.log('🔑 Checking encryption key...');
    const envPath = path.join(__dirname, '..', '.env');
    
    try {
      const envContent = await fs.readFile(envPath, 'utf8');
      
      if (!envContent.includes('ENCRYPTION_KEY=')) {
        console.log('⚠️  ENCRYPTION_KEY not found in .env');
        console.log('🔑 Generating new encryption key...');
        
        const newKey = generateEncryptionKey();
        const envUpdate = `\n\n# Encryption Configuration\n# Generated on ${new Date().toISOString()}\nENCRYPTION_KEY=${newKey}\n`;
        
        await fs.appendFile(envPath, envUpdate);
        console.log('✅ ENCRYPTION_KEY added to .env');
        console.log('⚠️  IMPORTANT: Back up this key securely! Loss of key means loss of encrypted data.\n');
      } else {
        console.log('✅ ENCRYPTION_KEY already exists in .env\n');
      }
    } catch (error) {
      console.log('⚠️  Could not access .env file:', error.message);
      console.log('📝 Please manually add ENCRYPTION_KEY to your .env file:');
      console.log(`   ENCRYPTION_KEY=${generateEncryptionKey()}`);
      console.log('');
    }
    
    // 4. Check for API_SIGNING_SECRET
    console.log('🔑 Checking API signing secret...');
    try {
      const envContent = await fs.readFile(envPath, 'utf8');
      
      if (!envContent.includes('API_SIGNING_SECRET=')) {
        console.log('⚠️  API_SIGNING_SECRET not found in .env');
        console.log('🔑 Generating API signing secret...');
        
        const signingSecret = generateEncryptionKey();
        const envUpdate = `\n# API Request Signing\n# Generated on ${new Date().toISOString()}\nAPI_SIGNING_SECRET=${signingSecret}\n`;
        
        await fs.appendFile(envPath, envUpdate);
        console.log('✅ API_SIGNING_SECRET added to .env\n');
      } else {
        console.log('✅ API_SIGNING_SECRET already exists in .env\n');
      }
    } catch (error) {
      console.log('⚠️  Could not access .env file:', error.message);
      console.log('📝 Please manually add API_SIGNING_SECRET to your .env file:');
      console.log(`   API_SIGNING_SECRET=${generateEncryptionKey()}`);
      console.log('');
    }
    
    // 5. Display setup summary
    console.log('═'.repeat(60));
    console.log('✅ ENCRYPTION SETUP COMPLETE');
    console.log('═'.repeat(60));
    console.log('\n📋 Next Steps:');
    console.log('   1. Restart your application to load the new encryption key');
    console.log('   2. Review ENCRYPTION_DOCUMENTATION.md for usage guidelines');
    console.log('   3. Consider encrypting existing sensitive data');
    console.log('   4. Back up your ENCRYPTION_KEY securely\n');
    
    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('   • Never commit .env file to version control');
    console.log('   • Keep ENCRYPTION_KEY secure - loss means data loss');
    console.log('   • Rotate keys periodically using key rotation tools');
    console.log('   • Use different keys for development and production\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run setup
setupEncryption()
  .then(() => {
    console.log('✅ Encryption setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Encryption setup failed:', error);
    process.exit(1);
  });
