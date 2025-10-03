# Salesforce Deployment Checklist

Use this checklist to ensure a smooth deployment of the Tribble SDK to Salesforce.

## Pre-Deployment

### Prerequisites
- [ ] Salesforce CLI installed (`sf --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Tribble API key obtained
- [ ] Salesforce org access (Sandbox/Production)
- [ ] Team members notified of deployment window

### Documentation Review
- [ ] Read README.md
- [ ] Read QUICKSTART.md
- [ ] Read DEPLOYMENT.md
- [ ] Understand Tribble API authentication methods

### Security & Compliance
- [ ] Remote Site Settings approved by security team
- [ ] API endpoints whitelisted
- [ ] Data privacy requirements reviewed
- [ ] User permissions mapped
- [ ] Audit logging requirements documented

## Sandbox Deployment

### Build Package
- [ ] Clone/download package source
- [ ] Run `npm install` in root directory
- [ ] Run `npm run build` successfully
- [ ] Run `npm run build:salesforce` successfully
- [ ] Verify dist/salesforce-package created

### Salesforce CLI Setup
- [ ] Run `sf org login web --alias tribble-sandbox`
- [ ] Verify connection: `sf org display --target-org tribble-sandbox`
- [ ] Check API version compatibility

### Deploy to Sandbox
- [ ] Run validation: `npm run deploy:validate`
- [ ] Review validation results
- [ ] Fix any validation errors
- [ ] Deploy: `npm run deploy:test`
- [ ] Monitor deployment progress
- [ ] Verify deployment succeeded

### Post-Deployment Configuration
- [ ] Add Remote Site Settings (if not deployed):
  - [ ] Setup → Security → Remote Site Settings
  - [ ] Add `Tribble_API_Production` (https://api.tribble.ai)
  - [ ] Add `Tribble_API_Staging` (if needed)
  - [ ] Activate settings

- [ ] Configure Custom Metadata:
  - [ ] Setup → Custom Metadata Types
  - [ ] Manage Records → Tribble Configuration
  - [ ] Create "Default_Config" record:
    - [ ] API Endpoint: `https://api.tribble.ai`
    - [ ] Auth Method: `api-key`
    - [ ] API Key: [Your Tribble API Key]
    - [ ] Enable Debug Logs: ✓

### Testing in Sandbox

#### Apex Tests
- [ ] Run all Apex tests: `sf apex run test --target-org tribble-sandbox`
- [ ] Verify TribbleAPIClientTest passes
- [ ] Check code coverage (target: 75%+)
- [ ] Review test results
- [ ] Fix any failing tests

#### Component Testing
- [ ] Navigate to Lightning App Builder
- [ ] Create new Lightning page
- [ ] Add "Tribble AI Assistant" component
- [ ] Verify component appears
- [ ] Test chat functionality
- [ ] Test upload functionality
- [ ] Test on mobile (Salesforce Mobile App)
- [ ] Export chat and verify

#### Integration Testing
- [ ] Test chat message send/receive
- [ ] Test document upload (PDF)
- [ ] Test document upload (CSV)
- [ ] Test document upload (HTML/JSON)
- [ ] Test from ContentVersion
- [ ] Test from Attachment
- [ ] Test error handling
- [ ] Test with invalid API key
- [ ] Test timeout scenarios

#### User Acceptance Testing
- [ ] Create test user accounts
- [ ] Assign permissions
- [ ] Walk through user scenarios:
  - [ ] New conversation
  - [ ] Continue conversation
  - [ ] Upload document with metadata
  - [ ] Multiple file upload
  - [ ] Export chat history
- [ ] Collect user feedback
- [ ] Document issues/improvements

### Sandbox Sign-Off
- [ ] All tests passing
- [ ] UAT completed and approved
- [ ] Performance acceptable
- [ ] No critical bugs
- [ ] Business stakeholders sign-off

## Production Deployment

### Pre-Production Checklist
- [ ] Sandbox deployment successful
- [ ] All tests passing in Sandbox
- [ ] UAT sign-off received
- [ ] Production API key obtained
- [ ] Deployment window scheduled
- [ ] Rollback plan documented
- [ ] Team notified of deployment
- [ ] Support team on standby

### Backup & Preparation
- [ ] Create org backup:
  ```bash
  sf project retrieve start --target-org production --output-dir ./backup
  ```
- [ ] Document current org state
- [ ] Review deployment manifest
- [ ] Verify component count
- [ ] Check for conflicts

### Production Deploy
- [ ] Login to production: `sf org login web --alias tribble-production`
- [ ] Verify connection: `sf org display --target-org tribble-production`
- [ ] Run validation:
  ```bash
  sf project deploy validate \
    --manifest src/salesforce-package/manifest/package.xml \
    --target-org tribble-production \
    --test-level RunLocalTests
  ```
- [ ] Review validation results
- [ ] Get validation ID
- [ ] Quick deploy:
  ```bash
  sf project deploy quick --job-id <VALIDATION_ID> --target-org tribble-production
  ```
- [ ] Monitor deployment
- [ ] Wait for completion

### Post-Deployment Configuration (Production)
- [ ] Activate Remote Site Settings
- [ ] Update Custom Metadata with production API key
- [ ] Verify configuration saved
- [ ] Test API connectivity

### Production Verification
- [ ] Run smoke tests:
  ```bash
  sf apex run test --class-names TribbleAPIClientTest --target-org tribble-production
  ```
- [ ] Test chat component on test page
- [ ] Test upload component
- [ ] Verify no errors in debug logs
- [ ] Test from different user accounts
- [ ] Check performance metrics

### User Rollout
- [ ] Create Permission Set: "Tribble_User"
- [ ] Assign to pilot users
- [ ] Add components to pilot pages
- [ ] Monitor usage
- [ ] Collect feedback
- [ ] Gradual rollout to all users

## Post-Deployment

### Monitoring (First 24 Hours)
- [ ] Monitor debug logs: Setup → Debug Logs
- [ ] Check API usage in Tribble dashboard
- [ ] Review error rates
- [ ] Monitor user feedback
- [ ] Check performance metrics
- [ ] Verify backup processes

### Documentation & Communication
- [ ] Update internal documentation
- [ ] Send deployment completion email
- [ ] Document any issues encountered
- [ ] Update runbook with learnings
- [ ] Schedule post-deployment review

### Support & Maintenance
- [ ] Set up monitoring alerts
- [ ] Document support procedures
- [ ] Train support team
- [ ] Create FAQ for users
- [ ] Plan for future updates

## Rollback Plan (If Needed)

### Signs Rollback is Needed
- [ ] Critical functionality broken
- [ ] High error rate (>5%)
- [ ] Performance degradation
- [ ] Security issue discovered
- [ ] Business stakeholder request

### Rollback Steps
1. [ ] Notify all stakeholders
2. [ ] Stop user access if needed
3. [ ] Execute rollback:
   ```bash
   sf project delete source \
     --manifest src/salesforce-package/manifest/package.xml \
     --target-org production
   ```
   OR restore from backup:
   ```bash
   sf project deploy start \
     --manifest backup/package.xml \
     --target-org production
   ```
4. [ ] Verify rollback successful
5. [ ] Test org functionality
6. [ ] Notify stakeholders of completion
7. [ ] Document rollback reason
8. [ ] Plan remediation

## Success Criteria

### Deployment Success
- [ ] All components deployed without errors
- [ ] All Apex tests passing (75%+ coverage)
- [ ] Lightning components visible in App Builder
- [ ] Chat functionality working
- [ ] Upload functionality working
- [ ] No critical errors in logs
- [ ] Performance within acceptable range
- [ ] User acceptance criteria met

### Production Health
- [ ] API response time < 2s average
- [ ] Error rate < 1%
- [ ] User satisfaction > 80%
- [ ] No security incidents
- [ ] All integrations functioning

## Contact Information

### Support Channels
- **Tribble Support**: support@tribble.ai
- **Documentation**: /Users/sunilrao/dev/SDK/packages/salesforce/README.md
- **Emergency**: [Your escalation contact]

### Key Stakeholders
- [ ] Technical Lead: _______________
- [ ] Business Owner: _______________
- [ ] Salesforce Admin: _______________
- [ ] Security Contact: _______________

---

## Deployment Sign-Off

### Sandbox Deployment
- [ ] Deployed by: _______________ Date: _______________
- [ ] Tested by: _______________ Date: _______________
- [ ] Approved by: _______________ Date: _______________

### Production Deployment
- [ ] Deployed by: _______________ Date: _______________
- [ ] Verified by: _______________ Date: _______________
- [ ] Approved by: _______________ Date: _______________

---

**Notes:**
