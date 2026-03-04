# DeploymentAgent Guide

Complete guide to the DeploymentAgent for production infrastructure generation.

## Overview

The **DeploymentAgent** generates complete, production-ready deployment infrastructure for containerized applications. It creates Docker configurations, Kubernetes manifests, CI/CD pipelines, cloud provider configurations, and comprehensive deployment documentation.

**Key Feature:** One agent generates everything needed to go from code → production deployment.

## What Gets Generated

### 1. Docker Setup (3 files)
- **Dockerfile** - Optimized multi-stage build for Node.js
  - Alpine-based for small size
  - Non-root user for security
  - Health checks configured
  - Production-ready configuration

- **docker-compose.yml** - Full local dev environment
  - Application container
  - PostgreSQL database with health checks
  - Redis cache with persistence
  - Prometheus monitoring stack
  - Volume management and networking

- **.dockerignore** - Optimized builds
  - Excludes unnecessary files
  - Reduces image size
  - Improves build performance

### 2. Kubernetes Manifests (7 files)

#### deployment.yaml
- 3 replicas for high availability
- Rolling update strategy
- Resource requests & limits
- Security context (non-root user)
- Liveness & readiness probes
- Pod anti-affinity for distribution
- Prometheus metrics annotations

#### service.yaml
- ClusterIP for internal communication
- Load balancing across replicas
- Session affinity configuration

#### ingress.yaml
- TLS/SSL with cert-manager
- Domain routing
- Rate limiting
- SSL redirect enforcement

#### configmap.yaml
- Environment configuration
- Database credentials (secrets)
- API keys and tokens
- Feature flags

#### hpa.yaml (Horizontal Pod Autoscaler)
- Min replicas: 3
- Max replicas: 10
- CPU threshold: 70%
- Memory threshold: 80%
- Aggressive scale-up, conservative scale-down

#### serviceaccount.yaml
- Service account for pod identity
- RBAC role and binding
- Principle of least privilege
- Can read configs and access secrets

### 3. GitHub Actions CI/CD (2 workflows)

#### CI Pipeline (ci.yml)
Runs on: push to main/develop, pull requests

Steps:
1. **Checkout** code
2. **Setup Node.js** with npm cache
3. **Install** dependencies
4. **Lint** code (ESLint)
5. **Test** with coverage
6. **Upload** coverage to Codecov
7. **Security** scan with Snyk
8. **Build** application

#### Deploy Pipeline (deploy.yml)
Runs on: push to main or tag creation

Steps:
1. **Build Docker image** with buildx
2. **Push to registry** (GitHub Container Registry)
3. **Tag with** git ref/version/commit
4. **Deploy to Kubernetes** via kubectl
5. **Rollout status** check
6. **Slack notification** on success/failure

### 4. Terraform/CloudFormation (2 files)

#### main.tf
AWS infrastructure as code:
- VPC with 2 AZs
- Public/private subnets
- EKS cluster (Kubernetes)
- EKS node groups (worker nodes)
- RDS PostgreSQL database
- ElastiCache Redis cluster
- Network security groups
- S3 backend for state management

#### variables.tf
Configurable parameters:
- AWS region
- Cluster size
- Database specs
- Network CIDR ranges
- Environments

### 5. Environment Configuration (2 files)

#### .env.production
Production environment variables:
- Database connections
- Cache settings
- JWT/Auth tokens
- Security headers
- Feature flags
- External service credentials
- Monitoring/observability keys

#### secrets-template.yaml
Kubernetes secrets template:
- Base64-encoded credentials
- Database URL
- API keys
- JWT secrets
- AWS credentials
- Sentry DSN

### 6. Database Setup (2 files)

#### 001-initial-schema.sql
Initial database migrations:
- Users table with auth
- Sessions table for JWT
- Audit logs for compliance
- Indexes for performance
- Constraints for data integrity

#### migrate.sh
Migration runner script:
- Executes SQL migration files in order
- Error handling and rollback
- Schema verification
- Runs automatically on deployment

### 7. SSL/TLS Configuration (2 files)

#### cert-manager.yaml
- Let's Encrypt integration
- Automatic certificate renewal
- ClusterIssuer for prod/staging
- ACME HTTP-01 solver

#### nginx-ingress.yaml
- NGINX Ingress Controller
- TLS termination
- Metrics collection
- Load balancing

### 8. Health Checks (1 file)

#### health.js
Three health check endpoints:
- **/health/live** - Is app running? (liveness probe)
- **/health/ready** - Can serve requests? (readiness probe)
- **/health** - Full health report
  - Database status
  - Cache status
  - Memory usage
  - Disk space
  - Service dependencies

### 9. Deployment Guide (1 file)

#### DEPLOYMENT.md
Complete deployment documentation:
- Prerequisites
- Local development setup
- EKS deployment step-by-step
- Docker Swarm option
- CI/CD pipeline explanation
- Monitoring deployment
- Rollback procedures
- Performance tuning
- Security hardening checklist
- Backup & recovery procedures
- Scaling strategies
- Maintenance windows
- Troubleshooting

### 10. Monitoring Integration (2 files)

#### prometheus.yml
- Scrape configuration
- Data retention
- Alert managers
- Metric labels
- Endpoint discovery

#### alert-rules.yml
Production alerting rules:
- High error rate (>5%)
- Pod crashes/restarts
- Database unavailable
- High memory usage
- Query latency
- Connection pool exhaustion

### 11. Disaster Recovery (1 file)

#### RECOVERY.md
Incident response procedures:
- Database failures & recovery
- Cache failures
- Container crashes
- Network issues
- Backup & restore procedures
- Incident severity levels
- Response time SLAs
- Post-incident review checklist

## Usage

### Basic Usage

```javascript
import { DeploymentAgent } from "./agents/deploymentAgent.js";

const deploymentAgent = new DeploymentAgent({ logger });

const result = await deploymentAgent.setupDeployment({
  appName: "my-app",
  platforms: ["docker", "kubernetes", "aws"],
  scaling: true,
  ssl: true,
});

// Returns 20-25 deployment files
console.log(result.patches.length); // Output: ~25
```

### Example Output Structure

```
Generated Files:
├── Docker Setup
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .dockerignore
├── Kubernetes (k8s/)
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── hpa.yaml
│   └── serviceaccount.yaml
├── GitHub Actions (.github/workflows/)
│   ├── ci.yml
│   └── deploy.yml
├── Terraform (terraform/)
│   ├── main.tf
│   └── variables.tf
├── Configuration
│   ├── .env.production
│   └── k8s/secrets-template.yaml
├── Database (scripts/)
│   ├── migrations/001-initial-schema.sql
│   └── migrate.sh
├── SSL/TLS (k8s/)
│   ├── cert-manager.yaml
│   └── nginx-ingress.yaml
├── Health Checks
│   └── src/routes/health.js
├── Monitoring (monitoring/)
│   ├── prometheus.yml
│   └── alert-rules.yml
└── Documentation (docs/)
    ├── DEPLOYMENT.md
    └── RECOVERY.md
```

## Integration with Other Agents

### Complete SaaS Stack Generation

```javascript
// 1. Database Design
const dbResult = await agents.databaseArchitect.designSchema(request);

// 2. User Authentication
const authResult = await agents.userAuth.generateAuthSystem(request);

// 3. Frontend API Integration
const apiResult = await agents.apiIntegration.generateApiClient(request);

// 4. Security Hardening
const secResult = await agents.securityHardening.hardenApplication(request);

// 5. Monitoring Setup
const monResult = await agents.monitoring.setupMonitoring(request);

// 6. Production Deployment ⭐
const deployResult = await agents.deployment.setupDeployment(request);

// Total: Complete production-ready SaaS application!
```

## Deployment Strategies

### Option 1: AWS EKS (Recommended)

1. **Infrastructure Setup** - Terraform creates AWS resources
2. **Container Build** - GitHub Actions builds & pushes image
3. **Deployment** - kubectl applies Kubernetes manifests
4. **Auto-scaling** - HPA scales based on metrics
5. **Certificate** - cert-manager handles SSL renewal

### Option 2: Docker Swarm (Simpler)

```bash
docker stack deploy -c docker-compose.yml app
```

Good for:
- Development/staging
- Single/small teams
- Quick prototyping

### Option 3: On-Premise K8s

Use same Kubernetes manifests,  point to your cluster.

## Performance Tuning

### Database
- Adjust `DATABASE_POOL_SIZE` (default: 20)
- Monitor connection utilization
- Enable query logging
- Create appropriate indexes

### Caching
- Configure Redis eviction policy
- Monitor hit/miss ratio
- Tune TTLs for data

### Kubernetes
- Adjust resource requests/limits
- Review HPA thresholds
- Enable cluster autoscaling
- Monitor node utilization

## Security Features Built-In

✅ Non-root container user  
✅ Read-only root filesystem  
✅ Resource limits (DoS prevention)  
✅ Security context enforcement  
✅ RBAC for service accounts  
✅ Network policies ready  
✅ TLS everywhere  
✅ Secrets encryption  
✅ Audit logging  
✅ Rate limiting  

## Monitoring & Observability

### Metrics Collected

- HTTP requests (total, duration, errors)
- Database queries (latency, errors)
- Memory usage
- CPU usage
- Cache hit rate
- Error rates and types
- Custom business metrics

### Alert Rules Included

- **Error rate > 5%** - Alert immediately
- **Response time p95 > 1s** - Warn
- **Memory > 90%** - Scale up
- **Pod crashes** - Page on-call
- **Database unavailable** - Critical alert
- **Disk > 85%** - Maintenance needed

### Dashboards Provided

- Application health
- Request metrics
- Error tracking
- Database performance
- Cache performance
- System resources

## Cost Optimization

Generated infrastructure is designed for cost:

- **Small cluster** - Starts with 3 nodes, scales to 10
- **Spot instances** - Can use AWS Spot for nodes
- **RDS** - `db.t3.micro` (free tier eligible)
- **Redis** - `cache.t3.micro` (free tier eligible)
- **Networking** - Efficient load balancing
- **Storage** - Auto-scaling based on demand

**Estimated monthly cost** (AWS):
- EKS cluster: ~$73/month
- t3.medium nodes (3): ~$20/month/node = $60/month
- RDS db.t3.micro: ~$16/month
- ElastiCache t3.micro: ~$16/month
- **Total: ~$165/month**

## Common Operations

### Deploy New Version

```bash
# Automatically via GitHub Actions on push to main
# Or manually:

# Build image
docker build -t my-app:v1.0.0 .

# Push to registry
docker push my-app:v1.0.0

# Update deployment
kubectl set image \
  deployment/app-deployment \
  app=my-app:v1.0.0 \
  -n production

# Monitor rollout
kubectl rollout status deployment/app-deployment -n production
```

### Scale Application

```bash
# Manual scaling
kubectl scale deployment app-deployment --replicas=5 -n production

# Or adjust HPA
kubectl edit hpa app-hpa -n production
```

### Database Migration

```bash
# Run migrations before deployment
./scripts/migrate.sh $DATABASE_URL

# Rollback if needed
./scripts/rollback.sh $DATABASE_URL
```

### View Logs

```bash
# App logs
kubectl logs -f deployment/app-deployment -n production

# Metrics
kubectl port-forward svc/app-service 9090:9090 -n production
# Access: http://localhost:9090

# Prometheus
kubectl port-forward svc/prometheus 9090:9090 -n monitoring
```

## Backup & Disaster Recovery

### Database Backups

```bash
# Daily automated backups to S3
# Manual backup:
pg_dump $DATABASE_URL > backup.sql

# Restore:
psql $DATABASE_URL < backup.sql
```

### Redis Backups

Automatic with `appendonly yes` configuration.

### Complete Disaster Recovery

- Multi-region failover capable
- Point-in-time recovery (7 days)
- Full disaster recovery runbook included
- Monthly recovery drills recommended

## Support Features

✅ Complete deployment documentation  
✅ Multi-cloud deployment options  
✅ Automatic CI/CD pipeline  
✅ Comprehensive health checks  
✅ Built-in monitoring & alerting  
✅ Disaster recovery procedures  
✅ Auto-scaling configured  
✅ Security hardening applied  
✅ Database migrations automated  
✅ SSL/TLS automatic  
✅ Incident response playbooks  

## Advanced Features

### Blue-Green Deployments
```bash
# Deploy to "blue" environment
# Test thoroughly
# Switch traffic to blue
# Keep "green" as rollback point
```

### Canary Deployments
```bash
# Deploy to 10% of traffic
# Monitor metrics
# Gradually increase to 100%
# Automatic rollback on errors
```

### Multi-Region Failover
- Configure in Terraform
- DNS-based traffic routing
- Automated regional failover
- Full replication

## Next Steps

1. **Customize** - Adjust Terraform variables for your cloud
2. **Integrate** with other agents for complete SaaS generation
3. **Deploy** using provided GitHub Actions workflows
4. **Monitor** using Prometheus + Grafana
5. **Scale** automatically based on demand

## Example: Complete SaaS Generation

```javascript
// One request generates everything:
const saasSolution = await agents.orchestrator.generateCompleteSaaS({
  name: "HealthcareApp",
  features: [
    "User authentication",
    "Patient management",
    "Admin dashboard",
    "Real-time notifications",
    "Advanced reporting"
  ],
  deployment: {
    target: "aws-eks",
    scaling: true,
    monitoring: true,
    ssl: true
  }
});

// Output:
// - Database schema + migrations
// - Auth system + JWT + email verification
// - React frontend with API integration
// - Express backend APIs
// - Security hardening (OWASP compliant)
// - Monitoring dashboards
// - Docker & Kubernetes configs ⭐
// - GitHub Actions CI/CD ⭐
// - AWS infrastructure as code ⭐
// - Deployment documentation
// - Disaster recovery procedures
// → Ready to deploy to production!
```

---

## FAQ

**Q: Does it support multi-cloud?**  
A: Yes! Kubernetes manifests work everywhere (AWS, GCP, Azure, on-prem). Terraform supports multi-cloud too.

**Q: Can I customize the generated files?**  
A: Absolutely. Think of them as starting points. Modify as needed for your specific needs.

**Q: How do I manage secrets securely?**  
A: Use Kubernetes secrets, AWS Secrets Manager, or HashiCorp Vault. Templates provided.

**Q: What about database migrations?**  
A: Automated SQL migrations with rollback capability included.

**Q: Does it handle SSL/TLS?**  
A: Yes, fully automated with Let's Encrypt via cert-manager.

**Q: How do I scale the application?**  
A: Horizontal Pod Autoscaler configured by default. Scales 3-10 replicas based on CPU/memory.

**Q: What's the cost?**  
A: ~$165/month on AWS for a production setup, or cheaper for smaller deployments.

**Q: Can I use this locally in Docker Compose first?**  
A: Yes! Full docker-compose.yml with all services included for local development.
