#!/usr/bin/env node

/**
 * Build script for Salesforce package
 * Validates and packages Tribble SDK components for Salesforce deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_DIR = path.join(__dirname, '../src/salesforce-package');
const MANIFEST_FILE = path.join(PACKAGE_DIR, 'manifest/package.xml');
const OUTPUT_DIR = path.join(__dirname, '../dist/salesforce-package');

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

/**
 * Validate package structure
 */
function validatePackageStructure() {
  logInfo('Validating package structure...');

  const requiredDirs = [
    'classes',
    'lwc',
    'objects',
    'remoteSiteSettings',
    'manifest',
  ];

  const missingDirs = [];

  for (const dir of requiredDirs) {
    const dirPath = path.join(PACKAGE_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      missingDirs.push(dir);
    }
  }

  if (missingDirs.length > 0) {
    logError(`Missing required directories: ${missingDirs.join(', ')}`);
    return false;
  }

  logSuccess('Package structure is valid');
  return true;
}

/**
 * Validate Apex classes
 */
function validateApexClasses() {
  logInfo('Validating Apex classes...');

  const classesDir = path.join(PACKAGE_DIR, 'classes');
  const files = fs.readdirSync(classesDir);
  const apexClasses = files.filter(f => f.endsWith('.cls'));

  if (apexClasses.length === 0) {
    logWarning('No Apex classes found');
    return true;
  }

  let valid = true;

  for (const className of apexClasses) {
    const classPath = path.join(classesDir, className);
    const metaPath = classPath + '-meta.xml';

    if (!fs.existsSync(metaPath)) {
      logError(`Missing metadata file for ${className}`);
      valid = false;
    }

    // Check for syntax errors (basic validation)
    const content = fs.readFileSync(classPath, 'utf8');
    if (!content.includes('class ') && !content.includes('interface ')) {
      logWarning(`${className} may not be a valid Apex class`);
    }
  }

  if (valid) {
    logSuccess(`Validated ${apexClasses.length} Apex class(es)`);
  }

  return valid;
}

/**
 * Validate Lightning Web Components
 */
function validateLWC() {
  logInfo('Validating Lightning Web Components...');

  const lwcDir = path.join(PACKAGE_DIR, 'lwc');
  const components = fs.readdirSync(lwcDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  if (components.length === 0) {
    logWarning('No Lightning Web Components found');
    return true;
  }

  let valid = true;

  for (const component of components) {
    const componentDir = path.join(lwcDir, component);
    const requiredFiles = [
      `${component}.js`,
      `${component}.html`,
      `${component}.js-meta.xml`,
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(componentDir, file);
      if (!fs.existsSync(filePath)) {
        logError(`Missing required file: ${component}/${file}`);
        valid = false;
      }
    }
  }

  if (valid) {
    logSuccess(`Validated ${components.length} Lightning Web Component(s)`);
  }

  return valid;
}

/**
 * Validate package.xml manifest
 */
function validateManifest() {
  logInfo('Validating package.xml manifest...');

  if (!fs.existsSync(MANIFEST_FILE)) {
    logError('package.xml manifest not found');
    return false;
  }

  const content = fs.readFileSync(MANIFEST_FILE, 'utf8');

  // Basic XML validation
  if (!content.includes('<Package') || !content.includes('</Package>')) {
    logError('Invalid package.xml format');
    return false;
  }

  if (!content.includes('<version>')) {
    logError('Missing API version in package.xml');
    return false;
  }

  logSuccess('package.xml is valid');
  return true;
}

/**
 * Copy package to output directory
 */
function copyPackage() {
  logInfo('Copying package to output directory...');

  // Remove existing output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }

  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Copy package directory
  copyRecursive(PACKAGE_DIR, OUTPUT_DIR);

  logSuccess(`Package copied to ${OUTPUT_DIR}`);
  return true;
}

/**
 * Recursively copy directory
 */
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);

    for (const file of files) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

/**
 * Generate deployment summary
 */
function generateSummary() {
  logInfo('Generating deployment summary...');

  const summary = {
    timestamp: new Date().toISOString(),
    components: {
      apexClasses: countFiles(path.join(PACKAGE_DIR, 'classes'), '.cls'),
      lwc: countDirectories(path.join(PACKAGE_DIR, 'lwc')),
      customObjects: countFiles(path.join(PACKAGE_DIR, 'objects'), '.object'),
      remoteSiteSettings: countFiles(path.join(PACKAGE_DIR, 'remoteSiteSettings'), '.remoteSite'),
    },
    outputDirectory: OUTPUT_DIR,
  };

  const summaryPath = path.join(OUTPUT_DIR, 'deployment-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  logSuccess('Deployment summary generated');

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('DEPLOYMENT SUMMARY');
  console.log('='.repeat(50));
  console.log(`Apex Classes:          ${summary.components.apexClasses}`);
  console.log(`Lightning Components:  ${summary.components.lwc}`);
  console.log(`Custom Objects:        ${summary.components.customObjects}`);
  console.log(`Remote Site Settings:  ${summary.components.remoteSiteSettings}`);
  console.log('='.repeat(50) + '\n');

  return true;
}

/**
 * Count files with extension in directory
 */
function countFiles(dir, extension) {
  if (!fs.existsSync(dir)) return 0;
  const files = fs.readdirSync(dir);
  return files.filter(f => f.endsWith(extension)).length;
}

/**
 * Count directories
 */
function countDirectories(dir) {
  if (!fs.existsSync(dir)) return 0;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  return items.filter(item => item.isDirectory()).length;
}

/**
 * Main build process
 */
function build() {
  console.log('\n' + '='.repeat(50));
  console.log('TRIBBLE SDK - SALESFORCE PACKAGE BUILDER');
  console.log('='.repeat(50) + '\n');

  const steps = [
    { name: 'Validate Package Structure', fn: validatePackageStructure },
    { name: 'Validate Apex Classes', fn: validateApexClasses },
    { name: 'Validate Lightning Web Components', fn: validateLWC },
    { name: 'Validate Manifest', fn: validateManifest },
    { name: 'Copy Package', fn: copyPackage },
    { name: 'Generate Summary', fn: generateSummary },
  ];

  let success = true;

  for (const step of steps) {
    try {
      if (!step.fn()) {
        success = false;
        break;
      }
    } catch (error) {
      logError(`Error in ${step.name}: ${error.message}`);
      success = false;
      break;
    }
  }

  console.log('\n' + '='.repeat(50));
  if (success) {
    logSuccess('BUILD SUCCESSFUL');
    console.log('\nNext steps:');
    console.log('1. Review the package at: ' + OUTPUT_DIR);
    console.log('2. Deploy using: npm run deploy:validate');
    console.log('3. Or use Salesforce CLI directly');
  } else {
    logError('BUILD FAILED');
    process.exit(1);
  }
  console.log('='.repeat(50) + '\n');
}

// Run build
build();
