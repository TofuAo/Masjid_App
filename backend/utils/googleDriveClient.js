import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

let driveClient = null;

const SERVICE_ACCOUNT_SCOPE = ['https://www.googleapis.com/auth/drive.file'];

function loadCredentialsFromEnv() {
  if (process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT);
    } catch (error) {
      throw new Error('Failed to parse GOOGLE_DRIVE_SERVICE_ACCOUNT. Ensure the value is valid JSON.');
    }
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : path.resolve(process.cwd(), 'backend', 'google-service-account.json');

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(
      'Google Drive credentials not found. Provide GOOGLE_DRIVE_SERVICE_ACCOUNT JSON or GOOGLE_APPLICATION_CREDENTIALS path.'
    );
  }

  try {
    const raw = fs.readFileSync(credentialsPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to read Google service account credentials: ${error.message}`);
  }
}

async function createDriveClient() {
  if (driveClient) {
    return driveClient;
  }

  const credentials = loadCredentialsFromEnv();

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SERVICE_ACCOUNT_SCOPE,
  });

  driveClient = google.drive({
    version: 'v3',
    auth,
  });

  return driveClient;
}

export async function uploadFileToDrive(filePath, { fileName, mimeType = 'application/gzip', folderId } = {}) {
  const drive = await createDriveClient();

  const fileMetadata = {
    name: fileName,
    ...(folderId ? { parents: [folderId] } : {}),
  };

  const media = {
    mimeType,
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id, name, webViewLink, webContentLink',
  });

  return response.data;
}

export async function ensureFolderExists(folderId) {
  if (!folderId) {
    return null;
  }

  const drive = await createDriveClient();

  try {
    const response = await drive.files.get({ fileId: folderId, fields: 'id, name, mimeType' });
    if (response.data.mimeType !== 'application/vnd.google-apps.folder') {
      throw new Error('Provided Google Drive folder ID is not a folder.');
    }
    return response.data;
  } catch (error) {
    if (error.code === 404) {
      throw new Error('Google Drive folder not found. Verify GOOGLE_DRIVE_FOLDER_ID.');
    }
    throw error;
  }
}


