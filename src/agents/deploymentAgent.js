import { BaseAgent } from "./baseAgent.js";
import { makeAgentOutput } from "../models.js";

/**
 * DeploymentAgent
 * 
 * Generates complete deployment infrastructure for production deployment.
 * Creates Docker configurations, Kubernetes manifests, CI/CD pipelines,
 * and cloud-specific deployments (AWS, GCP, Azure).
 * 
 * Generates:
 * - Docker & Docker Compose configurations
 * - Kubernetes manifests (Deployment, Service, Ingress, ConfigMap)
 * - GitHub Actions CI/CD pipelines
 * - Terraform/CloudFormation configurations
 * - Environment & secrets management
 * - Database migrations
 * - SSL/TLS configuration
 * - Health checks & recovery
 */
export class DeploymentAgent extends BaseAgent {
  constructor(options = {}) {
    super({ ...options, name: "DeploymentAgent" });
  }

  async setupDeployment(request) {
    this.info({ stage: "init" }, "Starting deployment infrastructure generation");

    try {
      // Analyze deployment requirements
      const deploymentSpec = await this.analyzeDeploymentRequirements(request);

      // Generate Docker setup
      const dockerFiles = await this.generateDockerSetup(deploymentSpec);

      // Generate Kubernetes configs
      const kubernetesConfigs = await this.generateKubernetesManifests(deploymentSpec);

      // Generate GitHub Actions CI/CD
      const cicdPipelines = await this.generateGithubActionsPipelines(deploymentSpec);

      // Generate cloud provider configs
      const cloudConfigs = await this.generateCloudProviderConfigs(deploymentSpec);

      // Generate environment & secrets
      const envConfigs = await this.generateEnvironmentConfig(deploymentSpec);

      // Generate database migration scripts
      const dbMigrations = await this.generateDatabaseMigrations(deploymentSpec);

      // Generate SSL/TLS configuration
      const sslConfig = await this.generateSSLConfiguration(deploymentSpec);

      // Generate health checks
      const healthChecks = await this.generateHealthChecks(deploymentSpec);

      // Generate deployment guide
      const deploymentGuide = await this.generateDeploymentGuide(deploymentSpec);

      // Generate monitoring integration
      const monitoringConfig = await this.generateMonitoringIntegration(deploymentSpec);

      // Generate recovery & rollback strategies
      const recoveryStrategies = await this.generateRecoveryStrategies(deploymentSpec);

      const patches = [
        ...dockerFiles,
        ...kubernetesConfigs,
        ...cicdPipelines,
        ...cloudConfigs,
        ...envConfigs,
        ...dbMigrations,
        ...sslConfig,
        ...healthChecks,
        ...deploymentGuide,
        ...monitoringConfig,
        ...recoveryStrategies,
      ];

      this.info(
        { patchCount: patches.length },
        "Deployment infrastructure generated successfully"
      );

      return makeAgentOutput({
        summary: `DeploymentAgent: Generated ${patches.length} deployment files`,
        patches,
        metadata: deploymentSpec,
      });
    } catch (error) {
      this.error({ error: error.message }, "Deployment generation failed");
      return this.getFallbackDeployment(request);
    }
  }

  async analyzeDeploymentRequirements(request) {
    // Mock analysis - in production would use LLM
    return {
      appName: "generated-app",
      environment: "production",
      platforms: ["docker", "kubernetes", "aws"],
      database: "postgresql",
      cache: "redis",
      scaling: true,
      ssl: true,
      monitoring: true,
      backup: true,
      regions: ["us-east-1"],
    };
  }

  async generateDockerSetup(spec) {
    return [
      {
        fileName: "Dockerfile",
        filePath: "Dockerfile",
        content: `FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000

CMD ["node", "src/index.js"]
`,
        description: "Lightweight Node.js production Dockerfile",
      },
      {
        fileName: "docker-compose.yml",
        filePath: "docker-compose.yml",
        content: `version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: generated-app
    ports:
      - "3000:3000"
      - "9090:9090"  # Prometheus metrics
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@db:5432/app
      - REDIS_URL=redis://cache:6379
      - LOG_LEVEL=info
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    networks:
      - app-network

  db:
    image: postgres:16-alpine
    container_name: app-postgres
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=app
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d app"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - app-network

  cache:
    image: redis:7-alpine
    container_name: app-redis
    ports:
      - "6379:6379"
    command: redis-server --requirepass redispass --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - app-network

  prometheus:
    image: prom/prometheus:latest
    container_name: app-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  prometheus_data:
    driver: local

networks:
  app-network:
    driver: bridge
`,
        description: "Docker Compose with app, database, cache, and monitoring",
      },
      {
        fileName: ".dockerignore",
        filePath: ".dockerignore",
        content: `node_modules
npm-debug.log
dist
build
.env
.env.*
.git
.gitignore
.github
.vscode
.DS_Store
logs
coverage
*.md
.editorconfig
jest.config.js
.eslintrc
.prettierrc
`,
        description: "Docker build exclusions",
      },
    ];
  }

  async generateKubernetesManifests(spec) {
    return [
      {
        fileName: "deployment.yaml",
        filePath: "k8s/deployment.yaml",
        content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
  namespace: production
  labels:
    app: generated-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: generated-app
  template:
    metadata:
      labels:
        app: generated-app
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: app-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
      - name: app
        image: your-registry/generated-app:latest
        imagePullPolicy: Always
        ports:
        - name: http
          containerPort: 3000
          protocol: TCP
        - name: metrics
          containerPort: 9090
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: redis-url
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: log-level
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
              - ALL
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: tmp
        emptyDir: {}
      - name: logs
        emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - generated-app
              topologyKey: kubernetes.io/hostname
`,
        description: "Kubernetes Deployment with health checks and resource limits",
      },
      {
        fileName: "service.yaml",
        filePath: "k8s/service.yaml",
        content: `apiVersion: v1
kind: Service
metadata:
  name: app-service
  namespace: production
  labels:
    app: generated-app
spec:
  type: ClusterIP
  selector:
    app: generated-app
  ports:
  - name: http
    port: 80
    targetPort: 3000
    protocol: TCP
  - name: metrics
    port: 9090
    targetPort: 9090
    protocol: TCP
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
`,
        description: "Kubernetes Service",
      },
      {
        fileName: "ingress.yaml",
        filePath: "k8s/ingress.yaml",
        content: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - app.example.com
    secretName: app-tls-cert
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-service
            port:
              number: 80
`,
        description: "Kubernetes Ingress with TLS",
      },
      {
        fileName: "configmap.yaml",
        filePath: "k8s/configmap.yaml",
        content: `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  redis-url: "redis://app-redis:6379"
  log-level: "info"
  database-pool-size: "20"
  session-timeout: "3600000"
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: production
type: Opaque
stringData:
  database-url: "postgresql://user:password@app-postgres:5432/app"
  jwt-secret: "your-jwt-secret-key-here"
  api-key: "your-api-key-here"
`,
        description: "Kubernetes ConfigMap and Secrets",
      },
      {
        fileName: "hpa.yaml",
        filePath: "k8s/hpa.yaml",
        content: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app-deployment
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 2
        periodSeconds: 15
      selectPolicy: Max
`,
        description: "Kubernetes HPA for auto-scaling",
      },
      {
        fileName: "serviceaccount.yaml",
        filePath: "k8s/serviceaccount.yaml",
        content: `apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: production
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-role
  namespace: production
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-rolebinding
  namespace: production
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: app-role
subjects:
- kind: ServiceAccount
  name: app-sa
  namespace: production
`,
        description: "Kubernetes ServiceAccount with RBAC",
      },
    ];
  }

  async generateGithubActionsPipelines(spec) {
    return [
      {
        fileName: "ci.yml",
        filePath: ".github/workflows/ci.yml",
        content: `name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3
    
    - uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - run: npm ci
    
    - run: npm run lint
    
    - run: npm test -- --coverage
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
    
    - uses: codecov/codecov-action@v3
      with:
        files: ./coverage/coverage-final.json
    
    - run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - run: npm audit --audit-level=moderate
    
    - uses: snyk/snyk-setup-action@master
    - uses: snyk/snyk-action@master
      env:
        SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high
`,
        description: "GitHub Actions CI pipeline",
      },
      {
        fileName: "deploy.yml",
        filePath: ".github/workflows/deploy.yml",
        content: `name: Deploy to Production

on:
  push:
    branches: [main]
    tags: ['v*']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - uses: actions/checkout@v3
    
    - uses: docker/setup-buildx-action@v2
    
    - uses: docker/login-action@v2
      with:
        registry: \${{ env.REGISTRY }}
        username: \${{ github.actor }}
        password: \${{ secrets.GITHUB_TOKEN }}
    
    - uses: docker/metadata-action@v4
      id: meta
      with:
        images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
          type=sha,prefix={{branch}}-
    
    - uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: \${{ steps.meta.outputs.tags }}
        labels: \${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy-k8s:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: production

    steps:
    - uses: actions/checkout@v3
    
    - uses: azure/setup-kubectl@v3
      with:
        version: 'v1.28.0'
    
    - uses: azure/k8s-set-context@v3
      with:
        method: kubeconfig
        kubeconfig: \${{ secrets.KUBE_CONFIG }}
    
    - run: kubectl set image deployment/app-deployment app=\${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:sha-\${{ github.sha }} -n production
    
    - run: kubectl rollout status deployment/app-deployment -n production
    
    - name: Slack notification
      if: always()
      uses: slackapi/slack-github-action@v1.24.0
      with:
        webhook-url: \${{ secrets.SLACK_WEBHOOK }}
        payload: |
          {
            "text": "Deployment \${{ job.status }}",
            "blocks": [
              {
                "type": "section",
                "text": {
                  "type": "mrkdwn",
                  "text": "Deployment to production \${{ job.status }}"
                }
              }
            ]
          }
`,
        description: "GitHub Actions deployment pipeline",
      },
    ];
  }

  async generateCloudProviderConfigs(spec) {
    return [
      {
        fileName: "main.tf",
        filePath: "terraform/main.tf",
        content: `terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "app-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-lock"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "\${var.project_name}-vpc"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "\${var.project_name}-public-subnet-\${count.index + 1}"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "\${var.project_name}-private-subnet-\${count.index + 1}"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name            = var.cluster_name
  version         = var.kubernetes_version
  role_arn        = aws_iam_role.eks_cluster.arn
  
  vpc_config {
    subnet_ids              = concat(aws_subnet.public[*].id, aws_subnet.private[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster
  ]

  tags = {
    Name = var.cluster_name
  }
}

# EKS Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "\${var.cluster_name}-ng"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = aws_subnet.private[*].id
  version         = var.kubernetes_version

  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 3
  }

  instance_types = ["t3.medium"]

  depends_on = [
    aws_iam_role_policy_attachment.node
  ]

  tags = {
    Name = "\${var.cluster_name}-ng"
  }
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier            = "\${var.project_name}-db"
  engine               = "postgres"
  engine_version       = "16"
  instance_class       = "db.t3.micro"
  allocated_storage    = 20
  max_allocated_storage = 100
  username             = var.db_username
  password             = random_password.db_password.result
  db_name              = var.db_name
  
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  
  skip_final_snapshot = false
  final_snapshot_identifier = "\${var.project_name}-db-final-snapshot-\${formatdate(\"YYYY-MM-DD-hhmm\", timestamp())}"
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  publicly_accessible = false
  storage_encrypted   = true
  
  tags = {
    Name = "\${var.project_name}-db"
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "main" {
  cluster_id           = "\${var.project_name}-redis"
  engine              = "redis"
  node_type          = "cache.t3.micro"
  num_cache_nodes     = 1
  parameter_group_name = "default.redis7"
  engine_version      = "7.0"
  port                = 6379
  
  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  automatic_failover_enabled = false
  at_rest_encryption_enabled = true
  transit_encryption_enabled = false
  
  tags = {
    Name = "\${var.project_name}-redis"
  }
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Outputs
output "eks_cluster_name" {
  value = aws_eks_cluster.main.name
}

output "eks_cluster_endpoint" {
  value = aws_eks_cluster.main.endpoint
}

output "rds_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.main.cache_nodes[0].address
}
`,
        description: "Terraform AWS infrastructure configuration",
      },
      {
        fileName: "variables.tf",
        filePath: "terraform/variables.tf",
        content: `variable "aws_region" {
  description = "AWS region"
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  default     = "generated-app"
}

variable "cluster_name" {
  description = "EKS cluster name"
  default     = "app-cluster"
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  default     = "1.28"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "db_username" {
  description = "Database username"
  default     = "dbadmin"
}

variable "db_name" {
  description = "Database name"
  default     = "appdb"
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

output "db_password_secret_arn" {
  value = aws_secretsmanager_secret.db_password.arn
}
`,
        description: "Terraform variables and outputs",
      },
    ];
  }

  async generateEnvironmentConfig(spec) {
    return [
      {
        fileName: ".env.production",
        filePath: ".env.production",
        content: `# Environment
NODE_ENV=production
APP_NAME=generated-app
APP_VERSION=1.0.0
LOG_LEVEL=info

# Server
PORT=3000
HOST=0.0.0.0
WORKERS=4

# Database
DATABASE_URL=postgresql://user:password@db-host:5432/app
DATABASE_POOL_SIZE=20
DATABASE_IDLE_TIMEOUT=30000
DATABASE_CONNECTION_TIMEOUT=10000

# Cache
REDIS_URL=redis://cache-host:6379
REDIS_PASSWORD=redispass

# JWT & Auth
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
SESSION_TIMEOUT=3600000

# Security
CORS_ORIGIN=https://app.example.com
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
HELMETS_ENABLED=true

# Features
FEATURE_ANALYTICS=true
FEATURE_NOTIFICATIONS=true
FEATURE_FILE_UPLOAD=true

# External Services
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-key

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEW_RELIC_LICENSE_KEY=your-new-relic-key
DATADOG_API_KEY=your-datadog-key

# Compliance
ENABLE_AUDIT_LOGGING=true
AUDIT_LOG_PATH=/var/log/app/audit.log
`,
        description: "Production environment configuration",
      },
      {
        fileName: "secrets-template.yaml",
        filePath: "k8s/secrets-template.yaml",
        content: `apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: production
type: Opaque
data:
  # Base64 encoded values - replace with actual values
  database-url: cG9zdGdyZXM6Ly91c2VyOnBhc3NAZGItaG9zdDo1NDMyL2FwcA==
  redis-password: cmVkaXNwYXNz
  jwt-secret: eW91ci1zZWNyZXQta2V5LWhlcmU=
  email-api-key: eW91ci1zZW5kZ3JpZC1rZXk=
  aws-access-key: eW91ci1hd3Mta2V5
  aws-secret-key: eW91ci1hd3Mtc2VjcmV0
  sentry-dsn: aHR0cHM6Ly95b3VyLXNlbnRyeS1kc24Kc2VudHJ5Lmlv
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-credentials
  namespace: production
data:
  database_host: "app-postgres.default.svc.cluster.local"
  redis_host: "app-redis.default.svc.cluster.local"
  api_base_url: "https://api.app.example.com"
  frontend_url: "https://app.example.com"
`,
        description: "Kubernetes secrets and credentials template",
      },
    ];
  }

  async generateDatabaseMigrations(spec) {
    return [
      {
        fileName: "001-initial-schema.sql",
        filePath: "scripts/migrations/001-initial-schema.sql",
        content: `-- Initial database schema
-- Run migrations in order

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  is_admin BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_created_at (created_at)
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(512) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_action_created ON audit_logs(action, created_at DESC);
CREATE INDEX idx_sessions_expires_on_revoked ON sessions(expires_at, revoked);

-- Add security constraints
ALTER TABLE users ADD CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$');
ALTER TABLE users ADD CONSTRAINT username_format CHECK (username ~* '^[a-zA-Z0-9_-]{3,}$');
`,
        description: "Initial database schema migration",
      },
      {
        fileName: "migrate.sh",
        filePath: "scripts/migrate.sh",
        content: `#!/bin/bash
set -e

# Database migration script
# Usage: ./migrate.sh <database_url> [--rollback]

DB_URL=\${1:-\$DATABASE_URL}
ROLLBACK=\${2:-false}

if [ -z "\$DB_URL" ]; then
  echo "Error: DATABASE_URL not provided"
  exit 1
fi

MIGRATIONS_DIR="scripts/migrations"

echo "Running database migrations from \$MIGRATIONS_DIR..."

# Run migrations
for migration in \$(ls -1 \$MIGRATIONS_DIR/*.sql | sort); do
  echo "Running: \$migration"
  psql "\$DB_URL" -f "\$migration" || {
    echo "Migration failed: \$migration"
    exit 1
  }
done

echo "Migrations completed successfully!"

# Verify schema
echo "Verifying schema..."
psql "\$DB_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"

echo "Done!"
`,
        description: "Migration runner script",
      },
    ];
  }

  async generateSSLConfiguration(spec) {
    return [
      {
        fileName: "cert-manager.yaml",
        filePath: "k8s/cert-manager.yaml",
        content: `# Install cert-manager first:
# kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - http01:
        ingress:
          class: nginx
`,
        description: "Cert-manager configuration for SSL/TLS",
      },
      {
        fileName: "nginx-ingress.yaml",
        filePath: "k8s/nginx-ingress.yaml",
        content: `apiVersion: helm.cattle.io/v1
kind: HelmChart
metadata:
  name: nginx-ingress
spec:
  chart: nginx-ingress
  repo: https://kubernetes.github.io/ingress-nginx
  targetNamespace: ingress-nginx
  set:
    controller.replicaCount: 3
    controller.metrics.enabled: true
    controller.service.type: LoadBalancer
    controller.resources.requests.memory: "256Mi"
    controller.resources.requests.cpu: "250m"
`,
        description: "NGINX Ingress Controller",
      },
    ];
  }

  async generateHealthChecks(spec) {
    return [
      {
        fileName: "health.js",
        filePath: "src/routes/health.js",
        content: `import express from 'express';

const router = express.Router();

// Liveness probe - is the app running?
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe - can the app serve requests?
router.get('/ready', async (req, res) => {
  try {
    // Check database
    const dbCheck = await checkDatabase();
    
    // Check cache
    const cacheCheck = await checkCache();
    
    if (!dbCheck || !cacheCheck) {
      return res.status(503).json({
        status: 'not_ready',
        checks: { database: dbCheck, cache: cacheCheck },
      });
    }

    res.status(200).json({
      status: 'ready',
      checks: { database: true, cache: true },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({ status: 'not_ready', error: error.message });
  }
});

// Full health report
router.get('/', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {
      database: await checkDatabase(),
      cache: await checkCache(),
      disk: await checkDisk(),
    },
  };

  res.status(200).json(health);
});

async function checkDatabase() {
  try {
    // Implement database health check
    return true;
  } catch {
    return false;
  }
}

async function checkCache() {
  try {
    // Implement cache health check
    return true;
  } catch {
    return false;
  }
}

async function checkDisk() {
  try {
    // Implement disk space check
    return true;
  } catch {
    return false;
  }
}

export default router;
`,
        description: "Health check endpoints",
      },
    ];
  }

  async generateDeploymentGuide(spec) {
    return [
      {
        fileName: "DEPLOYMENT.md",
        filePath: "docs/DEPLOYMENT.md",
        content: `# Deployment Guide

Complete guide for deploying the application to production.

## Prerequisites

- Docker & Docker Compose
- Kubernetes cluster (AWS EKS, GKE, or local Kind)
- kubectl CLI
- Helm 3+
- Terraform (for AWS infrastructure)

## Local Development

\`\`\`bash
docker-compose up
\`\`\`

## Production Deployment

### Option 1: AWS EKS (Recommended)

1. **Set up infrastructure with Terraform:**
   \`\`\`bash
   cd terraform
   terraform init
   terraform plan
   terraform apply
   \`\`\`

2. **Configure kubectl:**
   \`\`\`bash
   aws eks update-kubeconfig --region us-east-1 --name app-cluster
   \`\`\`

3. **Deploy to Kubernetes:**
   \`\`\`bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/secrets.yaml
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   kubectl apply -f k8s/ingress.yaml
   \`\`\`

4. **Verify deployment:**
   \`\`\`bash
   kubectl get pods -n production
   kubectl get svc -n production
   \`\`\`

### Option 2: Docker Swarm

\`\`\`bash
docker stack deploy -c docker-compose.yml app
docker service ls
\`\`\`

## CI/CD Pipeline

The GitHub Actions workflow runs on:
- Push to \`main\` branch
- PR to \`main\` or \`develop\`

### Workflow Steps

1. **Test** - Run unit and integration tests
2. **Build** - Build Docker image
3. **Push** - Push to container registry
4. **Deploy** - Deploy to Kubernetes

### Monitoring Deployment

\`\`\`bash
# Watch rollout status
kubectl rollout status deployment/app-deployment -n production

# View logs
kubectl logs -f deployment/app-deployment -n production

# Monitor scaling
kubectl get hpa app-hpa -n production --watch
\`\`\`

## Rollback Procedure

If deployment fails or issues are detected:

\`\`\`bash
# Show rollout history
kubectl rollout history deployment/app-deployment -n production

# Rollback to previous version
kubectl rollout undo deployment/app-deployment -n production

# Rollback to specific revision
kubectl rollout undo deployment/app-deployment -n production --to-revision=2
\`\`\`

## Performance Tuning

### Database Connection Pooling

Adjust in \`.env\`:
\`\`\`
DATABASE_POOL_SIZE=20
DATABASE_IDLE_TIMEOUT=30000
\`\`\`

### Kubernetes Resource Limits

Edit deployment.yaml to adjust:
- Memory requests/limits
- CPU requests/limits
- HPA thresholds

### Redis Cache Optimization

Monitor cache hit rate:
\`\`\`bash
redis-cli INFO stats
\`\`\`

## Security Hardening

- [ ] Enable network policies
- [ ] Use private registries
- [ ] Rotate secrets regularly
- [ ] Enable audit logging
- [ ] Use TLS everywhere
- [ ] Regular security updates

## Backup & Recovery

### Database Backups

Automated daily backups to S3:
\`\`\`bash
# Manual backup
pg_dump \$DATABASE_URL > backup.sql

# Restore
psql \$DATABASE_URL < backup.sql
\`\`\`

### Disaster Recovery

1. Ensure multi-region redundancy
2. Test recovery procedures monthly
3. Maintain runbooks for common issues

## Scaling

### Horizontal Scaling

Auto-scaling is configured via HPA:
- Min replicas: 3
- Max replicas: 10
- CPU threshold: 70%
- Memory threshold: 80%

### Vertical Scaling

If HPA insufficient, increase:
- Node instance sizes
- Database connection limits
- Cache memory allocation

## Maintenance Windows

Deployments happen automatically on push to \`main\`.

For planned maintenance:
\`\`\`bash
# Enable maintenance mode
kubectl set env deployment/app-deployment MAINTENANCE_MODE=true

# Perform maintenance
# ...

# Disable maintenance mode
kubectl set env deployment/app-deployment MAINTENANCE_MODE=false
\`\`\`

## Support & Troubleshooting

### Common Issues

**Pod fails to start:**
\`\`\`bash
kubectl describe pod <pod-name> -n production
kubectl logs <pod-name> -n production
\`\`\`

**High memory usage:**
- Check for memory leaks
- Review resource limits
- Monitor GC behavior

**Database connection errors:**
- Verify connection string
- Check pool size
- Review database logs

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [AWS EKS Best Practices](https://aws.amazon.com/eks/best-practices/)
`,
        description: "Complete deployment guide",
      },
    ];
  }

  async generateMonitoringIntegration(spec) {
    return [
      {
        fileName: "prometheus.yml",
        filePath: "monitoring/prometheus.yml",
        content: `global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: production
    environment: prod

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - "alert-rules.yml"

scrape_configs:
  - job_name: 'app'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
`,
        description: "Prometheus monitoring configuration",
      },
      {
        fileName: "alert-rules.yml",
        filePath: "monitoring/alert-rules.yml",
        content: `groups:
  - name: app_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~'5..'}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: PodCrashLooping
        expr: rate(kube_pod_container_status_restarts_total[30m]) > 0
        for: 5m
        annotations:
          summary: "Pod is crash looping"

      - alert: DatabaseUnavailable
        expr: up{job="postgres"} == 0
        for: 1m
        annotations:
          summary: "Database is unavailable"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m
        annotations:
          summary: "High memory usage detected"
`,
        description: "Prometheus alert rules",
      },
    ];
  }

  async generateRecoveryStrategies(spec) {
    return [
      {
        fileName: "RECOVERY.md",
        filePath: "docs/RECOVERY.md",
        content: `# Disaster Recovery & Incident Response

Procedures for common production incidents.

## Database Failures

### Symptom: Cannot connect to database

**Immediate actions:**
\`\`\`bash
# Check database status
kubectl get pods -n production | grep postgres

# View database logs
kubectl logs <postgres-pod> -n production

# Check connection string
kubectl get secret app-secrets -n production -o yaml | grep database-url
\`\`\`

**Recovery:**
1. If pod is down, Kubernetes will restart it
2. If persistent data lost, restore from backup
3. Verify connections work: \`psql \$DATABASE_URL -c "SELECT 1"\`

### Symptom: High query latency

**Investigations:**
- Check for long-running queries
- Review query execution plans
- Check connection pool saturation
- Monitor disk I/O

**Resolution:**
- Kill long-running queries
- Increase connection pool size
- Add database indexes
- Scale database vertical/horizontal

## Cache Failures

### Redis connection errors

\`\`\`bash
# Check Redis pod
kubectl get pods -n production | grep redis

# Test Redis connection
redis-cli ping

# Clear problematic cache entries
redis-cli FLUSHDB
\`\`\`

## Container Crashes

### Application pod keeps restarting

1. Check logs: \`kubectl logs <pod> -n production\`
2. Review recent deployments: \`kubectl rollout history deployment/app-deployment\`
3. Rollback if needed: \`kubectl rollout undo deployment/app-deployment\`

### Out of memory errors

- Increase memory limits in deployment
- Check for memory leaks in code
- Enable memory profiling
- Review heap dumps

## Network Issues

### Pods cannot reach services

- Verify network policies
- Check DNS resolution: \`nslookup service-name.production.svc.cluster.local\`
- Review SERVICE object: \`kubectl get svc -n production\`
- Check ingress configuration

## Backup & Restore

### Database backup

\`\`\`bash
# Create backup
pg_dump \$DATABASE_URL > backup-\$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup-*.sql s3://backups/

# Restore from backup
psql \$DATABASE_URL < backup-latest.sql
\`\`\`

### Redis backup

\`\`\`bash
# Backup done automatically with appendonly yes
# Copy RDB file
docker cp app-redis:/data/dump.rdb ./redis-backup.rdb

# Restore
docker cp redis-backup.rdb app-redis:/data/
\`\`\`

## Incident Severity Levels

### Critical (P1)
- Complete service outage
- Data loss/corruption
- Security breach

**Response time:** Immediate (< 5 min)
**Team:** All hands on deck

### High (P2)
- Partial service outage
- Severe performance degradation
- Database issues

**Response time:** < 15 min
**Team:** On-call engineer + team lead

### Medium (P3)
- Minor feature broken
- Elevated error rates (< 5%)
- Moderate performance issues

**Response time:** < 1 hour
**Team:** On-call engineer

### Low (P4)
- Non-critical bugs
- Minor performance issues
- Documentation updates

**Response time:** Next business day
**Team:** Backlog

## Incident Checklist

- [ ] Declare incident severity level
- [ ] Notify stakeholders
- [ ] Begin investigation
- [ ] Implement temporary fix if possible
- [ ] Document incident
- [ ] Communicate status updates every 15 min
- [ ] When resolved: post-mortem within 24 hours

## Post-Incident Review

For each incident:
1. Timeline of what happened
2. Root cause analysis
3. What went well
4. What could be improved
5. Action items to prevent recurrence
`,
        description: "Disaster recovery and incident response procedures",
      },
    ];
  }

  getFallbackDeployment(request) {
    this.warn({ stage: "fallback" }, "Using fallback deployment configuration");

    const genericDeployment = [
      {
        fileName: "Dockerfile",
        filePath: "Dockerfile",
        content: `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
`,
      },
      {
        fileName: "docker-compose.yml",
        filePath: "docker-compose.yml",
        content: `version: '3.9'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
`,
      },
    ];

    return makeAgentOutput({
      summary: "DeploymentAgent: Generated basic deployment files (fallback)",
      patches: genericDeployment,
      metadata: { fallback: true },
    });
  }
}
