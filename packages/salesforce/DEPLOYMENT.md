# Salesforce Deployment Guide

Production-ready deployment guide for Tribble SDK Salesforce package.

## Pre-Deployment Checklist

### 1. Environment Preparation

- [ ] Salesforce org type identified (Sandbox/Production)
- [ ] Salesforce CLI installed and authenticated
- [ ] Tribble API credentials obtained
- [ ] Remote Site Settings approved by security team
- [ ] User permissions mapped
- [ ] Backup of existing org created

### 2. Security Review

- [ ] API endpoints whitelisted in Remote Site Settings
- [ ] OAuth credentials secured (if using OAuth)
- [ ] Named Credentials configured (if applicable)
- [ ] Custom Metadata Type permissions reviewed
- [ ] Field-Level Security configured
- [ ] Sharing rules documented

### 3. Testing Environment

- [ ] Package deployed to Sandbox
- [ ] All Apex tests passing (90%+ coverage)
- [ ] Lightning Web Components tested
- [ ] Integration tests completed
- [ ] Performance testing completed
- [ ] User acceptance testing (UAT) passed

## Deployment Methods

### Method 1: Salesforce CLI (Recommended)

Best for: Automated deployments, CI/CD pipelines

```bash
# 1. Build package
npm run build:salesforce

# 2. Validate deployment
sf project deploy validate \
  --manifest src/salesforce-package/manifest/package.xml \
  --target-org production \
  --test-level RunLocalTests

# 3. Deploy to production
sf project deploy start \
  --manifest src/salesforce-package/manifest/package.xml \
  --target-org production \
  --test-level RunLocalTests \
  --wait 30

# 4. Monitor deployment
sf project deploy report --target-org production
```

### Method 2: Change Sets

Best for: Controlled deployments with approval process

1. **In Sandbox:**
   - Deploy package to Sandbox
   - Navigate to Setup → Deployment Settings
   - Enable inbound/outbound change sets
   - Create outbound change set
   - Add all Tribble components
   - Upload change set

2. **In Production:**
   - Navigate to Setup → Inbound Change Sets
   - Deploy change set
   - Run tests
   - Activate

### Method 3: Workbench

Best for: Manual deployments, small orgs

1. Build package: `npm run build:salesforce`
2. Create ZIP of `dist/salesforce-package`
3. Navigate to [Workbench](https://workbench.developerforce.com)
4. Login to production org
5. Migration → Deploy
6. Upload ZIP
7. Configure options:
   - Check "Run All Tests"
   - Check "Rollback On Error"
8. Deploy

### Method 4: Metadata API

Best for: Custom deployment tools

```javascript
// Using JSforce
const jsforce = require('jsforce');
const fs = require('fs');

const conn = new jsforce.Connection({
  loginUrl: 'https://login.salesforce.com'
});

await conn.login(username, password);

const zipStream = fs.createReadStream('salesforce-package.zip');
const deployResult = await conn.metadata.deploy(zipStream, {
  runTests: true,
  rollbackOnError: true
});
```

## Deployment Steps

### Phase 1: Pre-Production (Sandbox)

#### Step 1: Initial Deployment

```bash
# Login to sandbox
sf org login web --alias tribble-sandbox

# Deploy
sf project deploy start \
  --manifest src/salesforce-package/manifest/package.xml \
  --target-org tribble-sandbox \
  --test-level RunLocalTests
```

#### Step 2: Configuration

1. **Remote Site Settings:**
   - Setup → Security → Remote Site Settings
   - Add `Tribble_API_Production`
   - URL: `https://api.tribble.ai`

2. **Custom Metadata Type:**
   - Setup → Custom Metadata Types → Tribble Configuration
   - Create "Default_Config" record
   - Set API endpoint and authentication

3. **User Permissions:**
   - Create Permission Set: `Tribble_User`
   - Assign to test users

#### Step 3: Testing

Run comprehensive tests:

```bash
# Run all Apex tests
sf apex run test \
  --class-names TribbleAPIClientTest \
  --result-format human \
  --target-org tribble-sandbox

# Check code coverage
sf apex get test \
  --code-coverage \
  --target-org tribble-sandbox
```

Manual testing:
- [ ] Chat component responds correctly
- [ ] File upload works for all formats
- [ ] Error handling displays properly
- [ ] Mobile responsive design works
- [ ] Performance is acceptable

#### Step 4: User Acceptance Testing

1. Add components to Lightning pages
2. Have business users test workflows
3. Document any issues
4. Fix and redeploy
5. Get sign-off

### Phase 2: Production Deployment

#### Step 1: Deployment Window

Schedule deployment during low-usage period:
- Communicate to all users
- Plan for 1-2 hour window
- Have rollback plan ready

#### Step 2: Pre-Deployment Backup

```bash
# Backup metadata
sf project retrieve start \
  --target-org production \
  --output-dir ./backup/pre-deployment

# Document current state
sf org display --target-org production > org-state.txt
```

#### Step 3: Production Deploy

```bash
# Login to production
sf org login web --alias tribble-production

# Validate first (IMPORTANT)
sf project deploy validate \
  --manifest src/salesforce-package/manifest/package.xml \
  --target-org tribble-production \
  --test-level RunLocalTests

# Get validation ID
sf project deploy report --target-org tribble-production

# Quick deploy using validation ID
sf project deploy quick \
  --job-id <VALIDATION_ID> \
  --target-org tribble-production
```

#### Step 4: Post-Deployment Verification

1. **Smoke Tests:**
   ```bash
   # Run critical tests
   sf apex run test \
     --class-names TribbleAPIClientTest \
     --target-org tribble-production
   ```

2. **Component Verification:**
   - Login to production org
   - Open Lightning App Builder
   - Verify components are available
   - Test on a sample page

3. **Integration Tests:**
   - Send test chat message
   - Upload test document
   - Verify API connectivity

#### Step 5: Configuration

1. **Remote Site Settings** (if not included in deployment):
   - Setup → Security → Remote Site Settings
   - Activate `Tribble_API_Production`

2. **Custom Metadata**:
   - Setup → Custom Metadata Types → Tribble Configuration
   - Update "Default_Config" with production API key

3. **User Rollout**:
   - Assign Permission Set to pilot users
   - Monitor usage and errors
   - Gradually expand to all users

### Phase 3: Post-Deployment

#### Monitoring

1. **Debug Logs:**
   ```bash
   # Enable logging
   sf apex tail log --target-org tribble-production
   ```

2. **API Usage:**
   - Monitor Tribble dashboard
   - Check API call volume
   - Review error rates

3. **User Adoption:**
   - Track component usage
   - Collect feedback
   - Document common questions

#### Rollback Plan

If issues arise:

```bash
# Option 1: Rollback via CLI
sf project deploy start \
  --manifest backup/pre-deployment/package.xml \
  --target-org tribble-production

# Option 2: Delete components
sf project delete source \
  --manifest src/salesforce-package/manifest/package.xml \
  --target-org tribble-production
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Salesforce Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Salesforce CLI
        run: npm install -g @salesforce/cli

      - name: Build package
        run: |
          cd packages/salesforce
          npm install
          npm run build:salesforce

      - name: Authorize Salesforce
        run: |
          echo "${{ secrets.SFDX_AUTH_URL }}" > auth.txt
          sf org login sfdx-url --sfdx-url-file auth.txt --alias production

      - name: Deploy to Salesforce
        run: |
          sf project deploy start \
            --manifest packages/salesforce/src/salesforce-package/manifest/package.xml \
            --target-org production \
            --test-level RunLocalTests
```

### Jenkins Pipeline Example

```groovy
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh 'cd packages/salesforce && npm install'
                sh 'cd packages/salesforce && npm run build:salesforce'
            }
        }

        stage('Validate') {
            steps {
                sh '''
                    sf project deploy validate \
                      --manifest packages/salesforce/src/salesforce-package/manifest/package.xml \
                      --target-org ${SALESFORCE_ORG} \
                      --test-level RunLocalTests
                '''
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    sf project deploy start \
                      --manifest packages/salesforce/src/salesforce-package/manifest/package.xml \
                      --target-org ${SALESFORCE_ORG} \
                      --test-level RunLocalTests
                '''
            }
        }
    }
}
```

## Troubleshooting Deployment Issues

### Common Errors

**Error: "This package or component is in use"**
```bash
# Solution: Check dependencies
sf project deploy report --target-org production

# Remove dependencies first
sf project delete source --metadata CustomApplication:MyApp
```

**Error: "Insufficient test coverage"**
```bash
# Solution: Run tests first
sf apex run test --target-org production --code-coverage

# Ensure 75%+ coverage for production
```

**Error: "Remote site setting not found"**
```bash
# Solution: Deploy Remote Site Settings separately
sf project deploy start \
  --metadata-dir src/salesforce-package/remoteSiteSettings \
  --target-org production
```

### Debug Deployment

```bash
# Get detailed deployment status
sf project deploy report \
  --job-id <DEPLOY_ID> \
  --target-org production

# Check deployment history
sf project deploy history \
  --target-org production
```

## Best Practices

1. **Always validate before deploying to production**
2. **Use quick deploy for faster deployments**
3. **Run all tests in production**
4. **Monitor debug logs during deployment**
5. **Have rollback plan ready**
6. **Test in sandbox first**
7. **Deploy during low-usage windows**
8. **Communicate with stakeholders**
9. **Document all changes**
10. **Monitor post-deployment**

## Support

For deployment issues:
- Check logs: Setup → Debug Logs
- Review deployment status: Setup → Deployment Status
- Contact: support@tribble.ai
- Documentation: [docs.tribble.ai](https://docs.tribble.ai)

---

**Remember:** Always test in Sandbox before deploying to Production!
