#!/usr/bin/env node

import express, { Request, Response } from 'express';
import cors from 'cors';
import { writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Google Sheets Export endpoint
app.post('/export-to-sheets', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Received export request');
    
    const { variables, spreadsheet_id, service_account } = req.body;
    
    if (!variables || !spreadsheet_id || !service_account) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: variables, spreadsheet_id, or service_account'
      });
      return;
    }

    // Create temporary directories
    const tempDir = path.join(process.cwd(), 'temp');
    const credentialsPath = path.join(tempDir, 'credentials.json');
    const dataPath = path.join(tempDir, 'processed_data.json');
    
    try {
      mkdirSync(tempDir, { recursive: true });
    } catch (err) {
      // Directory already exists
    }

    // Write service account credentials to file
    writeFileSync(credentialsPath, JSON.stringify(service_account, null, 2));
    
    // Write processed data to file
    const processedData = {
      variables,
      spreadsheet_id
    };
    writeFileSync(dataPath, JSON.stringify(processedData, null, 2));

    console.log(`Processing export for spreadsheet: ${spreadsheet_id}`);
    console.log(`Collections to export: ${Object.keys(variables).join(', ')}`);

    // Execute the Python setup_sheets script using the temp files
    const pythonScriptPath = path.join(process.cwd(), '../../scripts/setup_sheets.py');
    const configScriptPath = path.join(process.cwd(), '../../scripts/process_data.py');
    
    // Set environment variables for the Python scripts
    const env = {
      ...process.env,
      GOOGLE_APPLICATION_CREDENTIALS: credentialsPath,
      PROCESSED_DATA_PATH: dataPath
    };

    try {
      // Execute setup_sheets.py with the temporary data
      const result = execSync(`python3 "${pythonScriptPath}"`, {
        env,
        cwd: path.join(process.cwd(), '../../'),
        encoding: 'utf8',
        timeout: 60000 // 60 second timeout
      });
      
      console.log('Python script execution result:', result);
      
      res.json({
        success: true,
        message: 'Data exported successfully to Google Sheets',
        details: result
      });
      return;
      
    } catch (pythonError: any) {
      console.error('Python script error:', pythonError.message);
      
      // Try alternative approach using direct API calls
      await handleDirectAPIExport(variables, spreadsheet_id, service_account);
      
      res.json({
        success: true,
        message: 'Data exported successfully to Google Sheets via direct API'
      });
      return;
    }

    // Clean up temp files
    try {
      const fs = require('fs');
      fs.unlinkSync(credentialsPath);
      fs.unlinkSync(dataPath);
    } catch (cleanupError) {
      console.warn('Failed to clean up temp files:', cleanupError);
    }

  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
    return;
  }
});

// Direct API export using Service Account (fallback method)
async function handleDirectAPIExport(variables: any, spreadsheetId: string, serviceAccount: any) {
  console.log('Using direct API export...');
  
  // This is a simplified implementation
  // In production, you would implement the full Google Sheets API logic here
  
  // Get access token using service account
  const accessToken = await getAccessTokenFromServiceAccount(serviceAccount);
  
  // Process each collection
  for (const [collectionName, sheetData] of Object.entries(variables)) {
    await createOrUpdateSheet(spreadsheetId, collectionName, sheetData as any[][], accessToken);
  }
}

// Get access token from service account
async function getAccessTokenFromServiceAccount(serviceAccount: any): Promise<string> {
  const jwt = require('jsonwebtoken');
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const token = jwt.sign(payload, serviceAccount.private_key, { algorithm: 'RS256' });
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: token
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Create or update sheet with data
async function createOrUpdateSheet(spreadsheetId: string, sheetName: string, sheetData: any[][], accessToken: string) {
  // Get existing sheets
  const metadataResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const metadata = await metadataResponse.json();
  const existingSheet = metadata.sheets?.find((s: any) => s.properties.title === sheetName);
  
  let sheetId: number;
  
  if (!existingSheet) {
    // Create new sheet
    const addSheetResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{
          addSheet: {
            properties: {
              title: sheetName
            }
          }
        }]
      })
    });
    
    const addSheetResult = await addSheetResponse.json();
    sheetId = addSheetResult.replies[0].addSheet.properties.sheetId;
  } else {
    sheetId = existingSheet.properties.sheetId;
  }
  
  // Update sheet data
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:ZZ?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: sheetData
    })
  });
  
  console.log(`Updated sheet: ${sheetName} with ${sheetData.length} rows`);
}

// Health check endpoint
app.get('/health', (req: Request, res: Response): void => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'figma-variables-sync-http-server'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Figma Variables Sync HTTP Server running on http://localhost:${PORT}`);
  console.log(`📊 Google Sheets export endpoint: http://localhost:${PORT}/export-to-sheets`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
});

export default app;
