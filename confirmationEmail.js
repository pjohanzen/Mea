// Google Apps Script for Mea Lead Capture
// This script receives form data and saves it to Google Sheets

function doPost(e) {
  try {
    // Log the incoming request for debugging
    Logger.log('Received POST request');
    
    // Initialize input data object
    let inputData = {};
    
    // 1. Try to parse JSON body (for fetch with application/json)
    if (e.postData && e.postData.contents) {
      try {
        const jsonContent = JSON.parse(e.postData.contents);
        inputData = { ...jsonContent };
        Logger.log('Parsed JSON body: ' + JSON.stringify(inputData));
      } catch (err) {
        Logger.log('Body was not valid JSON');
      }
    }
    
    // 2. Merge/Overwrite with parameters (for FormData or URL encoded)
    if (e.parameter) {
      Logger.log('Parameters received: ' + JSON.stringify(e.parameter));
      // Only merge keys that have values
      for (const key in e.parameter) {
        if (e.parameter[key]) {
          inputData[key] = e.parameter[key];
        }
      }
    }
    
    // Check if we have any data
    if (Object.keys(inputData).length === 0) {
      Logger.log('No data received (empty JSON and empty parameters)');
      return ContentService.createTextOutput(JSON.stringify({
        'status': 'error',
        'message': 'No data received'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Normalize data to expected structure matching Google Sheet headers exactly
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
      pantsWidthPreference: inputData.pantsWidthPreference || inputData.pantsWidth || ''
    };
    
    Logger.log('Parsed data: ' + JSON.stringify(data));
    
    // Get the specific spreadsheet by ID and the Sheet1 tab
    const spreadsheet = SpreadsheetApp.openById('1h5lTyYvmkbnUbKj77yyQb6RgRYzxBHpXTGvaSRMEw2s');
    const sheet = spreadsheet.getSheetByName('Sheet1');
    
    if (!sheet) {
      Logger.log('Sheet not found');
      throw new Error('Sheet1 not found');
    }
    
    Logger.log('Got sheet: ' + sheet.getName());
    
    // Check if this is a measurement update (has bust measurement)
    // Simplified logic: if bust is present, it MUST be a measurement update because contact form doesn't have this field
    const isMeasurementUpdate = data.email && data.bust && data.bust !== '';
    
    Logger.log('DECISION LOGIC:');
    Logger.log('data.email: ' + data.email);
    Logger.log('data.bust: "' + data.bust + '"');
    Logger.log('isMeasurementUpdate result: ' + isMeasurementUpdate);
    
    if (isMeasurementUpdate) {
      // Find existing row by email and update measurements
      Logger.log('This is a measurement update for email: ' + data.email);
      
      // Calculate sizes first so we can save them
      const jacketSize = calculateJacketSize(data);
      const pantSize = calculatePantSize(data);
      Logger.log('Calculated Jacket Size: ' + jacketSize);
      Logger.log('Calculated Pant Size: ' + pantSize);
      
      const emailColumn = 4; // Column D (Email)
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      
      Logger.log('Total rows in sheet: ' + values.length);
      Logger.log('Searching for email in column ' + emailColumn);
      
      let rowFound = false;
      let rowIndex = -1;
      
      for (let i = 1; i < values.length; i++) { // Start at 1 to skip header
        const emailInSheet = String(values[i][emailColumn - 1]).trim().toLowerCase();
        const searchEmail = String(data.email).trim().toLowerCase();
        
        Logger.log('Row ' + (i + 1) + ' email: "' + emailInSheet + '" vs search: "' + searchEmail + '"');
        
        if (emailInSheet === searchEmail) {
          Logger.log('MATCH FOUND at row ' + (i + 1));
          rowIndex = i + 1;
          
          // Get existing name and phone from the row
          const existingName = String(values[i][1]).trim(); // Column B (Name)
          const existingPhone = String(values[i][2]).trim(); // Column C (Phone)
          
          Logger.log('Updating measurements...');
          Logger.log('Raw Name from sheet: "' + values[i][1] + '" (type: ' + typeof values[i][1] + ')');
          Logger.log('Raw Phone from sheet: "' + values[i][2] + '" (type: ' + typeof values[i][2] + ')');
          Logger.log('Processed Name: "' + existingName + '"');
          Logger.log('Processed Phone: "' + existingPhone + '"');
          Logger.log('Bust: ' + data.bust);
          Logger.log('Natural Waist: ' + data.naturalWaist);
          Logger.log('Pant Waist: ' + data.pantWaist);
          Logger.log('Hip: ' + data.hip);
          Logger.log('Thigh: ' + data.thigh);
          Logger.log('Jacket Length Pref: ' + data.jacketLengthPreference);
          Logger.log('Jacket Width Pref: ' + data.jacketWidthPreference);
          Logger.log('Pants Length Pref: ' + data.pantsLengthPreference);
          Logger.log('Pants Width Pref: ' + data.pantsWidthPreference);
          
          // Update measurement columns (E through M) - matching your sheet structure
          sheet.getRange(rowIndex, 5).setValue(data.bust); // E: Bust (inches)
          sheet.getRange(rowIndex, 6).setValue(data.naturalWaist); // F: Natural Waist (inches)
          sheet.getRange(rowIndex, 7).setValue(data.pantWaist); // G: Pant Waist (Mid Rise) (inches)
          sheet.getRange(rowIndex, 8).setValue(data.hip); // H: Hip (inches)
          sheet.getRange(rowIndex, 9).setValue(data.thigh); // I: Thigh (inches)
          sheet.getRange(rowIndex, 10).setValue(data.jacketLengthPreference); // J: Jacket Length Preference
          sheet.getRange(rowIndex, 11).setValue(data.jacketWidthPreference); // K: Jacket Width Preference
          sheet.getRange(rowIndex, 12).setValue(data.pantsLengthPreference); // L: Pants Length Preference
          sheet.getRange(rowIndex, 13).setValue(data.pantsWidthPreference); // M: Pants Width Preference
          
          // Save calculated sizes to columns N and O
          sheet.getRange(rowIndex, 14).setValue(jacketSize); // N: Jacket Size
          sheet.getRange(rowIndex, 15).setValue(pantSize); // O: Pant Size
          
          // Update data object with existing name and phone for email - with validation
          if (existingName && existingName !== 'undefined' && existingName.length > 0) {
            data.name = existingName;
            Logger.log('Using existing name from sheet: "' + data.name + '"');
          } else {
            data.name = 'Mea Customer';
            Logger.log('Name from sheet was invalid, using fallback: "' + data.name + '"');
          }
          
          if (existingPhone && existingPhone !== 'undefined' && existingPhone.length > 0) {
            data.phone = existingPhone;
            Logger.log('Using existing phone from sheet: "' + data.phone + '"');
          } else {
            data.phone = '';
            Logger.log('Phone from sheet was invalid, using empty string');
          }
          
          Logger.log('Final data.name for email: "' + data.name + '"');
          Logger.log('Final data.phone for email: "' + data.phone + '"');
          Logger.log('Measurements updated successfully at row ' + rowIndex);
          rowFound = true;
          break;
        }
      }
      
      if (!rowFound) {
        Logger.log('Email "' + data.email + '" not found in sheet. Appending new row with measurements.');
        
        // If name is missing (because row wasn't found), try to use a fallback or extract from email
        if (!data.name || data.name === '') {
          data.name = 'Mea Customer'; // Fallback name
          Logger.log('Using fallback name: ' + data.name);
        }
        
        const rowData = [
          new Date(), // Timestamp (A)
          data.name, // Name (B)
          data.phone, // Phone (C)
          data.email, // Email (D)
          data.bust, // Bust (inches) (E)
          data.naturalWaist, // Natural Waist (inches) (F)
          data.pantWaist, // Pant Waist (Mid Rise) (inches) (G)
          data.hip, // Hip (inches) (H)
          data.thigh, // Thigh (inches) (I)
          data.jacketLengthPreference, // Jacket Length Preference (J)
          data.jacketWidthPreference, // Jacket Width Preference (K)
          data.pantsLengthPreference, // Pants Length Preference (L)
          data.pantsWidthPreference, // Pants Width Preference (M)
          jacketSize, // Jacket Size (N)
          pantSize // Pant Size (O)
        ];
        
        Logger.log('Row data to append: ' + JSON.stringify(rowData));
        sheet.appendRow(rowData);
        Logger.log('Measurement data appended as new row successfully');
      }
      
      // Calculate sizes and send measurement confirmation email
      Logger.log('========================================');
      Logger.log('MEASUREMENT UPDATE: Preparing to send email');
      Logger.log('========================================');
      Logger.log('Row found in sheet: ' + rowFound);
      Logger.log('Data for email - Name: "' + data.name + '", Email: "' + data.email + '", Phone: "' + data.phone + '"');
      Logger.log('Bust: ' + data.bust + ', Natural Waist: ' + data.naturalWaist + ', Pant Waist: ' + data.pantWaist);
      
      try {
        // Sizes already calculated above
        Logger.log('About to call sendMeasurementEmail...');
        
        sendMeasurementEmail(data, jacketSize, pantSize);
        
        Logger.log('✓✓✓ sendMeasurementEmail call completed successfully ✓✓✓');
      } catch (emailError) {
        Logger.log('✗✗✗ CRITICAL ERROR in measurement email section: ' + emailError.toString());
        Logger.log('Error stack: ' + emailError.stack);
        throw emailError;
      }
      
    } else {
      // This is a new contact submission
      Logger.log('This is a new contact submission');
      
      const rowData = [
        new Date(), // Timestamp (A)
        data.name, // Name (B)
        data.phone, // Phone (C)
        data.email, // Email (D)
        data.bust, // Bust (inches) (E) - will be empty for contact form
        data.naturalWaist, // Natural Waist (inches) (F)
        data.pantWaist, // Pant Waist (Mid Rise) (inches) (G)
        data.hip, // Hip (inches) (H)
        data.thigh, // Thigh (inches) (I)
        data.jacketLengthPreference, // Jacket Length Preference (J)
        data.jacketWidthPreference, // Jacket Width Preference (K)
        data.pantsLengthPreference, // Pants Length Preference (L)
        data.pantsWidthPreference // Pants Width Preference (M)
      ];
      
      Logger.log('Row data to append: ' + JSON.stringify(rowData));
      sheet.appendRow(rowData);
      Logger.log('Contact data appended successfully');
      
      // Send confirmation email with link to measurement page
      sendContactConfirmationEmail(data);
    }
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'success',
      'message': 'Data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Log and return error
    Logger.log('Error: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Send confirmation email after contact form submission
function sendContactConfirmationEmail(data) {
  try {
    const recipientEmail = data.email;
    const recipientName = data.name;
    const recipientPhone = data.phone;
    
    // Extract first name for the greeting
    const firstName = recipientName.split(' ')[0];
    
    const subject = 'Next Step: Complete your measurement profile';
    
    // Create the measurement page URL with email parameter
    const measurementUrl = 'https://measuit.com/size_finder_tool.html?email=' + encodeURIComponent(recipientEmail);
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 2px;
            overflow: hidden;
            box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05);
          }
          .header {
            background: #ffffff;
            padding: 48px 40px 24px;
            text-align: center;
          }
          .logo {
            max-width: 120px;
            height: auto;
            margin: 0 auto;
            display: block;
          }
          .content {
            padding: 24px 48px 48px;
            text-align: center;
          }
          h2 {
            color: #111111;
            font-size: 26px;
            font-weight: 400;
            margin-top: 0;
            margin-bottom: 16px;
            letter-spacing: -0.5px;
          }
          p {
            margin: 0 0 24px;
            color: #555555;
            font-size: 16px;
            line-height: 1.8;
          }
          .info-box {
            background-color: #fff8f6;
            border: 1px solid #ffe8e2;
            border-radius: 12px;
            padding: 32px;
            margin: 32px 0;
            text-align: left;
          }
          .info-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #999999;
            font-weight: 600;
            margin-bottom: 20px;
            border-bottom: 1px solid #ffe8e2;
            padding-bottom: 12px;
          }
          .info-item {
            margin-bottom: 12px;
            font-size: 15px;
            color: #333;
            display: flex;
            align-items: baseline;
          }
          .info-item:last-child {
            margin-bottom: 0;
          }
          .info-label {
            font-weight: 600;
            color: #111;
            width: 70px;
            flex-shrink: 0;
            font-size: 14px;
          }
          .cta-container {
            text-align: center;
            margin: 40px 0;
          }
          .cta-button {
            display: inline-block;
            background-color: #ffb6a3;
            color: #111111;
            padding: 18px 42px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 500;
            font-size: 15px;
            letter-spacing: 0.5px;
            transition: all 0.2s;
            box-shadow: 0 4px 15px rgba(255, 182, 163, 0.4);
          }
          .cta-button:hover {
            background-color: #ff9e85;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 182, 163, 0.5);
          }
          .footer {
            background-color: #ffffff;
            padding: 40px;
            text-align: center;
            font-size: 13px;
            color: #999999;
            border-top: 1px solid #f5f5f5;
          }
          .footer a {
            color: #555555;
            text-decoration: none;
            margin: 0 10px;
            transition: color 0.2s;
            font-weight: 500;
          }
          .footer a:hover {
            color: #ffb6a3;
          }
          .social-links {
            margin-top: 20px;
          }
          .contact-link {
            color: #ffb6a3;
            text-decoration: none;
            border-bottom: 1px solid rgba(255, 182, 163, 0.5);
            transition: border-color 0.2s;
          }
          .contact-link:hover {
            border-bottom-color: #ffb6a3;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://measuit.com/logo.png" alt="Mea" class="logo">
          </div>
          
          <div class="content">
            <h2>Hi ${firstName}</h2>
            
            <p>Thanks for signing up!</p>
            
            <div class="info-box">
              <div class="info-title">Your Details</div>
              <div class="info-item">
                <span class="info-label">Name:</span> <span>${recipientName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span> <span>${recipientEmail}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Phone:</span> <span>${recipientPhone}</span>
              </div>
            </div>

            <p>We'll keep your contact information on file for our upcoming giveaways and sales!</p>

            <p style="font-size: 14px; color: #777;">
              If any of this information is incorrect, please email us at <a href="mailto:brandon@measuit.com" class="contact-link">brandon@measuit.com</a>.
            </p>
            
            <p style="margin-top: 32px;">To place an order, you’ll need to know your size.</p>
            
            <p>Use the link below to find your size. It only takes a minute!</p>
            
            <div class="cta-container">
              <a href="${measurementUrl}" class="cta-button">Mea Size Finder Tool</a>
            </div>
          </div>
          
          <div style="background-color: #e5e5e5; padding: 40px 40px; text-align: left; color: #666666; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <div style="font-family: 'Brush Script MT', cursive; font-size: 24px; margin-bottom: 24px; color: #333;">mea</div>
            
            <div style="font-size: 12px; letter-spacing: 1px; line-height: 2; font-weight: 600; color: #666; text-transform: uppercase;">
              EMAIL: <a href="mailto:hello@measuit.com" style="color: #666; text-decoration: underline;">hello@measuit.com</a><br>
              PHONE: 801 754 4336
            </div>
            
            <div style="margin-top: 24px; font-size: 12px; letter-spacing: 1px; color: #666; text-transform: uppercase;">
              © 2025 MEA | ALL RIGHTS RESERVED
            </div>
            
            <div style="margin-top: 24px;">
              <a href="https://www.linkedin.com/company/measuit" style="text-decoration: none; margin-right: 16px; display: inline-block;">
                <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" width="24" height="24" alt="LinkedIn" style="vertical-align: middle; opacity: 0.6;">
              </a>
              <a href="https://www.instagram.com/meafdsuit/" style="text-decoration: none; margin-right: 16px; display: inline-block;">
                <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" width="24" height="24" alt="Instagram" style="vertical-align: middle; opacity: 0.6;">
              </a>
              <a href="https://www.facebook.com/people/Mea/61585207431538/" style="text-decoration: none; display: inline-block;">
                <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" width="24" height="24" alt="Facebook" style="vertical-align: middle; opacity: 0.6;">
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const plainBody = `
Hi ${firstName}!

Thanks for signing up!

Your Details
Name: ${recipientName}
Email: ${recipientEmail}
Phone: ${recipientPhone}

If any of this information is incorrect, please email us at brandon@measuit.com.

Mea Size Finder Tool: ${measurementUrl}

Mea
Visit our website: https://measuit.com
LinkedIn: https://www.linkedin.com/company/measuit
Instagram: https://www.instagram.com/meafdsuit/
Facebook: https://www.facebook.com/people/Mea/61585207431538/
    `;
    
    GmailApp.sendEmail(
      recipientEmail,
      subject,
      plainBody,
      {
        from: 'brandon@measuit.com',
        name: 'Brandon from Mea',
        htmlBody: htmlBody,
        replyTo: 'brandon@measuit.com'
      }
    );
    Logger.log('Contact confirmation email sent to: ' + recipientEmail);
  } catch (error) {
    Logger.log('Error sending contact confirmation email: ' + error.toString());
  }
}

// Send welcome email after contact form submission
function sendWelcomeEmail(data) {
  try {
    const recipientEmail = data.email;
    const recipientName = data.name;
    
    const subject = 'Welcome to Mea - Your Entry is Confirmed! 🎉';
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #ff8b66 0%, #ff9770 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 300;
          }
          .content {
            background: #fff;
            padding: 30px 20px;
            border: 1px solid #e0e0e0;
          }
          .content h2 {
            color: #ff8b66;
            font-size: 22px;
            margin-top: 0;
          }
          .content p {
            margin: 15px 0;
          }
          .perks {
            background: #fff8f6;
            padding: 20px;
            border-left: 4px solid #ff8b66;
            margin: 20px 0;
          }
          .perks ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .perks li {
            margin: 10px 0;
          }
          .cta-button {
            display: inline-block;
            background: #ff8b66;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: 600;
          }
          .footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
            border-radius: 0 0 10px 10px;
          }
          .footer a {
            color: #ff8b66;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to Mea</h1>
        </div>
        
        <div class="content">
          <h2>Hi ${recipientName}!</h2>
          
          <p>Thank you for joining our launch giveaway! Your early entry has been confirmed.</p>
          
          <div class="perks">
            <strong>Here's what you can look forward to:</strong>
            <ul>
              <li>✓ First access to earn extra entries when our giveaway launches in January 2026</li>
              <li>✓ Skip the line for our launch sale</li>
              <li>✓ Access to our Size Finder tool</li>
            </ul>
          </div>
          
          <p>We're creating the first suit designed specifically for female funeral directors - with real pockets, durable stretch fabric, and custom sizing that actually works.</p>
          
          <p><strong>What happens next?</strong><br>
          We'll send you an email in January 2026 when the giveaway officially launches. At that time, you'll be able to earn additional entries and invite your colleagues to join.</p>
          
          <p>In the meantime, follow us on social media for behind-the-scenes updates on the suit development process!</p>
          
          <p>Questions? Just reply to this email - we'd love to hear from you.</p>
          
          <p>Best regards,<br>
          <strong>Brandon</strong><br>
          Founder, Mea</p>
        </div>
        
        <div class="footer">
          <p><strong>Mea</strong><br>
          Email: <a href="mailto:hello@measuit.com">hello@measuit.com</a> | Phone: 801 754 4336<br>
          <a href="https://measuit.com">Visit our website</a></p>
          <p style="margin-top: 15px; font-size: 11px;">
            You're receiving this email because you signed up for early access to Mea's launch giveaway.
          </p>
        </div>
      </body>
      </html>
    `;
    
    const plainBody = `
Hi ${recipientName}!

Thank you for joining our launch giveaway! Your early entry has been confirmed.

Here's what you can look forward to:
✓ First access to earn extra entries when our giveaway launches in January 2026
✓ Skip the line for our launch sale
✓ Access to our Size Finder tool

We're creating the first suit designed specifically for female funeral directors - with real pockets, durable stretch fabric, and custom sizing that actually works.

What happens next?
We'll send you an email in January 2026 when the giveaway officially launches. At that time, you'll be able to earn additional entries and invite your colleagues to join.

Questions? Just reply to this email - we'd love to hear from you.

Best regards,
Brandon
Founder, Mea

---
Mea
Email: hello@measuit.com | Phone: 801 754 4336
Visit our website: https://measuit.com
    `;
    
    GmailApp.sendEmail(
      recipientEmail,
      subject,
      plainBody,
      {
        from: 'brandon@measuit.com',
        name: 'Brandon from Mea',
        htmlBody: htmlBody,
        replyTo: 'hello@measuit.com'
      }
    );
    Logger.log('Welcome email sent to: ' + recipientEmail);
  } catch (error) {
    Logger.log('Error sending welcome email: ' + error.toString());
  }
}

// Send measurement confirmation email
function sendMeasurementEmail(data, jacketSize, pantSize) {
  Logger.log('>>>>>> ENTERED sendMeasurementEmail function <<<<<<');
  
  try {
    Logger.log('sendMeasurementEmail function started');
    Logger.log('Input data received: ' + JSON.stringify(data));
    Logger.log('Jacket size: "' + jacketSize + '", Pant size: "' + pantSize + '"');
    
    const recipientEmail = data.email;
    
    if (!recipientEmail || recipientEmail === '') {
      Logger.log('✗✗✗ CRITICAL ERROR: No recipient email provided ✗✗✗');
      Logger.log('recipientEmail value: "' + recipientEmail + '"');
      throw new Error('Recipient email is required');
    }
    
    if (!data.name || data.name === '') {
      Logger.log('✗✗✗ CRITICAL WARNING: No name provided in data object ✗✗✗');
      Logger.log('data.name value: "' + data.name + '"');
    }
    
    if (!data.phone || data.phone === '') {
      Logger.log('✗✗✗ CRITICAL WARNING: No phone provided in data object ✗✗✗');
      Logger.log('data.phone value: "' + data.phone + '"');
    }
    
    const subject = 'We\'ve saved your size!';
    Logger.log('Email subject: ' + subject);
    Logger.log('Recipient email: ' + recipientEmail);
    Logger.log('Building email HTML...');
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 2px;
            overflow: hidden;
            box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05);
          }
          .header {
            background: #ffffff;
            padding: 48px 40px 24px;
            text-align: left;
          }
          .logo {
            max-width: 60px;
            height: auto;
            display: block;
            border-radius: 50%;
          }
          .content {
            padding: 0 40px 48px;
            text-align: left;
          }
          h2 {
            color: #111111;
            font-size: 24px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 24px;
          }
          p {
            margin: 0 0 16px;
            color: #333333;
            font-size: 16px;
            line-height: 1.6;
          }
          .pink-tile {
            background-color: #ffe8e2;
            border: 1px solid #ffb6a3;
            border-radius: 12px;
            padding: 32px;
            margin: 24px 0;
          }
          .size-table {
            width: 100%;
            border-collapse: collapse;
          }
          .size-row td {
            padding: 16px 0;
            vertical-align: top;
          }
          .size-row:not(:last-child) td {
            border-bottom: 1px solid #ffccbc;
          }
          .size-label {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 14px;
            color: #555;
            width: 80px;
            padding-right: 16px;
            white-space: nowrap;
          }
          .size-value {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 20px;
            font-weight: 700;
            color: #111;
            line-height: 1.3;
          }
          .measurements-list {
            margin: 24px 0;
          }
          .measurement-item {
            margin-bottom: 4px;
            font-size: 16px;
            color: #333;
          }
          .measurement-item strong {
            font-weight: 700;
          }
          .links {
            margin-top: 24px;
            font-size: 14px;
          }
          .links a {
            color: #0066cc;
            text-decoration: underline;
            margin-right: 12px;
          }
          .signature {
            margin-top: 40px;
            border-top: 1px solid #eee;
            padding-top: 24px;
            font-size: 14px;
            color: #555;
          }
          .signature strong {
            font-weight: 700;
            color: #333;
          }
          .cta-button {
            display: inline-block;
            background-color: #3b82f6; /* Blue color */
            color: #ffffff !important;
            padding: 12px 24px;
            text-decoration: none !important;
            border-radius: 4px;
            font-weight: 500;
            font-size: 16px;
            margin-top: 16px;
          }
          .cta-button:hover {
            background-color: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <!-- Assuming logo is Brandon's picture based on image, but keeping logo.png for now or removing if not needed. 
                 The image shows a profile picture. I'll keep the logo structure but maybe adjust alignment. -->
             <!-- <img src="https://measuit.com/logo.png" alt="Mea" class="logo"> -->
          </div>
          
          <div class="content">
            <h2 style="text-align: center; font-family: 'Georgia', 'Times New Roman', serif;">Thanks for entering your size details.</h2>
            
            <div class="pink-tile">
              <table class="size-table">
                <tr class="size-row">
                  <td class="size-label">Jacket Size:</td>
                  <td class="size-value">${jacketSize}</td>
                </tr>
                <tr class="size-row">
                  <td class="size-label">Pant Size:</td>
                  <td class="size-value">${pantSize}</td>
                </tr>
              </table>
            </div>

            <p><strong>Here are the Measurements You Gave Us:</strong></p>
            
            <div class="measurements-list">
              <div class="measurement-item">Bust: <strong>${data.bust}"</strong></div>
              <div class="measurement-item">Natural Waist: <strong>${data.naturalWaist}"</strong></div>
              <div class="measurement-item">Pant Waist: <strong>${data.pantWaist}"</strong></div>
              <div class="measurement-item">Hip: <strong>${data.hip}"</strong></div>
              <div class="measurement-item">Thigh: <strong>${data.thigh}"</strong></div>
            </div>

            <div style="margin-top: 24px;">
              <a href="https://measuit.com/size_chart.html" class="cta-button" target="_blank">View Our Size Chart</a>
            </div>
            
            <p style="margin-top: 32px;"><strong>Save this email!</strong> You'll need these sizes when our launch sale drops in Spring 2026.</p>
          </div>
          
          <div style="background-color: #e5e5e5; padding: 40px 40px; text-align: left; color: #666666; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            <div style="font-family: 'Brush Script MT', cursive; font-size: 24px; margin-bottom: 24px; color: #333;">mea</div>
            
            <div style="font-size: 12px; letter-spacing: 1px; line-height: 2; font-weight: 600; color: #666; text-transform: uppercase;">
              EMAIL: <a href="mailto:hello@measuit.com" style="color: #666; text-decoration: underline;">hello@measuit.com</a><br>
              PHONE: 801 754 4336
            </div>
            
            <div style="margin-top: 24px; font-size: 12px; letter-spacing: 1px; color: #666; text-transform: uppercase;">
              © 2025 MEA | ALL RIGHTS RESERVED
            </div>
            
            <div style="margin-top: 24px;">
              <a href="https://www.linkedin.com/company/measuit" style="text-decoration: none; margin-right: 16px; display: inline-block;">
                <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" width="24" height="24" alt="LinkedIn" style="vertical-align: middle; opacity: 0.6;">
              </a>
              <a href="https://www.instagram.com/meafdsuit/" style="text-decoration: none; margin-right: 16px; display: inline-block;">
                <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" width="24" height="24" alt="Instagram" style="vertical-align: middle; opacity: 0.6;">
              </a>
              <a href="https://www.facebook.com/people/Mea/61585207431538/" style="text-decoration: none; display: inline-block;">
                <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" width="24" height="24" alt="Facebook" style="vertical-align: middle; opacity: 0.6;">
              </a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const plainBody = `
We've saved your size!

Jacket Size: ${jacketSize}
Pant Size: ${pantSize}

Here are the Measurements You Gave Us:
Bust: ${data.bust}"
Natural Waist: ${data.naturalWaist}"
Pant Waist: ${data.pantWaist}"
Hip: ${data.hip}"
Thigh: ${data.thigh}"

View Our Size Chart: https://measuit.com/size_chart.html

Save this email! You'll need these sizes when our launch sale drops in Spring 2026.

- Mea

hello@measuit.com • 801 754 4336

Visit our website: https://measuit.com
LinkedIn: https://www.linkedin.com/company/measuit
Instagram: https://www.instagram.com/meafdsuit/
Facebook: https://www.facebook.com/people/Mea/61585207431538/
    `;
    
    GmailApp.sendEmail(
      recipientEmail,
      subject,
      plainBody,
      {
        from: 'brandon@measuit.com',
        name: 'Brandon from Mea',
        htmlBody: htmlBody,
        replyTo: 'brandon@measuit.com'
      }
    );
    Logger.log('✓ Measurement email successfully sent to: ' + recipientEmail);
  } catch (error) {
    Logger.log('✗ ERROR sending measurement email: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    throw error; // Re-throw to ensure calling function knows email failed
  }
}

// Calculate jacket size based on measurements
function calculateJacketSize(data) {
  const bust = parseFloat(data.bust);
  let baseSize = Math.round(bust / 2) * 2; // Round to nearest even number
  return `${baseSize} ${data.jacketLengthPreference}, ${data.jacketWidthPreference}`;
}

// Calculate pant size based on measurements
function calculatePantSize(data) {
  const waist = parseFloat(data.pantWaist);
  let baseSize = Math.round(waist / 2) * 2; // Round to nearest even number
  return `${baseSize} ${data.pantsLengthPreference}, ${data.pantsWidthPreference}`;
}

function doGet(e) {
  // Simple test endpoint
  return ContentService.createTextOutput('Mea Lead Capture API is running');
}

// Test function to verify the script works
function testDataSave() {
  const testData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '801-555-1234',
    bust: '',
    naturalWaist: '',
    pantWaist: '',
    hip: '',
    thigh: '',
    jacketLengthPreference: '',
    jacketWidthPreference: '',
    pantsLengthPreference: '',
    pantsWidthPreference: ''
  };
  
  const spreadsheet = SpreadsheetApp.openById('1h5lTyYvmkbnUbKj77yyQb6RgRYzxBHpXTGvaSRMEw2s');
  const sheet = spreadsheet.getSheetByName('Sheet1');
  
  const rowData = [
    new Date(),
    testData.name,
    testData.phone,
    testData.email,
    testData.bust,
    testData.naturalWaist,
    testData.pantWaist,
    testData.hip,
    testData.thigh,
    testData.jacketLengthPreference,
    testData.jacketWidthPreference,
    testData.pantsLengthPreference,
    testData.pantsWidthPreference
  ];
  
  sheet.appendRow(rowData);
  Logger.log('Test data saved successfully');
}
