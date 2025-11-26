// Google Apps Script for saving Mea form data to Google Sheets
// Deploy this as a Web App with "Anyone" access

function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet (or specify by ID)
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Prepare the row data matching your headers exactly:
    // Timestamp | Name | Phone | Email | Bust (inches) | Natural Waist (inches) | 
    // Pant Waist (Mid Rise) (inches) | Hip (inches) | Thigh (inches) | 
    // Jacket Length Preference | Jacket Width Preference | 
    // Pants Length Preference | Pants Width Preference
    
    const rowData = [
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.phone || '',
      data.email || '',
      data.bust || '',
      data.naturalWaist || '',
      data.pantWaist || '',
      data.hip || '',
      data.thigh || '',
      data.jacketLength || '',
      data.jacketWidth || '',
      data.pantsLength || '',
      data.pantsWidth || ''
    ];
    
    // Append the row to the sheet
    sheet.appendRow(rowData);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'success',
      'message': 'Data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function to verify the script works
function testDoPost() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toISOString(),
        name: 'Test User',
        phone: '+1 234 567 8900',
        email: 'test@example.com',
        bust: '36',
        naturalWaist: '28',
        pantWaist: '30',
        hip: '38',
        thigh: '22',
        jacketLength: 'Regular',
        jacketWidth: 'Regular',
        pantsLength: 'Regular',
        pantsWidth: 'Regular'
      })
    }
  };
  
  const result = doPost(testData);
  Logger.log(result.getContent());
}
