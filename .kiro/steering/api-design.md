# API Design Guidelines

## REST API Conventions

### URL Structure
```
/api/v1/{resource}/{id}/{sub-resource}

Examples:
GET    /api/v1/donors
GET    /api/v1/donors/123
POST   /api/v1/blood-requests
GET    /api/v1/blood-requests/456/responses
PUT    /api/v1/donors/123/availability
```

### Standard Headers
```
X-Request-ID: uuid
X-API-Version: 1.0
X-Rate-Limit-Remaining: 100
Content-Type: application/json
Authorization: Bearer {token}
```

### Error Response Format
```json
{
  "error": {
    "code": "DONOR_NOT_FOUND",
    "message": "Donor with ID 123 not found",
    "details": {
      "id": "123",
      "timestamp": "2024-01-20T10:30:00Z"
    },
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Pagination Standard
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalCount": 100
  },
  "links": {
    "self": "/api/v1/donors?page=1&pageSize=20",
    "next": "/api/v1/donors?page=2&pageSize=20",
    "prev": null
  }
}
```

## WhatsApp Message Templates

### Template Naming Convention
```
{action}_{entity}_{language}

Examples:
request_blood_urgent_en
confirm_donation_hi
thank_donor_en
```

### Template Variables
```javascript
// Use descriptive variable names
{donor_name}      // Not {name}
{blood_type}      // Not {type}
{hospital_name}   // Not {location}
{urgency_level}   // Not {level}
```

## Security Standards

### JWT Token Structure
```json
{
  "sub": "user_id",
  "role": "donor|admin|hospital",
  "permissions": ["read:donors", "write:requests"],
  "iat": 1516239022,
  "exp": 1516339022
}
```

### Permission Matrix
```javascript
const permissions = {
  donor: [
    'read:own_profile',
    'update:own_profile',
    'read:requests',
    'respond:requests'
  ],
  admin: [
    'read:all_profiles',
    'update:all_profiles',
    'approve:donors',
    'manage:requests',
    'view:analytics'
  ],
  hospital: [
    'create:requests',
    'manage:inventory',
    'view:donors_nearby'
  ]
};
```

## Data Security Requirements

### Encryption Standards
- **At Rest**: AES-256 for all PII
- **In Transit**: TLS 1.3 minimum
- **Passwords**: bcrypt with cost factor 12
- **API Keys**: Stored encrypted, rotated monthly

### HIPAA Compliance Checklist
- [ ] Implement access controls
- [ ] Encrypt all PHI data
- [ ] Maintain audit logs
- [ ] Regular security assessments
- [ ] Data backup and recovery
- [ ] Employee training records