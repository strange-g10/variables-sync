#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Google Sheets Export endpoint
app.post('/export-to-sheets', async (req, res) => {
  try {
    console.log('Received export request');
    
    const { variables, spreadsheet_id, service_account } = req.body;
    
    if (!variables || !spreadsheet_id || !service_account) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: variables, spreadsheet_id, or service_account'
      });
    }

    console.log(`Processing export for spreadsheet: ${spreadsheet_id}`);
    console.log(`Collections to export: ${Object.keys(variables).join(', ')}`);

    // Use direct API approach
    await handleDirectAPIExport(variables, spreadsheet_id, service_account);
    
    res.json({
      success: true,
      message: 'Data exported successfully to Google Sheets via direct API'
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Direct API export using Service Account
async function handleDirectAPIExport(variables, spreadsheetId, serviceAccount) {
  console.log('Using direct API export...');
  
  // Get access token using service account
  const accessToken = await getAccessTokenFromServiceAccount(serviceAccount);
  
  // Process each collection
  for (const [collectionName, sheetData] of Object.entries(variables)) {
    await createOrUpdateSheet(spreadsheetId, collectionName, sheetData, accessToken);
  }
}

// Get access token from service account
async function getAccessTokenFromServiceAccount(serviceAccount) {
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
    const errorData = await response.text();
    throw new Error(`Failed to get access token: ${response.status} ${response.statusText} - ${errorData}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Create or update sheet with data
async function createOrUpdateSheet(spreadsheetId, sheetName, sheetData, accessToken) {
  console.log(`Processing sheet: ${sheetName} with ${sheetData.length} rows`);
  
  // Get existing sheets
  const metadataResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (!metadataResponse.ok) {
    const errorData = await metadataResponse.text();
    throw new Error(`Failed to get spreadsheet metadata: ${metadataResponse.status} - ${errorData}`);
  }
  
  const metadata = await metadataResponse.json();
  const existingSheet = metadata.sheets?.find(s => s.properties.title === sheetName);
  
  let sheetId;
  
  if (!existingSheet) {
    // Create new sheet
    console.log(`Creating new sheet: ${sheetName}`);
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
    
    if (!addSheetResponse.ok) {
      const errorData = await addSheetResponse.text();
      throw new Error(`Failed to create sheet: ${addSheetResponse.status} - ${errorData}`);
    }
    
    const addSheetResult = await addSheetResponse.json();
    sheetId = addSheetResult.replies[0].addSheet.properties.sheetId;
  } else {
    sheetId = existingSheet.properties.sheetId;
    console.log(`Using existing sheet: ${sheetName} (ID: ${sheetId})`);
  }
  
  // Clear existing data first
  const clearResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}:clear`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!clearResponse.ok) {
    console.warn(`Failed to clear sheet ${sheetName}, continuing anyway...`);
  }
  
  // Update sheet data
  const updateResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: sheetData
    })
  });
  
  if (!updateResponse.ok) {
    const errorData = await updateResponse.text();
    throw new Error(`Failed to update sheet data: ${updateResponse.status} - ${errorData}`);
  }
  
  console.log(`✅ Updated sheet: ${sheetName} with ${sheetData.length} rows`);
  
  // Apply basic formatting
  try {
    await applyBasicFormatting(spreadsheetId, sheetId, sheetData, accessToken);
  } catch (formattingError) {
    console.warn(`Failed to apply formatting to ${sheetName}:`, formattingError.message);
  }
}

// Apply basic formatting to the sheet
async function applyBasicFormatting(spreadsheetId, sheetId, sheetData, accessToken) {
  const requests = [
    // Freeze header row
    {
      updateSheetProperties: {
        properties: {
          sheetId: sheetId,
          gridProperties: {
            frozenRowCount: 1,
            frozenColumnCount: 3
          }
        },
        fields: "gridProperties.frozenRowCount,gridProperties.frozenColumnCount"
      }
    },
    // Bold header row
    {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: sheetData[0]?.length || 10
        },
        cell: {
          userEnteredFormat: {
            textFormat: {
              bold: true
            },
            backgroundColor: {
              red: 0.9,
              green: 0.9,
              blue: 0.9
            }
          }
        },
        fields: "userEnteredFormat(textFormat,backgroundColor)"
      }
    }
  ];
  
  const formatResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requests })
  });
  
  if (formatResponse.ok) {
    console.log(`Applied formatting to sheet ID: ${sheetId}`);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
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

module.exports = app;
