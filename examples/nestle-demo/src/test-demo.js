import 'dotenv/config';

/**
 * Comprehensive test suite for Nestlé KAM Demo
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_STORE_ID = 'UK12345';

// Utilities
function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function error(message) {
  console.error(`❌ ${message}`);
}

function success(message) {
  console.log(`✅ ${message}`);
}

async function request(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: response.status, data };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test suites
async function testHealth() {
  log('🏥', 'Testing health endpoint...');
  const { status, data } = await request('GET', '/health');

  if (status === 200 && data.ok) {
    success(`Health check passed (mockData: ${data.mockData})`);
    return true;
  }

  error('Health check failed');
  return false;
}

async function testStores() {
  log('🏪', 'Testing stores endpoint...');
  const { status, data } = await request('GET', '/stores');

  if (status === 200 && Array.isArray(data.stores) && data.stores.length > 0) {
    success(`Found ${data.stores.length} stores`);
    return true;
  }

  error('Stores endpoint failed');
  return false;
}

async function testStoreProfile() {
  log('📋', `Testing store profile for ${TEST_STORE_ID}...`);
  const { status, data } = await request('GET', `/stores/${TEST_STORE_ID}`);

  if (status === 200 && data.storeId === TEST_STORE_ID) {
    success(`Store profile loaded: ${data.name}`);
    return true;
  }

  error('Store profile failed');
  return false;
}

async function testVisitHistory() {
  log('📅', `Testing visit history for ${TEST_STORE_ID}...`);
  const { status, data } = await request('GET', `/stores/${TEST_STORE_ID}/visits?count=3`);

  if (status === 200 && Array.isArray(data.visits) && data.visits.length > 0) {
    success(`Loaded ${data.visits.length} visits`);
    return true;
  }

  error('Visit history failed');
  return false;
}

async function testSalesData() {
  log('💰', `Testing sales data for ${TEST_STORE_ID}...`);
  const { status, data } = await request('GET', `/stores/${TEST_STORE_ID}/sales`);

  if (status === 200 && data.categorySales && data.skuPerformance) {
    success(`Sales data loaded: ${data.categorySales.length} categories, ${data.skuPerformance.length} SKUs`);
    return true;
  }

  error('Sales data failed');
  return false;
}

async function testSimilarStores() {
  log('🔍', `Testing similar store successes for ${TEST_STORE_ID}...`);
  const { status, data } = await request('GET', `/stores/${TEST_STORE_ID}/similar-successes`);

  if (status === 200 && Array.isArray(data.successes)) {
    success(`Found ${data.successes.length} similar store success cases`);
    return true;
  }

  error('Similar stores failed');
  return false;
}

async function testQuickIntelligence() {
  log('🧠', `Testing quick intelligence for ${TEST_STORE_ID}...`);
  const { status, data } = await request('GET', `/kam/intelligence/${TEST_STORE_ID}`);

  if (status === 200 && data.nextBestActions && data.performance) {
    success(`Intelligence generated: ${data.nextBestActions.length} actions, ${data.riskAlerts.length} alerts`);
    return true;
  }

  error('Quick intelligence failed');
  return false;
}

async function testFullPrepJob() {
  log('🚀', 'Testing full prep job orchestration...');

  // Start job
  log('  📤', 'Starting prep job...');
  const startResp = await request('POST', '/kam/prep/start', {
    storeId: TEST_STORE_ID,
    kamEmail: 'test@nestle.com',
    visitType: 'routine',
    generateArtifacts: true
  });

  if (startResp.status !== 202) {
    error('Failed to start prep job');
    console.log(startResp);
    return false;
  }

  const jobId = startResp.data.jobId;
  success(`  Job started: ${jobId}`);

  // Poll for completion
  log('  ⏳', 'Waiting for job completion...');
  let attempts = 0;
  let completed = false;

  while (attempts < 60 && !completed) {
    await sleep(2000);
    attempts++;

    const statusResp = await request('GET', `/kam/prep/${jobId}/status`);

    if (statusResp.status === 200) {
      const status = statusResp.data.status;
      const progress = statusResp.data.progress;

      process.stdout.write(`\r  📊 Status: ${status} | Collection: ${progress.collection}% | Analysis: ${progress.analysis}% | Generation: ${progress.generation}%`);

      if (status === 'completed') {
        completed = true;
        console.log(''); // New line
        success('  Job completed!');
      } else if (status === 'failed') {
        console.log(''); // New line
        error(`  Job failed: ${statusResp.data.errors.join(', ')}`);
        return false;
      }
    }
  }

  if (!completed) {
    error('  Job timed out');
    return false;
  }

  // Get result
  log('  📥', 'Fetching result...');
  const resultResp = await request('GET', `/kam/prep/${jobId}/result`);

  if (resultResp.status !== 200) {
    error('  Failed to fetch result');
    return false;
  }

  const result = resultResp.data;
  success(`  Result retrieved:`);
  console.log(`     - Next Best Actions: ${result.brief.nextBestActions?.length || 0}`);
  console.log(`     - Risk Alerts: ${result.brief.riskAlerts?.length || 0}`);
  console.log(`     - Talking Points: ${result.brief.talkingPoints?.length || 0}`);
  console.log(`     - Similar Stores: ${result.brief.similarStoreSuccesses?.length || 0}`);

  // Check artifacts
  if (result.artifacts.markdown) {
    log('  📄', 'Testing markdown artifact download...');
    const artifactResp = await request('GET', `/kam/prep/${jobId}/artifact/markdown`);
    if (artifactResp.status === 200 && typeof artifactResp.data === 'string') {
      success(`  Markdown artifact downloaded (${artifactResp.data.length} chars)`);
    } else {
      error('  Markdown artifact download failed');
    }
  }

  if (result.artifacts.onepager) {
    log('  📱', 'Testing onepager artifact download...');
    const onepagerResp = await request('GET', `/kam/prep/${jobId}/artifact/onepager`);
    if (onepagerResp.status === 200 && typeof onepagerResp.data === 'string') {
      success(`  Onepager artifact downloaded (${onepagerResp.data.length} chars)`);
    } else {
      error('  Onepager artifact download failed');
    }
  }

  if (result.artifacts.json) {
    log('  📦', 'Testing JSON artifact download...');
    const jsonResp = await request('GET', `/kam/prep/${jobId}/artifact/json`);
    if (jsonResp.status === 200) {
      success(`  JSON artifact downloaded`);
    } else {
      error('  JSON artifact download failed');
    }
  }

  return true;
}

async function runTests() {
  console.log('\n🧪 Nestlé KAM Demo - Comprehensive Test Suite\n');
  console.log(`🎯 Target: ${BASE_URL}\n`);

  const results = [];

  // Basic endpoint tests
  results.push({ name: 'Health Check', passed: await testHealth() });
  results.push({ name: 'Stores List', passed: await testStores() });
  results.push({ name: 'Store Profile', passed: await testStoreProfile() });
  results.push({ name: 'Visit History', passed: await testVisitHistory() });
  results.push({ name: 'Sales Data', passed: await testSalesData() });
  results.push({ name: 'Similar Stores', passed: await testSimilarStores() });
  results.push({ name: 'Quick Intelligence', passed: await testQuickIntelligence() });

  // Full integration test
  console.log('\n─────────────────────────────────────────────────────');
  results.push({ name: 'Full Prep Job', passed: await testFullPrepJob() });
  console.log('─────────────────────────────────────────────────────\n');

  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  console.log('\n📊 Test Summary\n');
  results.forEach(r => {
    console.log(`  ${r.passed ? '✅' : '❌'} ${r.name}`);
  });

  console.log(`\n${passed === total ? '🎉' : '⚠️'} ${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log('✨ All tests passed! Demo is ready for presentation.\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}