/**
 * ========================================
 * MEA MAIN - GOOGLE APPS SCRIPT BACKEND
 * ========================================
 * CORRECTED VERSION - Matches Sheet1 column structure
 * UPDATED: January 16, 2026
 * Spreadsheet ID: 1h5lTyYvmkbnUbKj77yyQb6RgRYzxBHpXTGvaSRMEw2s
 * 
 * SHEET STRUCTURE:
 * A=Timestamp, B=Name, C=Phone, D=Email, E=Bust, F=Natural Waist,
 * G=Pant Waist, H=Hip, I=Thigh, J=Jacket Length, K=Jacket Width,
 * L=Pants Length, M=Pants Width, N=Jacket Size, O=Pants Size
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    Logger.log('========== NEW REQUEST ==========');
    
    // --- STEP 1: Parse incoming data ---
    let inputData = {};
    if (e.postData && e.postData.contents) {
      try {
        inputData = JSON.parse(e.postData.contents);
      } catch (err) {
        Logger.log('No JSON body');
      }
    }
    if (e.parameter) {
      for (const key in e.parameter) {
        if (e.parameter[key]) inputData[key] = e.parameter[key];
      }
    }
    
    const data = {
      name: inputData.name || '',
      phone: inputData.phone || '',
      email: inputData.email || '',
      bust: inputData.bust || '',
      naturalWaist: inputData.naturalWaist || '',
      pantWaist: inputData.pantWaist || '',
      hip: inputData.hip || '',
      thigh: inputData.thigh || '',
      jacketLengthPreference: inputData.jacketLengthPreference || inputData.jacketLength || '',
      jacketWidthPreference: inputData.jacketWidthPreference || inputData.jacketWidth || '',
      pantsLengthPreference: inputData.pantsLengthPreference || inputData.pantsLength || '',
      pantsWidthPreference: inputData.pantsWidthPreference || inputData.pantsWidth || '',
      type: inputData.type || ''
    };

    Logger.log('Parsed data: ' + JSON.stringify(data));

    // --- STEP 2: OPEN MEA SPREADSHEET ---
    const SPREADSHEET_ID = '1h5lTyYvmkbnUbKj77yyQb6RgRYzxBHpXTGvaSRMEw2s';
    const TARGET_SHEET_NAME = 'Mea'; 
    
    Logger.log('Opening spreadsheet ID: ' + SPREADSHEET_ID);
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    Logger.log('Looking for sheet tab: "' + TARGET_SHEET_NAME + '"');
    let sheet = spreadsheet.getSheetByName(TARGET_SHEET_NAME);
    
    // Safety check: If "Sheet1" tab doesn't exist, log what DOES exist
    if (!sheet) {
      const allSheets = spreadsheet.getSheets();
      const sheetNames = allSheets.map(s => s.getName()).join(', ');
      throw new Error(`CRITICAL ERROR: Sheet tab "${TARGET_SHEET_NAME}" not found. Available tabs: ${sheetNames}`);
    }
    
    Logger.log('Successfully accessed sheet: ' + sheet.getName());
    
    // --- STEP 3: PROCESS DATA ---
    const isMeasurementUpdate = (data.bust && data.bust !== '');
    
    if (isMeasurementUpdate) {
      Logger.log('Processing measurement update for email: ' + data.email);
      
      // Calculate sizes
      const jacketSize = calculateJacketSize(data);
      const pantSize = calculatePantSize(data);
      
      Logger.log('Calculated Jacket Size: ' + jacketSize);
      Logger.log('Calculated Pant Size: ' + pantSize);
      
      // Check for existing email to update row instead of duplicating
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      let rowFound = false;
      let rowIndex = -1;
      
      // CORRECTED: Email is in Column D (index 3)
      for (let i = 1; i < values.length; i++) {
        const sheetEmail = String(values[i][3]).trim().toLowerCase(); // Column D (index 3)
        const searchEmail = String(data.email).trim().toLowerCase();
        
        if (sheetEmail === searchEmail) {
          rowIndex = i + 1; // Convert to 1-indexed for getRange
          rowFound = true;
          
          // Preserve existing name/phone if not provided in update
          if (!data.name && values[i][1]) data.name = values[i][1];   // Column B (index 1)
          if (!data.phone && values[i][2]) data.phone = values[i][2]; // Column C (index 2)
          
          Logger.log('Found existing row at index: ' + rowIndex);
          break;
        }
      }
      
      if (rowFound) {
        Logger.log('Updating existing row ' + rowIndex);
        
        // Update existing row - CORRECTED column positions
        sheet.getRange(rowIndex, 2).setValue(data.name || 'Mea Customer'); // B: Name
        sheet.getRange(rowIndex, 3).setValue(data.phone);                  // C: Phone
        sheet.getRange(rowIndex, 4).setValue(data.email);                  // D: Email
        sheet.getRange(rowIndex, 5).setValue(data.bust);                   // E: Bust
        sheet.getRange(rowIndex, 6).setValue(data.naturalWaist);           // F: Natural Waist
        sheet.getRange(rowIndex, 7).setValue(data.pantWaist);              // G: Pant Waist
        sheet.getRange(rowIndex, 8).setValue(data.hip);                    // H: Hip
        sheet.getRange(rowIndex, 9).setValue(data.thigh);                  // I: Thigh
        sheet.getRange(rowIndex, 10).setValue(data.jacketLengthPreference); // J: Jacket Length
        sheet.getRange(rowIndex, 11).setValue(data.jacketWidthPreference);  // K: Jacket Width
        sheet.getRange(rowIndex, 12).setValue(data.pantsLengthPreference);  // L: Pants Length
        sheet.getRange(rowIndex, 13).setValue(data.pantsWidthPreference);   // M: Pants Width
        sheet.getRange(rowIndex, 14).setValue(jacketSize);                 // N: Jacket Size
        sheet.getRange(rowIndex, 15).setValue(pantSize);                   // O: Pant Size
        
        Logger.log('Row updated successfully');
      } else {
        Logger.log('No existing row found, appending new row');
        
        // Append new row - CORRECTED column order
        sheet.appendRow([
          new Date(),                    // A: Timestamp
          data.name || 'Mea Customer',   // B: Name
          data.phone,                    // C: Phone
          data.email,                    // D: Email
          data.bust,                     // E: Bust
          data.naturalWaist,             // F: Natural Waist
          data.pantWaist,                // G: Pant Waist
          data.hip,                      // H: Hip
          data.thigh,                    // I: Thigh
          data.jacketLengthPreference,   // J: Jacket Length
          data.jacketWidthPreference,    // K: Jacket Width
          data.pantsLengthPreference,    // L: Pants Length
          data.pantsWidthPreference,     // M: Pants Width
          jacketSize,                    // N: Jacket Size
          pantSize                       // O: Pant Size
        ]);
        
        Logger.log('New measurement row appended');
      }
      
      // Send measurement confirmation email
      try { 
        sendMeasurementEmail(data, jacketSize, pantSize); 
        Logger.log('Measurement email sent successfully');
      } catch (emailErr) { 
        Logger.log('Email error: ' + emailErr.toString()); 
      }

    } else {
      // CONTACT FORM SUBMISSION
      Logger.log('Processing contact form submission');
      
      // CORRECTED: Append with correct column order
      sheet.appendRow([
        new Date(),   // A: Timestamp
        data.name,    // B: Name
        data.phone,   // C: Phone
        data.email,   // D: Email
        '',           // E: Bust (empty)
        '',           // F: Natural Waist (empty)
        '',           // G: Pant Waist (empty)
        '',           // H: Hip (empty)
        '',           // I: Thigh (empty)
        '',           // J: Jacket Length (empty)
        '',           // K: Jacket Width (empty)
        '',           // L: Pants Length (empty)
        '',           // M: Pants Width (empty)
        '',           // N: Jacket Size (empty)
        ''            // O: Pant Size (empty)
      ]);
      
      Logger.log('Contact form data appended');
      
      // Send contact confirmation email
      try { 
        sendContactConfirmationEmail(data); 
        Logger.log('Contact confirmation email sent successfully');
      } catch (emailErr) { 
        Logger.log('Email error: ' + emailErr.toString()); 
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'success', 
      'sheet': TARGET_SHEET_NAME,
      'type': isMeasurementUpdate ? 'measurement' : 'contact'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    Logger.log('ERROR: ' + e.toString());
    Logger.log('Stack trace: ' + e.stack);
    return ContentService.createTextOutput(JSON.stringify({
      'result': 'error', 
      'error': e.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Mea Main API Active - Sheet1 Configured');
}

// --- HELPER FUNCTIONS ---

function calculateJacketSize(data) {
  const bust = parseFloat(data.bust);
  if (isNaN(bust)) return 'N/A';
  let baseSize = Math.round(bust / 2) * 2;
  return baseSize + ' ' + (data.jacketLengthPreference || '') + ', ' + (data.jacketWidthPreference || '');
}

function calculatePantSize(data) {
  const waist = parseFloat(data.pantWaist);
  if (isNaN(waist)) return 'N/A';
  let baseSize = Math.round(waist / 2) * 2;
  return baseSize + ' ' + (data.pantsLengthPreference || '') + ', ' + (data.pantsWidthPreference || '');
}

function sendContactConfirmationEmail(data) {
  if (!data.email) {
    Logger.log('No email provided for contact confirmation');
    return;
  }
  
  const firstName = (data.name || 'Friend').split(' ')[0];
  const measurementUrl = 'https://measuit.com/size_finder_tool.html?email=' + encodeURIComponent(data.email);
  const subject = 'Next Step: Complete your measurement profile';
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffe8e2; font-family: 'Helvetica Neue', Arial, sans-serif;">
      <div style="padding: 50px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <h1 style="font-family: Georgia, serif; font-size: 28px; color: #111; margin-top: 0;">Welcome to Mea</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Hi ${firstName},</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Thanks for your interest in Mea. Please click the button below to complete your measurement profile and find your perfect size.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${measurementUrl}" style="display: inline-block; background: #ffb6a3; color: #111; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">Find Your Size</a>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 30px;">Best,<br><strong style="color: #111;">The Mea Team</strong></p>
        </div>
      </div>
    </body>
    </html>`;
    
  GmailApp.sendEmail(data.email, subject, 'Please view HTML version', {
    from: 'brandon@measuit.com', 
    name: 'Brandon from Mea', 
    htmlBody: htmlBody
  });
  
  Logger.log('Contact confirmation email sent to: ' + data.email);
}

function sendMeasurementEmail(data, jacketSize, pantSize) {
  if (!data.email) {
    Logger.log('No email provided for measurement confirmation');
    return;
  }
  
  const firstName = (data.name || 'Friend').split(' ')[0];
  const subject = 'Your Mea Size Recommendation';
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #ffe8e2; font-family: 'Helvetica Neue', Arial, sans-serif;">
      <div style="padding: 50px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <h1 style="font-family: Georgia, serif; font-size: 28px; color: #111; margin-top: 0;">Your Size Recommendation</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Hi ${firstName},</p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Based on your measurements, here are your recommended sizes:</p>
          
          <div style="background: #fff8f6; border: 1px solid #ffe8e2; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #ffe8e2;">
              <p style="margin: 0; font-size: 14px; color: #777; text-transform: uppercase; letter-spacing: 1px;">Jacket Size</p>
              <p style="margin: 8px 0 0 0; font-size: 22px; color: #111; font-weight: 600;">${jacketSize}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 14px; color: #777; text-transform: uppercase; letter-spacing: 1px;">Pant Size</p>
              <p style="margin: 8px 0 0 0; font-size: 22px; color: #111; font-weight: 600;">${pantSize}</p>
            </div>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">Save this email for when our sale drops!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://measuit.com/size_chart.html" style="display: inline-block; background: #ffb6a3; color: #111; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">View Size Chart</a>
          </div>
          
          <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 30px;">Best,<br><strong style="color: #111;">The Mea Team</strong></p>
        </div>
      </div>
    </body>
    </html>`;
    
  GmailApp.sendEmail(data.email, subject, 'Please view HTML version', {
    from: 'brandon@measuit.com', 
    name: 'Brandon from Mea', 
    htmlBody: htmlBody
  });
  
  Logger.log('Measurement confirmation email sent to: ' + data.email);
}
