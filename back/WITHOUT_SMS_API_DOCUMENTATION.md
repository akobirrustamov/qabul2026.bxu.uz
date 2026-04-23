# API Documentation: `/without-sms`

## Overview
The `/without-sms` endpoint is a POST API that creates a new applicant (Abuturient) in the system without sending an SMS notification. This endpoint is used to add new students to the CRM system through operator interaction.

---

## Endpoint Details

### URL
```
POST /without-sms
```

### Request Method
**POST**

---

## Request Body

### Content-Type
```
application/json
```

### Request Payload Structure
```json
{
  "phone": "string (required)",
  "agent": "string/number (required)",
  "isDtm": "boolean (required)",
  "commenterId": "number (required)"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | String | Yes | Phone number of the applicant (e.g., "+998912345678") |
| `agent` | String/Number | Yes | Agent ID that will be associated with the applicant |
| `isDtm` | Boolean | Yes | Flag indicating whether applicant is DTM (Distance Teaching Model) student |
| `commenterId` | Number | Yes | User ID of the operator/commenter creating this applicant |

### Example Request
```json
{
  "phone": "+998912345678",
  "agent": "AGENT_001",
  "isDtm": true,
  "commenterId": 5
}
```

---

## Response

### Success Response (HTTP 200)

#### Response Type
```json
{
  "id": "number",
  "phone": "string",
  "agent": "User object",
  "status": "number",
  "createdAt": "datetime",
  "contractNumber": "string",
  "isDtm": "boolean"
}
```

#### Example Success Response
```json
{
  "id": 123,
  "phone": "+998912345678",
  "agent": {
    "id": 45,
    "name": "Ali Karimov",
    "role": "agent"
  },
  "status": 0,
  "createdAt": "2024-01-15T10:30:00",
  "contractNumber": "CONT_20240115_001",
  "isDtm": true
}
```

### Error Responses

#### 1. Phone Number Already Exists (HTTP 200 with Message)
```json
"Bu telefon raqam allaqachon mavjud: +998912345678 Kategoriya: [Category Name] bosqichi: [SubCategory Name] biriktirilgan operator: [Operator Name]"
```

**Meaning**: "This phone number already exists: [phone] Category: [category] Stage: [stage] Assigned operator: [operator]"

#### 2. Agent Not Found (HTTP 400)
```json
{
  "error": "Agent not found"
}
```

#### 3. User Not Found (HTTP 400)
```json
{
  "error": "User not found"
}
```

#### 4. General Error (HTTP 400)
```json
{
  "error": "Error saving Abuturient: [error details]"
}
```

---

## Functional Flow

### Step-by-Step Process

1. **Phone Validation**
   - System checks if phone number already exists in database
   - If exists, returns existing applicant information with assigned CRM category and operator

2. **Agent Lookup**
   - Retrieves agent information using the provided `agent` ID
   - Matches agent to corresponding user record

3. **Abuturient Creation**
   - Creates new applicant record with:
     - Phone number
     - Associated agent
     - Status: 0 (initial status)
     - Current timestamp
     - Auto-generated contract number
     - DTM flag

4. **CRM Lead Creation**
   - Creates CRM Lead record with:
     - Default category (sort order 1)
     - Default sub-category (sort order 1)
     - Assigned operator (from commenterId)
     - Source: "Operator tomonidan qo'shilgan" (Added by operator)
     - Status: true (active)

5. **Comment Creation**
   - Creates initial comment/history entry:
     - Description: "[Operator Name] tomonidan yangi abituriyent qo'shildi: [phone]"
     - History Status: 4 (New applicant added)
     - Associated with created CRM Lead

6. **WebSocket Notification**
   - Sends real-time update to connected clients via WebSocket:
     - Topic: `/topic/new-lead` (new lead notification)
     - Topic: `/topic/lead-comment` (new comment notification)

---

## Key Business Logic

### Contract Number Generation
- Auto-generated when applicant is created
- Used for tracking and identification purposes

### CRM Lead Assignment
- Automatically assigned to first category and sub-category
- Can be reassigned later through CRM interface

### Operator Assignment
- Operator is determined by `commenterId` parameter
- Operator receives WebSocket notification about new applicant

### DTM Flag
- Indicates if student is registered for Distance Teaching Model
- Stored with applicant record for future reference

---

## Data Dependencies

### Required Database Records
1. **CrmCategory** - with sortOrder = 1 (default category)
2. **CrmSubCategory** - with sortOrder = 1 and category ID (default sub-category)
3. **User** - with ID matching `commenterId`
4. **AgentPath** (optional) - for agent lookup if agent ID provided

### Created Database Records
1. **Abuturient** - Main applicant record
2. **CrmLead** - CRM tracking record
3. **CrmLeadComment** - Initial comment/history

---

## Security Considerations

- Requires valid `commenterId` (user must exist in system)
- Operator information is tracked for audit trail
- Phone number uniqueness is enforced at database level
- WebSocket messages sent to subscribed clients only

---

## Notes

- Phone numbers are treated as unique identifiers
- If phone already exists, no duplicate is created
- SMS sending is completely skipped (compared to other endpoints)
- Real-time WebSocket notifications enable live updates
- Default CRM category and sub-category are always used initially
- System automatically generates contract numbers

---

## Related Endpoints

- **`/without-sms-sipuni`** - Alternative version for non-DTM applicants
- **`/with-sms`** - Version that includes SMS notifications
- **GET `/abuturient/{id}`** - Retrieve applicant details
- **PUT `/abuturient/{id}`** - Update applicant information

---

## Language Note

The endpoint uses Uzbek language messages and descriptions. Key terms:
- **Abuturient** = Applicant/Student
- **Telefon raqam** = Phone number
- **Operator** = Agent/Staff member handling the applicant
- **DTM** = Masofaviy ta'lim modeli (Distance Teaching Model)


