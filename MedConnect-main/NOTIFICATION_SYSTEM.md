# MedConnect Notification System

## Overview

The MedConnect notification system provides a comprehensive way for researchers and patients to communicate through contact requests. This system ensures privacy and consent by requiring explicit permission before researchers can view patient profiles.

## Features

### For Researchers
- **Send Contact Requests**: Researchers can send contact requests to patients they're interested in working with
- **Track Request Status**: View the status of sent contact requests (pending, accepted, declined)
- **Professional Messaging**: Include personalized messages explaining research interests
- **Patient Discovery**: Find patients through search functionality and send targeted requests

### For Patients
- **Receive Notifications**: Get notified when researchers want to contact them
- **Review Requests**: See detailed information about each contact request
- **Accept/Decline**: Choose whether to allow researchers to view their profile
- **Privacy Control**: Maintain full control over who can access their information

## Components

### 1. NotificationBell (`src/components/notifications/NotificationBell.tsx`)
- Displays notification count badge
- Opens notification center when clicked
- Shows pending request count in real-time

### 2. NotificationCenter (`src/components/notifications/NotificationCenter.tsx`)
- Main notification interface
- Different views for patients and researchers
- Handles request responses
- Shows request history

### 3. ContactRequestModal (`src/components/notifications/ContactRequestModal.tsx`)
- Modal for sending contact requests
- Form validation and error handling
- Professional messaging interface

## Data Flow

### Sending a Contact Request
1. Researcher clicks "Request Contact" on patient profile
2. ContactRequestModal opens with patient information
3. Researcher enters personalized message
4. Request is sent to backend API
5. Patient receives notification
6. Request appears in patient's notification center

### Responding to a Contact Request
1. Patient sees notification banner or checks notification center
2. Patient reviews request details and researcher's message
3. Patient chooses to accept or decline
4. Response is sent to backend
5. Researcher receives status update
6. If accepted, researcher can now view patient profile

## API Endpoints

### Backend Endpoints (Django)
- `POST /api/contact-request/{patient_id}/` - Send contact request
- `GET /api/contact-requests/` - Get user's contact requests
- `PUT /api/contact-request/{request_id}/respond/` - Respond to request

### Frontend Integration
- ContactRequest type defined in `src/types/data.ts`
- Functions in `src/contexts/DataContext.tsx`:
  - `sendContactRequest(patientId, message)`
  - `fetchContactRequests()`
  - `respondToContactRequest(requestId, response)`

## Usage Examples

### For Researchers

```typescript
// Send a contact request
const success = await sendContactRequest(patientId, "I'm conducting research on your condition and would like to discuss potential participation in our study.");

// Check contact request status
const requests = contactRequests.filter(req => req.status === 'pending');
```

### For Patients

```typescript
// Respond to a contact request
const success = await respondToContactRequest(requestId, 'accept');

// Get pending requests
const pendingRequests = contactRequests.filter(req => req.status === 'pending');
```

## Privacy & Security

### Data Protection
- Contact requests require explicit consent
- Patient profiles remain private until request is accepted
- All communication is logged and auditable
- Researchers cannot access patient data without permission

### User Control
- Patients can decline requests without explanation
- Accepted requests can be revoked
- Full transparency on what data will be shared
- Clear communication about research purposes

## Integration Points

### Dashboard Integration
- **PatientDashboard**: Shows notification banner and notification center
- **ResearcherDashboard**: Integrates contact request functionality in patient matching
- **SearchPage**: Allows sending requests from search results

### Navigation Integration
- **Header**: NotificationBell component shows pending count
- **Real-time Updates**: Notifications update automatically when new requests arrive

## Future Enhancements

### Planned Features
- **Email Notifications**: Send email alerts for new requests
- **Push Notifications**: Real-time browser notifications
- **Request Templates**: Pre-written professional messages
- **Bulk Operations**: Send requests to multiple patients
- **Analytics**: Track request success rates and response times

### Advanced Features
- **Auto-matching**: Suggest patients based on research criteria
- **Request Scheduling**: Schedule requests for optimal timing
- **Follow-up Reminders**: Automatic reminders for pending requests
- **Integration with Studies**: Link requests to specific clinical trials

## Troubleshooting

### Common Issues
1. **Request not sending**: Check network connection and API endpoint
2. **Notification not showing**: Verify user authentication and data loading
3. **Response not updating**: Check backend API response and error handling

### Debug Steps
1. Check browser console for JavaScript errors
2. Verify API endpoints are accessible
3. Confirm user permissions and authentication
4. Test with different user types (patient vs researcher)

## Best Practices

### For Researchers
- Write clear, professional messages
- Explain research purpose and benefits
- Respect patient privacy and time
- Follow up appropriately on accepted requests

### For Patients
- Review requests carefully before responding
- Ask questions if information is unclear
- Consider research benefits and risks
- Maintain control over your data

## Technical Implementation

### State Management
- Contact requests stored in DataContext
- Real-time updates through API polling
- Optimistic UI updates for better UX

### Error Handling
- Network error recovery
- Validation error display
- Graceful degradation for offline scenarios

### Performance
- Lazy loading of notification components
- Efficient filtering and sorting
- Minimal API calls through caching
