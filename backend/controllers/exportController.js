import { createAndUploadDatabaseBackup, getBackupHistory } from '../services/databaseBackupService.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const BACKUP_DIR = path.resolve(__dirname, '..', 'backups')

export async function exportDatabase(req, res) {
  try {
    const result = await createAndUploadDatabaseBackup({
      triggerType: req.body?.triggerType || 'manual',
      triggeredBy: req.user?.ic || req.user?.user_ic || req.user?.id || null,
    })

    return res.status(200).json({
      success: true,
      message: 'Database backup generated successfully.',
      data: {
        ...result,
        createdAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to export database:', error)
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to export database',
    })
  }
}

export async function getExportHistory(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const history = await getBackupHistory(limit);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Failed to fetch export history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch export history',
    });
  }
}

export async function downloadExportFile(req, res) {
  try {
    const { fileName } = req.params
    if (!fileName || fileName.includes('..')) {
      return res.status(400).json({ success: false, message: 'Invalid file name' })
    }

    const filePath = path.join(BACKUP_DIR, fileName)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' })
    }

    res.download(filePath, fileName)
  } catch (error) {
    console.error('Failed to download export file:', error)
    res.status(500).json({ success: false, message: 'Failed to download export file' })
  }
}


