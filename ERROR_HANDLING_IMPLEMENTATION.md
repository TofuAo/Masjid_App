# Comprehensive Error Handling Implementation

## Overview
This document describes the comprehensive error handling system implemented across all pages of the MyMasjidApp to help admins identify and fix issues.

## Components Created

### 1. Error Logger Utility (`src/utils/errorLogger.js`)
- **Purpose**: Centralized error logging with context
- **Features**:
  - Logs errors with page, action, user info, and timestamp
  - Stores last 10 errors in localStorage for admin review
  - Provides user-friendly error messages
  - Extracts admin-friendly debugging details
  - Checks if user is admin for detailed error display

### 2. Error Handler Hook (`src/hooks/useErrorHandler.js`)
- **Purpose**: React hook for consistent error handling across pages
- **Features**:
  - Automatic error logging with context
  - Toast notifications (configurable)
  - Error state management
  - Wrapper functions for async operations
  - Custom error handler callbacks

### 3. Error Display Component (`src/components/ui/ErrorDisplay.jsx`)
- **Purpose**: Reusable error display UI component
- **Features**:
  - User-friendly error messages
  - Admin debugging details (only visible to admins)
  - Retry and reload buttons
  - Home button option
  - Responsive design

## Pages Updated

The following pages have been updated with comprehensive error handling:

1. **NotificationCenter** - Error handling for fetching and marking notifications
2. **PaymentHistory** - Error handling for payment data loading and receipt viewing
3. **Announcements** - Error handling for CRUD operations and undo actions
4. **PayYuran** - Error handling for fee loading and QR settings
5. **SystemHealth** - Error handling for health check operations
6. **StudentRegistration** - Enhanced error handling for registration submissions

## Implementation Pattern

### Step 1: Import Required Dependencies
```javascript
import useErrorHandler from '../hooks/useErrorHandler';
import ErrorDisplay from '../components/ui/ErrorDisplay';
```

### Step 2: Initialize Error Handler
```javascript
const { handleError, error: pageError, clearError } = useErrorHandler({ 
  pageName: 'YourPageName' 
});
```

### Step 3: Wrap Async Operations
```javascript
const fetchData = async () => {
  try {
    setLoading(true);
    clearError();
    // Your API call
    const response = await api.getData();
    // Handle response
  } catch (err) {
    handleError(err, { 
      action: 'fetchData',
      defaultMessage: 'Gagal memuatkan data. Sila cuba lagi.'
    });
  } finally {
    setLoading(false);
  }
};
```

### Step 4: Display Errors
```javascript
if (pageError && !data.length) {
  return (
    <ErrorDisplay
      error={pageError}
      title="Ralat Memuatkan Data"
      onRetry={() => {
        clearError();
        fetchData();
      }}
    />
  );
}
```

## Error Logging Features

### For Admins
- **Detailed Error Information**: Status codes, URLs, request methods, response data
- **Stack Traces**: Full error stack traces for debugging
- **Error History**: Last 10 errors stored in localStorage
- **Context Information**: Page name, action, user info, timestamp

### For All Users
- **User-Friendly Messages**: Clear, actionable error messages in Bahasa Malaysia
- **Retry Options**: Easy retry buttons for failed operations
- **Graceful Degradation**: Pages continue to function when possible

## Error Message Categories

### Network Errors
- Connection failures
- Timeout errors
- Network unavailable

### Authentication Errors
- Token expiration
- Unauthorized access
- Permission denied

### Validation Errors
- Invalid input data
- Missing required fields
- Format errors

### Server Errors
- 500 Internal Server Error
- 502 Bad Gateway
- 503 Service Unavailable

## Admin Debugging

Admins can access error details by:
1. **In-Page Details**: Expandable error details section (only visible to admins)
2. **Browser Console**: Full error logs with context
3. **LocalStorage**: Error history stored in `errorHistory` key
4. **Error Logger Functions**: Use `getErrorHistory()` and `clearErrorHistory()` utilities

## Best Practices

1. **Always use try-catch** for async operations
2. **Clear errors** before new operations
3. **Provide context** in error handler calls (action, additionalInfo)
4. **Use silent mode** for non-critical errors (e.g., QR settings)
5. **Show user-friendly messages** while logging technical details
6. **Allow retry** for transient errors
7. **Log sensitive data carefully** (e.g., mask IC numbers)

## Remaining Pages

The following pages should be updated using the same pattern:
- All other pages in `src/pages/` directory
- Focus on pages with API calls, form submissions, and data fetching

## Testing

To test error handling:
1. **Network Errors**: Disable network in DevTools
2. **API Errors**: Use invalid endpoints or data
3. **Validation Errors**: Submit invalid forms
4. **Auth Errors**: Use expired tokens
5. **Server Errors**: Trigger 500 errors

## Deployment

After implementation:
1. Build frontend: `npm run build`
2. Rebuild Docker: `docker-compose build frontend`
3. Restart container: `docker-compose up -d frontend`
4. Verify: Check logs and test error scenarios

## Future Enhancements

1. **Error Reporting Service**: Send errors to external service (e.g., Sentry)
2. **Error Analytics**: Track error frequency and patterns
3. **Auto-Retry**: Automatic retry for transient errors
4. **Error Notifications**: Notify admins of critical errors
5. **Error Recovery**: Automatic recovery strategies
