# Google Form Integration Setup Guide

This guide explains how to set up Google Forms for attendance tracking that integrates with the Sistem Kelas Pengajian.

## Overview

When a teacher clicks "Ambil Kehadiran" (Take Attendance), a Google Form popup appears. Teachers can tick student names in the form, and the submissions are automatically sent to the system's attendance page and stored as an array.

## Prerequisites

1. A Google account with access to Google Forms and Google Apps Script
2. Admin access to the Sistem Kelas Pengajian
3. The backend API running and accessible

## Step 1: Create a Google Form

1. Go to [Google Forms](https://forms.google.com)
2. Create a new form titled "Kehadiran [Class Name]"
3. Add a "Multiple choice grid" or "Checkboxes" question:
   - Question: "Sila tandakan pelajar yang hadir:"
   - Rows: Will be populated with student names (via Apps Script)
   - Columns: Hadir, Tidak Hadir, Lewat, Sakit, Cuti

OR

3. Add "Checkboxes" question:
   - Question: "Sila tandakan pelajar yang hadir:"
   - Options: Will be populated with student names (via Apps Script)

## Step 2: Set Up Google Apps Script

1. In your Google Form, click the three dots (⋮) → **Script editor**
2. Copy and paste the following script:

```javascript
// Configuration
const API_BASE_URL = 'http://your-server-url:5000/api'; // Replace with your actual API URL
const WEBHOOK_SECRET = 'your_secret_key'; // Optional: Set in .env as GOOGLE_FORM_WEBHOOK_SECRET
const CLASS_ID = 1; // Replace with the actual class ID

// Function to populate form with student names
function populateFormWithStudents() {
  const form = FormApp.getActiveForm();
  const items = form.getItems();
  
  // Find the checkbox or grid question
  let checkboxItem = null;
  for (let i = 0; i < items.length; i++) {
    if (items[i].getType() === FormApp.ItemType.CHECKBOX || 
        items[i].getType() === FormApp.ItemType.CHECKBOX_GRID) {
      checkboxItem = items[i];
      break;
    }
  }
  
  if (!checkboxItem) {
    Logger.log('No checkbox question found');
    return;
  }
  
  // Fetch students from API
  try {
    const response = UrlFetchApp.fetch(`${API_BASE_URL}/students?kelas_id=${CLASS_ID}&limit=1000`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = JSON.parse(response.getContentText());
    const students = result.data || result || [];
    
    if (checkboxItem.getType() === FormApp.ItemType.CHECKBOX) {
      // For checkbox question
      const checkboxQuestion = checkboxItem.asCheckboxItem();
      const choices = students.map(student => `${student.nama} (${student.ic})`);
      checkboxQuestion.setChoiceValues(choices);
    } else if (checkboxItem.getType() === FormApp.ItemType.CHECKBOX_GRID) {
      // For checkbox grid question
      const gridQuestion = checkboxItem.asCheckboxGridItem();
      const rows = students.map(student => `${student.nama} (${student.ic})`);
      gridQuestion.setRows(rows);
      gridQuestion.setColumns(['Hadir', 'Tidak Hadir', 'Lewat', 'Sakit', 'Cuti']);
    }
    
    Logger.log(`Populated form with ${students.length} students`);
  } catch (error) {
    Logger.log('Error fetching students: ' + error.toString());
  }
}

// Trigger function when form is submitted
function onFormSubmit(e) {
  const form = FormApp.getActiveForm();
  const formResponses = e.response;
  const itemResponses = formResponses.getItemResponses();
  
  // Get the attendance data
  const attendanceData = [];
  
  for (let i = 0; i < itemResponses.length; i++) {
    const itemResponse = itemResponses[i];
    const question = itemResponse.getItem();
    const response = itemResponse.getResponse();
    
    // Check if this is the attendance question
    if (question.getType() === FormApp.ItemType.CHECKBOX) {
      // For checkbox: selected items are "Hadir"
      const selectedStudents = Array.isArray(response) ? response : [response];
      selectedStudents.forEach(studentInfo => {
        // Extract IC from format "Name (IC)"
        const icMatch = studentInfo.match(/\(([^)]+)\)/);
        const studentIc = icMatch ? icMatch[1] : null;
        const studentName = studentInfo.split('(')[0].trim();
        
        if (studentIc) {
          attendanceData.push({
            student_ic: studentIc,
            student_name: studentName,
            status: 'Hadir'
          });
        }
      });
      
      // Get all students to mark non-selected as "Tidak Hadir"
      const allStudents = getStudentsForClass();
      const selectedICs = selectedStudents.map(s => {
        const match = s.match(/\(([^)]+)\)/);
        return match ? match[1] : null;
      }).filter(Boolean);
      
      allStudents.forEach(student => {
        if (!selectedICs.includes(student.ic)) {
          attendanceData.push({
            student_ic: student.ic,
            student_name: student.nama,
            status: 'Tidak Hadir'
          });
        }
      });
    } else if (question.getType() === FormApp.ItemType.CHECKBOX_GRID) {
      // For checkbox grid: response is an object with row names and column values
      if (typeof response === 'object') {
        Object.keys(response).forEach(studentInfo => {
          const selectedColumns = Array.isArray(response[studentInfo]) 
            ? response[studentInfo] 
            : [response[studentInfo]];
          
          const icMatch = studentInfo.match(/\(([^)]+)\)/);
          const studentIc = icMatch ? icMatch[1] : null;
          const studentName = studentInfo.split('(')[0].trim();
          
          if (studentIc && selectedColumns.length > 0) {
            // Get the first selected status (or default to 'Hadir')
            const status = selectedColumns[0] || 'Hadir';
            attendanceData.push({
              student_ic: studentIc,
              student_name: studentName,
              status: status
            });
          }
        });
      }
    }
  }
  
  // Send data to webhook
  if (attendanceData.length > 0) {
    sendToWebhook(attendanceData);
  }
}

// Helper function to get students for class
function getStudentsForClass() {
  try {
    const response = UrlFetchApp.fetch(`${API_BASE_URL}/students?kelas_id=${CLASS_ID}&limit=1000`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = JSON.parse(response.getContentText());
    return result.data || result || [];
  } catch (error) {
    Logger.log('Error fetching students: ' + error.toString());
    return [];
  }
}

// Send attendance data to webhook
function sendToWebhook(attendanceData) {
  const today = new Date();
  const dateStr = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  
  const payload = {
    class_id: CLASS_ID,
    tarikh: dateStr,
    attendance_data: attendanceData,
    secret_key: WEBHOOK_SECRET
  };
  
  try {
    const response = UrlFetchApp.fetch(`${API_BASE_URL}/google-form/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload)
    });
    
    const result = JSON.parse(response.getContentText());
    Logger.log('Webhook response: ' + JSON.stringify(result));
    
    if (!result.success) {
      Logger.log('Webhook error: ' + result.message);
    }
  } catch (error) {
    Logger.log('Error sending to webhook: ' + error.toString());
  }
}

// Create trigger for form submission
function createTrigger() {
  const form = FormApp.getActiveForm();
  ScriptApp.newTrigger('onFormSubmit')
    .timeBased()
    .onFormSubmit()
    .create();
}
```

3. **Update the configuration:**
   - Replace `API_BASE_URL` with your actual API URL (e.g., `http://localhost:5000/api` or your production URL)
   - Replace `CLASS_ID` with the actual class ID from your system
   - Replace `WEBHOOK_SECRET` with your secret key (optional, set in `.env` as `GOOGLE_FORM_WEBHOOK_SECRET`)

4. **Run the populate function:**
   - Click "Run" → Select `populateFormWithStudents`
   - Authorize the script when prompted
   - This will populate your form with student names

5. **Set up the form submission trigger:**
   - Run the `createTrigger` function once
   - This creates a trigger that automatically calls `onFormSubmit` when the form is submitted

## Step 3: Get the Form URL

1. In your Google Form, click "Send" (top right)
2. Click the link icon (🔗)
3. Copy the form URL
4. The URL should look like: `https://docs.google.com/forms/d/e/[FORM_ID]/viewform`

## Step 4: Configure the Form URL in the System

1. Login as admin
2. Go to the Kehadiran page
3. Select a class
4. Click "Ambil Kehadiran"
5. If no form URL is configured, you'll see a message

**To set the form URL programmatically:**

Make a PUT request to:
```
PUT /api/google-form/class/{class_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "google_form_url": "https://docs.google.com/forms/d/e/[FORM_ID]/viewform"
}
```

Or add it via the admin panel (if implemented).

## Step 5: Test the Integration

1. Login as a teacher
2. Go to Kehadiran page
3. Select a class
4. Select today's date
5. Click "Ambil Kehadiran"
6. The Google Form should open in a popup
7. Select students who are present
8. Submit the form
9. Check the attendance page - the data should appear automatically

## Troubleshooting

### Form not populating with students
- Check that `CLASS_ID` is correct in the Apps Script
- Verify the API endpoint is accessible: `${API_BASE_URL}/students?kelas_id=${CLASS_ID}`
- Check Apps Script logs: View → Execution transcript

### Form submissions not appearing in system
- Check Apps Script logs for errors
- Verify webhook endpoint is accessible: `${API_BASE_URL}/google-form/webhook`
- Check backend logs for webhook requests
- Verify `secret_key` matches (if configured)

### Form not opening in popup
- Verify the form URL is set correctly in the database
- Check browser console for errors
- Ensure the form URL is publicly accessible (not restricted)

## Notes

- The form URL is stored in the `settings` table with key `google_form_url_{class_id}`
- Each class can have its own Google Form
- The webhook endpoint doesn't require authentication (uses optional secret_key)
- Form responses are processed immediately and stored in the `attendance` table
- Students are identified by their IC number in the form

## Alternative: Manual Form Creation

If you prefer to create the form manually without Apps Script:

1. Create a Google Form with checkboxes for each student
2. Manually add student names as options
3. Set up Apps Script only for the `onFormSubmit` function to send data to the webhook
4. Update the form manually when students are added/removed

## Security Considerations

- The webhook endpoint accepts submissions without authentication by default
- Consider adding a `secret_key` in your `.env` file and matching it in Apps Script
- The secret key should be a strong random string
- Limit API access if possible (IP whitelist, etc.)

