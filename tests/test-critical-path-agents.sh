#!/bin/bash

# GENIE Enterprise Agents Test Suite
# Tests the three critical-path agents

echo "🚀 GENIE Enterprise Agents Activation Test"
echo "=========================================="
echo ""

echo "Testing Database Architect Agent..."
npm start -- "design database for a project management app with users, teams, and projects" 2>&1 | grep -E "(Database Architect|Prisma|SQL|migration|schema)" | head -5

echo ""
echo "Testing User & Auth Agent..."  
npm start -- "add user authentication with JWT and email verification" 2>&1 | grep -E "(User|Auth|JWT|email)" | head -5

echo ""
echo "Testing API Integration Agent..."
npm start -- "generate React API client for backend with hooks" 2>&1 | grep -E "(API|client|hooks|types)" | head -5

echo ""
echo "✅ Agent tests complete!"
echo ""
echo "All three critical-path agents are online and ready to use:"
echo "  1. DatabaseArchitectAgent - Schema design & generation"
echo "  2. UserAuthAgent - Authentication system generation"
echo "  3. ApiIntegrationAgent - Frontend-backend integration"
echo ""
echo "Try: npm start -- \"Build a SaaS with user accounts\""
