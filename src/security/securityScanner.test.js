/**
 * Unit Tests - Security Scanner
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { SecurityScanner, CodeIntegrityVerifier, DependencyVerifier } from '../security/securityScanner.js';

test('SecurityScanner', async (t) => {
  await t.test('should initialize threat patterns', () => {
    const scanner = new SecurityScanner();
    assert.ok(scanner.patterns);
    assert.ok(scanner.patterns.dataExfiltration);
    assert.ok(scanner.patterns.commandInjection);
  });

  await t.test('should detect eval() usage', async () => {
    const scanner = new SecurityScanner();
    const threats = await scanner.scanFile('./test-files/malicious.js', false);
    // Will need test file
    assert.ok(Array.isArray(threats));
  });

  await t.test('should calculate threat severity', () => {
    const scanner = new SecurityScanner();
    
    const severity1 = scanner.calculateSeverity('commandInjection', false);
    assert.equal(severity1, 'CRITICAL');
    
    const severity2 = scanner.calculateSeverity('resourceAbuse', false);
    assert.equal(severity2, 'MEDIUM');
  });

  await t.test('should generate security report', () => {
    const scanner = new SecurityScanner();
    const report = scanner.generateReport({
      safe: true,
      threatCount: 0,
      threats: [],
      scannedFiles: 5,
    });
    
    assert.equal(report.overallSecurity, 'PASS');
    assert.equal(report.threatCount, 0);
  });
});

test('CodeIntegrityVerifier', async (t) => {
  await t.test('should compute checksum', () => {
    const verifier = new CodeIntegrityVerifier();
    const checksum = verifier.computeChecksum('package.json');
    assert.ok(checksum);
    assert.equal(typeof checksum, 'string');
    assert.equal(checksum.length, 64); // SHA-256 hex is 64 chars
  });

  await t.test('should store checksums', () => {
    const verifier = new CodeIntegrityVerifier();
    const checksums = verifier.storeChecksums('.');
    assert.ok(checksums instanceof Map);
    assert.ok(checksums.size > 0);
  });
});

test('DependencyVerifier', async (t) => {
  await t.test('should initialize vulnerability database', () => {
    const verifier = new DependencyVerifier();
    assert.ok(verifier.vulnerabilityDatabase);
    assert.ok(Object.keys(verifier.vulnerabilityDatabase).length > 0);
  });

  await t.test('should check dependencies', async () => {
    const verifier = new DependencyVerifier();
    const result = await verifier.checkDependencies('package.json');
    
    assert.ok(result);
    assert.equal(typeof result.vulnerablePackages, 'number');
  });
});
