import fs from 'fs';
import path from 'path';

const dbDir = 'c:\\MyMasjidApp\\database';
const outputFile = path.join(dbDir, 'masjid_app_full_schema.sql');

// Files to exclude from combining
const excludeFiles = [
    'masjid_app_full_schema.sql',
    'masjid_app_combined.sql',
    'ERD_DIAGRAM.html',
    'ERD_DIAGRAM.md',
    'generate_mock_data_2025.js',
    'migration_insert_staff_teachers_2025.js'
];

try {
    const allFiles = fs.readdirSync(dbDir);
    
    // Sort files logically:
    // 1. masjid_app_schema.sql comes first
    // 2. All other .sql files, alphabetically
    
    let baseSchema = '';
    const migrationContents = [];
    
    const sqlFiles = allFiles.filter(f => f.endsWith('.sql') && !excludeFiles.includes(f));
    
    // Process base schema
    if (sqlFiles.includes('masjid_app_schema.sql')) {
        baseSchema = fs.readFileSync(path.join(dbDir, 'masjid_app_schema.sql'), 'utf8');
    }
    
    // Process migrations
    const migrations = sqlFiles
        .filter(f => f !== 'masjid_app_schema.sql')
        .sort(); // alphabetical sort
        
    for (const file of migrations) {
        // Skip some specific file types that might be dangerous or duplicate
        if (file.includes('remove_') || file.includes('delete_') || file.includes('fix_')) {
            // Keep them if they are fix migrations, but add a comment
        }
        
        const content = fs.readFileSync(path.join(dbDir, file), 'utf8');
        migrationContents.push(`\n\n-- >>> MIGRATION: ${file} <<<\n\n${content}`);
    }
    
    const combinedContent = `-- ==========================================\n-- FULL COMBINED DATABASE SCHEMA + MIGRATIONS\n-- Generated automatically on ${new Date().toISOString()}\n-- ==========================================\n\nSET FOREIGN_KEY_CHECKS=0;\n\n-- >>> 1. BASE SCHEMA: masjid_app_schema.sql <<<\n\n${baseSchema}\n` + migrationContents.join('');
    
    fs.writeFileSync(outputFile, combinedContent, 'utf8');
    console.log(`Successfully combined base schema and ${migrations.length} migrations into ${outputFile}`);
    console.log(`Total size: ${(combinedContent.length / 1024).toFixed(2)} KB`);
    
} catch (error) {
    console.error('Error combining files:', error);
}
