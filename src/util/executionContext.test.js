/**
 * Unit Tests - Execution Context Manager
 * Tests for src/util/executionContext.js
 */

import { test } from 'node:test';
import assert from 'node:assert';
import {
  executionContextManager,
  getOrCreateContext,
  getCurrentContext,
  cleanupContext
} from '../util/executionContext.js';

test('ExecutionContextManager', async (t) => {
  await t.test('should create context', () => {
    const context = executionContextManager.createContext('trace-123');
    assert.ok(context);
    assert.equal(context.traceId, 'trace-123');
  });

  await t.test('should retrieve created context', () => {
    executionContextManager.clear();
    const created = executionContextManager.createContext('trace-456');
    const retrieved = executionContextManager.getContext('trace-456');
    assert.equal(created, retrieved);
  });

  await t.test('should set and get current trace ID', () => {
    executionContextManager.clear();
    const context1 = executionContextManager.createContext('trace-1');
    const context2 = executionContextManager.createContext('trace-2');
    
    executionContextManager.setCurrentTraceId('trace-1');
    assert.equal(executionContextManager.currentTraceId, 'trace-1');
    
    executionContextManager.setCurrentTraceId('trace-2');
    assert.equal(executionContextManager.currentTraceId, 'trace-2');
  });

  await t.test('should throw on invalid trace ID', () => {
    executionContextManager.clear();
    assert.throws(
      () => executionContextManager.setCurrentTraceId('non-existent'),
      /Trace ID not found/
    );
  });

  await t.test('should cleanup context', () => {
    executionContextManager.clear();
    executionContextManager.createContext('trace-cleanup');
    executionContextManager.cleanupContext('trace-cleanup');
    assert.equal(executionContextManager.getContext('trace-cleanup'), undefined);
  });

  await t.test('should get active contexts', () => {
    executionContextManager.clear();
    executionContextManager.createContext('trace-1');
    executionContextManager.createContext('trace-2');
    
    const active = executionContextManager.getActiveContexts();
    assert.equal(active.length, 2);
  });

  await t.test('should get stats', () => {
    executionContextManager.clear();
    executionContextManager.createContext('trace-1');
    executionContextManager.createContext('trace-2');
    
    const stats = executionContextManager.getStats();
    assert.equal(stats.totalContexts, 2);
    assert.ok(stats.averageElapsedTime >= 0);
  });

  await t.test('should clear all contexts', () => {
    executionContextManager.clear();
    executionContextManager.createContext('trace-1');
    executionContextManager.createContext('trace-2');
    
    executionContextManager.clear();
    const active = executionContextManager.getActiveContexts();
    assert.equal(active.length, 0);
  });
});

test('Context - Metadata Operations', async (t) => {
  await t.test('should set and get metadata', () => {
    executionContextManager.clear();
    const context = getOrCreateContext('trace-meta');
    
    context.setMetadata('userId', '123');
    context.setMetadata('projectName', 'MyProject');
    
    assert.equal(context.getMetadata('userId'), '123');
    assert.equal(context.getMetadata('projectName'), 'MyProject');
  });

  await t.test('should return undefined for non-existent metadata', () => {
    executionContextManager.clear();
    const context = getOrCreateContext('trace-meta-2');
    assert.equal(context.getMetadata('nonExistent'), undefined);
  });
});

test('Context - State Operations', async (t) => {
  await t.test('should set and get state', () => {
    executionContextManager.clear();
    const context = getOrCreateContext('trace-state');
    
    context.setState('agentQueue', ['agent1', 'agent2']);
    context.setState('status', 'running');
    
    assert.deepEqual(context.getState('agentQueue'), ['agent1', 'agent2']);
    assert.equal(context.getState('status'), 'running');
  });

  await t.test('should return undefined for non-existent state', () => {
    executionContextManager.clear();
    const context = getOrCreateContext('trace-state-2');
    assert.equal(context.getState('nonExistent'), undefined);
  });
});

test('Context - Agent Operations', async (t) => {
  await t.test('should set and get current agent', () => {
    executionContextManager.clear();
    const context = getOrCreateContext('trace-agent');
    
    context.setCurrentAgent('ManagerAgent');
    assert.equal(context.getCurrentAgent(), 'ManagerAgent');
    
    context.setCurrentAgent('FrontendAgent');
    assert.equal(context.getCurrentAgent(), 'FrontendAgent');
  });
});

test('Context - LLM Tracker Operations', async (t) => {
  await t.test('should set and get LLM tracker', () => {
    executionContextManager.clear();
    const context = getOrCreateContext('trace-llm');
    
    const mockTracker = { calls: 0 };
    context.setLLMUsageTracker(mockTracker);
    
    assert.equal(context.getLLMUsageTracker(), mockTracker);
  });
});

test('Context - Elapsed Time', async (t) => {
  await t.test('should track elapsed time', async () => {
    executionContextManager.clear();
    const context = getOrCreateContext('trace-time');
    
    const elapsed1 = context.getElapsedTime();
    assert.ok(elapsed1 >= 0);
    
    // Wait 10ms
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const elapsed2 = context.getElapsedTime();
    assert.ok(elapsed2 > elapsed1);
  });
});

test('Context - Snapshot', async (t) => {
  await t.test('should create context snapshot', () => {
    executionContextManager.clear();
    const context = getOrCreateContext('trace-snapshot');
    context.setCurrentAgent('TestAgent');
    context.setState('key', 'value');
    
    const snapshot = context.snapshot();
    
    assert.equal(snapshot.traceId, 'trace-snapshot');
    assert.equal(snapshot.currentAgent, 'TestAgent');
    assert.ok(snapshot.elapsedTime >= 0);
    assert.equal(snapshot.stateSize, 1);
  });
});

test('Helper Functions', async (t) => {
  await t.test('getOrCreateContext should create if not exists', () => {
    executionContextManager.clear();
    const context1 = getOrCreateContext('trace-helper-1');
    assert.ok(context1);
    
    const context2 = getOrCreateContext('trace-helper-1');
    assert.equal(context1, context2); // Same instance
  });

  await t.test('getCurrentContext should return current context', () => {
    executionContextManager.clear();
    const context = getOrCreateContext('trace-current');
    
    const current = getCurrentContext();
    assert.equal(current, context);
  });

  await t.test('cleanupContext should remove context', () => {
    executionContextManager.clear();
    const context = getOrCreateContext('trace-cleanup-helper');
    
    cleanupContext('trace-cleanup-helper');
    assert.equal(executionContextManager.getContext('trace-cleanup-helper'), undefined);
  });
});
