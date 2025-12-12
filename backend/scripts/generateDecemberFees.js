import { generateMonthlyFeesManually } from '../schedulers/monthlyFeeGenerationJob.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script to manually generate December fees
 * Run with: node scripts/generateDecemberFees.js
 */
async function main() {
  try {
    console.log('Generating December fees...');
    
    // December is month 11 (0-indexed: 0=January, 11=December)
    const currentYear = new Date().getFullYear();
    const result = await generateMonthlyFeesManually(11, currentYear);
    
    console.log('\n✅ Fee generation completed!');
    console.log(`   Month: Disember ${currentYear}`);
    console.log(`   Created: ${result.created} fees`);
    console.log(`   Skipped: ${result.skipped} (already exist)`);
    console.log(`   Errors: ${result.errors}`);
    console.log(`   Total students: ${result.total}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating fees:', error);
    process.exit(1);
  }
}

main();

