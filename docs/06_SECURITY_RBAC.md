# Сигурност, RBAC, GDPR и Observability

## 🔐 Authentication & Authorization

### Authentication Strategy

#### Локална аутентификация (MVP)

```typescript
interface LocalAuthConfig {
  strategy: 'local';
  passwordPolicy: {
    minLength: 8;
    requireUppercase: true;
    requireLowercase: true;
    requireNumbers: true;
    requireSpecialChars: false;
    maxAge: 90; // days - задължителна смяна на парола
    preventReuse: 5; // последните 5 пароли не могат да се използват повторно
  };
  session: {
    type: 'jwt';
    accessTokenExpiry: '15m';
    refreshTokenExpiry: '7d';
    maxConcurrentSessions: 3;
  };
  mfa: {
    enabled: false; // За v2
    methods: ['totp', 'email'];
  };
}
```

**JWT Token Structure:**

```typescript
interface AccessToken {
  sub: string; // user ID
  email: string;
  role: UserRole;
  permissions: string[];
  iat: number;
  exp: number;
}

interface RefreshToken {
  sub: string;
  tokenId: string; // Unique token identifier
  iat: number;
  exp: number;
}
```

**Authentication Flow:**

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Server  │
└────┬─────┘                                    └────┬─────┘
     │                                               │
     │  POST /api/auth/login                         │
     │  { email, password }                          │
     ├──────────────────────────────────────────────►│
     │                                               │
     │                                      ┌────────┴────────┐
     │                                      │ 1. Verify       │
     │                                      │    credentials  │
     │                                      │ 2. Load user    │
     │                                      │    & permissions│
     │                                      │ 3. Generate     │
     │                                      │    tokens       │
     │                                      │ 4. Store refresh│
     │                                      │    token in DB  │
     │                                      └────────┬────────┘
     │                                               │
     │  { accessToken, refreshToken, user }          │
     │◄──────────────────────────────────────────────┤
     │                                               │
     │  Store tokens in:                             │
     │  - accessToken: memory                        │
     │  - refreshToken: httpOnly cookie              │
     │                                               │
     │                                               │
     │  Subsequent requests:                         │
     │  GET /api/vehicles                            │
     │  Authorization: Bearer {accessToken}          │
     ├──────────────────────────────────────────────►│
     │                                               │
     │                                      ┌────────┴────────┐
     │                                      │ Verify JWT      │
     │                                      │ Check permissions│
     │                                      └────────┬────────┘
     │                                               │
     │  { data: [...] }                              │
     │◄──────────────────────────────────────────────┤
     │                                               │
     │                                               │
     │  When access token expires:                   │
     │  POST /api/auth/refresh                       │
     │  Cookie: refreshToken                         │
     ├──────────────────────────────────────────────►│
     │                                               │
     │                                      ┌────────┴────────┐
     │                                      │ Verify refresh  │
     │                                      │ token in DB     │
     │                                      │ Generate new    │
     │                                      │ access token    │
     │                                      └────────┬────────┘
     │                                               │
     │  { accessToken }                              │
     │◄──────────────────────────────────────────────┤
     │                                               │
```

#### OIDC/SSO Integration (Enterprise - Optional)

```typescript
interface OIDCConfig {
  strategy: 'oidc';
  provider: {
    name: 'Azure AD' | 'Keycloak' | 'Auth0';
    issuer: string;
    authorizationEndpoint: string;
    tokenEndpoint: string;
    userInfoEndpoint: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: ['openid', 'profile', 'email'];
  };
  rolMapping: {
    // Мапване на OIDC groups/roles към локални роли
    'AAD_Fleet_Admins': 'admin',
    'AAD_Fleet_Managers': 'fleet_manager',
    'AAD_Drivers': 'driver'
  };
  fallbackToLocal: true; // Разрешава локален login при проблеми с OIDC
}
```

### Role-Based Access Control (RBAC)

#### Роли и права

```typescript
enum UserRole {
  ADMIN = 'admin',
  FLEET_MANAGER = 'fleet_manager',
  DRIVER = 'driver'
}

interface Permission {
  resource: string;
  actions: Action[];
  conditions?: Condition[];
}

type Action = 'create' | 'read' | 'update' | 'delete' | 'export';

interface Condition {
  field: string;
  operator: 'eq' | 'in' | 'own';
  value: any;
}

const rolePermissions: Record<UserRole, Permission[]> = {
  // ═══════════════════════════════════════════════════════════
  // ADMIN - пълен достъп до всичко
  // ═══════════════════════════════════════════════════════════
  [UserRole.ADMIN]: [
    {
      resource: 'users',
      actions: ['create', 'read', 'update', 'delete']
    },
    {
      resource: 'vehicles',
      actions: ['create', 'read', 'update', 'delete']
    },
    {
      resource: 'charge_sessions',
      actions: ['create', 'read', 'update', 'delete']
    },
    {
      resource: 'odometer_readings',
      actions: ['read', 'update', 'delete']
    },
    {
      resource: 'stations',
      actions: ['create', 'read', 'update', 'delete']
    },
    {
      resource: 'tariffs',
      actions: ['create', 'read', 'update', 'delete']
    },
    {
      resource: 'reports',
      actions: ['read', 'export']
    },
    {
      resource: 'audit_logs',
      actions: ['read', 'export']
    },
    {
      resource: 'notifications',
      actions: ['read', 'create']
    },
    {
      resource: 'settings',
      actions: ['read', 'update']
    }
  ],

  // ═══════════════════════════════════════════════════════════
  // FLEET_MANAGER - управление на флота
  // ═══════════════════════════════════════════════════════════
  [UserRole.FLEET_MANAGER]: [
    {
      resource: 'users',
      actions: ['read'], // Само преглед на потребители
      conditions: [
        { field: 'role', operator: 'in', value: ['driver'] }
      ]
    },
    {
      resource: 'vehicles',
      actions: ['read', 'update'] // Може да редактира, не може да трие
    },
    {
      resource: 'charge_sessions',
      actions: ['create', 'read', 'update'] // Може да създава и редактира
    },
    {
      resource: 'odometer_readings',
      actions: ['read', 'update'] // Може да верифицира показания
    },
    {
      resource: 'stations',
      actions: ['read'] // Само преглед
    },
    {
      resource: 'tariffs',
      actions: ['read'] // Само преглед
    },
    {
      resource: 'reports',
      actions: ['read', 'export'] // Пълен достъп до отчети
    },
    {
      resource: 'notifications',
      actions: ['read']
    }
  ],

  // ═══════════════════════════════════════════════════════════
  // DRIVER - само свои данни
  // ═══════════════════════════════════════════════════════════
  [UserRole.DRIVER]: [
    {
      resource: 'vehicles',
      actions: ['read'],
      conditions: [
        { field: 'assignedUserId', operator: 'eq', value: ':currentUserId' }
      ]
    },
    {
      resource: 'charge_sessions',
      actions: ['read'],
      conditions: [
        { field: 'vehicle.assignedUserId', operator: 'eq', value: ':currentUserId' }
      ]
    },
    {
      resource: 'odometer_readings',
      actions: ['create', 'read'],
      conditions: [
        { field: 'vehicle.assignedUserId', operator: 'eq', value: ':currentUserId' }
      ]
    },
    {
      resource: 'reports',
      actions: ['read'],
      conditions: [
        { field: 'userId', operator: 'eq', value: ':currentUserId' }
      ]
    },
    {
      resource: 'notifications',
      actions: ['read'],
      conditions: [
        { field: 'userId', operator: 'eq', value: ':currentUserId' }
      ]
    }
  ]
};
```

#### Permission Checking Middleware

```typescript
// Decorator за проверка на права
function RequirePermission(resource: string, action: Action) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const request = args[0]; // Express request
      const user = request.user;

      if (!user) {
        throw new UnauthorizedError('Authentication required');
      }

      const hasPermission = await checkPermission(
        user,
        resource,
        action,
        request.params
      );

      if (!hasPermission) {
        throw new ForbiddenError(
          `You don't have permission to ${action} ${resource}`
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Използване:
@Controller('/api/vehicles')
export class VehiclesController {
  @Get('/')
  @RequirePermission('vehicles', 'read')
  async list(@Req() req: Request) {
    // Ако потребителят е driver, филтрираме само неговите автомобили
    if (req.user.role === UserRole.DRIVER) {
      return this.vehiclesService.findByUserId(req.user.id);
    }
    return this.vehiclesService.findAll();
  }

  @Post('/')
  @RequirePermission('vehicles', 'create')
  async create(@Body() data: CreateVehicleDTO) {
    return this.vehiclesService.create(data);
  }

  @Delete('/:id')
  @RequirePermission('vehicles', 'delete')
  async delete(@Param('id') id: string) {
    return this.vehiclesService.delete(id);
  }
}
```

#### Permission Check Function

```typescript
async function checkPermission(
  user: User,
  resource: string,
  action: Action,
  context?: any
): Promise<boolean> {
  // Намиране на права за ролята
  const permissions = rolePermissions[user.role];
  
  const permission = permissions.find(p => p.resource === resource);
  
  if (!permission) {
    return false; // Няма права за този resource
  }
  
  if (!permission.actions.includes(action)) {
    return false; // Няма права за това действие
  }
  
  // Проверка на условия (conditions)
  if (permission.conditions) {
    for (const condition of permission.conditions) {
      const isValid = await evaluateCondition(
        condition,
        user,
        context
      );
      
      if (!isValid) {
        return false;
      }
    }
  }
  
  return true;
}

async function evaluateCondition(
  condition: Condition,
  user: User,
  context: any
): Promise<boolean> {
  let actualValue = context?.[condition.field];
  let expectedValue = condition.value;
  
  // Заместваме специални стойности
  if (expectedValue === ':currentUserId') {
    expectedValue = user.id;
  }
  
  switch (condition.operator) {
    case 'eq':
      return actualValue === expectedValue;
    
    case 'in':
      return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
    
    case 'own':
      // Проверка дали ресурсът принадлежи на потребителя
      return await checkOwnership(user.id, condition.field, context);
    
    default:
      return false;
  }
}
```

## 📝 Audit Trail

### Audit Log Events

```typescript
enum AuditAction {
  // Authentication
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  
  // CRUD Operations
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  
  // Specific Events
  CREATE_SESSION = 'create_session',
  UPDATE_SESSION = 'update_session',
  CANCEL_SESSION = 'cancel_session',
  ENTER_ODOMETER = 'enter_odometer',
  VERIFY_ODOMETER = 'verify_odometer',
  
  ASSIGN_VEHICLE = 'assign_vehicle',
  UNASSIGN_VEHICLE = 'unassign_vehicle',
  
  EXPORT_REPORT = 'export_report',
  SEND_NOTIFICATION = 'send_notification',
  
  SETTINGS_CHANGE = 'settings_change'
}

interface AuditLogEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: AuditAction;
  entityType: string | null;
  entityId: string | null;
  changes: {
    before?: any;
    after?: any;
  } | null;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}
```

### Audit Logging Middleware

```typescript
// Интерцептор за автоматичен audit log
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;
    const url = request.url;
    
    const startTime = Date.now();
    
    return next.handle().pipe(
      tap(async (response) => {
        // Логваме само важни операции
        if (this.shouldAudit(method, url)) {
          await this.auditService.log({
            userId: user?.id,
            userEmail: user?.email,
            action: this.mapMethodToAction(method, url),
            entityType: this.extractEntityType(url),
            entityId: this.extractEntityId(url, response),
            changes: this.extractChanges(method, request.body, response),
            ipAddress: this.getClientIp(request),
            userAgent: request.headers['user-agent'],
            timestamp: new Date(),
            success: true,
            duration: Date.now() - startTime
          });
        }
      }),
      catchError(async (error) => {
        // Логваме и грешките
        await this.auditService.log({
          userId: user?.id,
          userEmail: user?.email,
          action: this.mapMethodToAction(method, url),
          entityType: this.extractEntityType(url),
          entityId: null,
          ipAddress: this.getClientIp(request),
          userAgent: request.headers['user-agent'],
          timestamp: new Date(),
          success: false,
          errorMessage: error.message,
          duration: Date.now() - startTime
        });
        
        throw error;
      })
    );
  }
  
  private shouldAudit(method: string, url: string): boolean {
    // Не логваме GET заявки (освен за чувствителни данни)
    if (method === 'GET' && !url.includes('/reports/export')) {
      return false;
    }
    
    // Не логваме health checks
    if (url.includes('/health')) {
      return false;
    }
    
    return true;
  }
}
```

### Audit Log Retention Policy

```typescript
interface AuditRetentionPolicy {
  // Съхранение в основната БД
  hotStorage: {
    duration: 90; // дни
    indexing: true;
  };
  
  // Архивиране в cold storage
  coldStorage: {
    duration: 365 * 7; // 7 години (законово изискване)
    format: 'parquet' | 'json.gz';
    location: 's3' | 'local';
  };
  
  // Автоматично изтриване
  purge: {
    after: 365 * 7; // 7 години
    method: 'soft-delete' | 'hard-delete';
  };
}

// Cron job за архивиране
cron.schedule('0 2 * * *', async () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  
  // Архивираме стари логове
  const oldLogs = await db.auditLogs.findMany({
    where: {
      timestamp: { lt: cutoffDate }
    }
  });
  
  if (oldLogs.length > 0) {
    await archiveService.archive('audit_logs', oldLogs);
    await db.auditLogs.deleteMany({
      where: {
        id: { in: oldLogs.map(log => log.id) }
      }
    });
    
    logger.info(`Archived ${oldLogs.length} audit logs`);
  }
});
```

## 🛡️ Security Best Practices

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// Глобален rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минути
  max: 100, // 100 заявки на 15 мин
  message: 'Too many requests from this IP, please try again later.'
});

// По-строг за login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 опита
  message: 'Too many login attempts, please try again after 15 minutes.'
});

// За API endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60, // 60 заявки на минута
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/', apiLimiter);
```

### Input Validation & Sanitization

```typescript
import { IsString, IsEmail, IsNumber, Min, Max, IsDate } from 'class-validator';
import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

class CreateChargeSessionDTO {
  @IsUUID()
  vehicleId: string;

  @IsDate()
  @Type(() => Date)
  startedAt: Date;

  @IsDate()
  @Type(() => Date)
  endedAt: Date;

  @IsNumber()
  @Min(0.1)
  @Max(200)
  kwhCharged: number;

  @IsNumber()
  @Min(0)
  priceTotal: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {}
  }))
  notes?: string;
}
```

### SQL Injection Prevention

```typescript
// ✅ ПРАВИЛНО: Използване на prepared statements (ORM)
const vehicle = await db.vehicles.findOne({
  where: { registrationNo: userInput }
});

// ✅ ПРАВИЛНО: Параметризирана заявка
const vehicles = await db.$queryRaw`
  SELECT * FROM vehicles 
  WHERE registration_no = ${userInput}
`;

// ❌ ГРЕШНО: String concatenation
const vehicles = await db.$queryRawUnsafe(
  `SELECT * FROM vehicles WHERE registration_no = '${userInput}'`
);
```

### XSS Prevention

```typescript
// Content Security Policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Минимизирай unsafe-inline
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' }
}));
```

## 🇪🇺 GDPR Compliance

### Personal Data Mapping

```typescript
interface PersonalData {
  // Идентификатори
  userId: string;
  email: string; // PII
  fullName: string; // PII
  phone?: string; // PII
  
  // Технически данни
  ipAddress?: string; // PII под GDPR
  userAgent?: string;
  
  // Поведенчески данни
  loginHistory: Date[];
  auditLogs: AuditLogEntry[];
}

const dataCategories = {
  identity: ['email', 'fullName', 'phone'],
  technical: ['ipAddress', 'userAgent'],
  behavioral: ['loginHistory', 'auditLogs'],
  operational: ['odometerReadings', 'chargeSessions']
};
```

### Right to Access (Subject Access Request)

```typescript
async function exportUserData(userId: string): Promise<UserDataExport> {
  const user = await db.users.findOne({ where: { id: userId } });
  const vehicles = await db.userVehicles.findMany({ 
    where: { userId },
    include: { vehicle: true }
  });
  const sessions = await db.chargeSessions.findMany({
    where: { 
      vehicle: { userVehicles: { some: { userId } } }
    }
  });
  const odometerReadings = await db.odometerReadings.findMany({
    where: { enteredBy: userId }
  });
  const auditLogs = await db.auditLogs.findMany({
    where: { userId }
  });
  
  return {
    personalInfo: {
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt
    },
    vehicles: vehicles.map(uv => ({
      registrationNo: uv.vehicle.registrationNo,
      make: uv.vehicle.make,
      model: uv.vehicle.model,
      assignedAt: uv.assignedAt
    })),
    chargingSessions: sessions,
    odometerReadings: odometerReadings,
    activityLog: auditLogs,
    exportedAt: new Date(),
    format: 'json'
  };
}
```

### Right to Erasure ("Right to be Forgotten")

```typescript
async function deleteUserData(
  userId: string,
  options: { hardDelete: boolean } = { hardDelete: false }
): Promise<void> {
  
  if (options.hardDelete) {
    // Hard delete - премахва всички данни
    await db.$transaction(async (tx) => {
      // 1. Анонимизираме одит логовете (не ги трием напълно)
      await tx.auditLogs.updateMany({
        where: { userId },
        data: {
          userId: null,
          userEmail: '[deleted]',
          changes: null // Премахваме PII от changes
        }
      });
      
      // 2. Анонимизираме одометър показанията
      await tx.odometerReadings.updateMany({
        where: { enteredBy: userId },
        data: {
          enteredBy: null,
          notes: null
        }
      });
      
      // 3. Премахваме връзките user-vehicle
      await tx.userVehicles.deleteMany({
        where: { userId }
      });
      
      // 4. Изтриваме нотификациите
      await tx.notifications.deleteMany({
        where: { userId }
      });
      
      // 5. Изтриваме потребителя
      await tx.users.delete({
        where: { id: userId }
      });
      
      logger.info(`User ${userId} data permanently deleted (GDPR)`);
    });
  } else {
    // Soft delete - деактивираме акаунта
    await db.users.update({
      where: { id: userId },
      data: {
        isActive: false,
        email: `deleted_${userId}@deleted.local`,
        fullName: '[Deleted User]',
        phone: null,
        passwordHash: null
      }
    });
    
    logger.info(`User ${userId} account deactivated`);
  }
}
```

### Data Retention Policy

```typescript
interface DataRetentionPolicy {
  personalData: {
    activeUsers: 'indefinite'; // Докато е активен
    inactiveUsers: 90; // дни след последен login
    deletedUsers: 30; // дни grace period преди пълно изтриване
  };
  
  operationalData: {
    chargeSessions: 365 * 5; // 5 години (счетоводни изисквания)
    odometerReadings: 365 * 5;
    notifications: 90; // дни
  };
  
  auditLogs: {
    retention: 365 * 7; // 7 години (законово изискване)
  };
}
```

## 📊 Observability

### Logging Strategy

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'ecar-api',
    environment: process.env.NODE_ENV
  },
  transports: [
    // Console (development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File - All logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    
    // File - Errors only
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5
    })
  ]
});

// Structured logging examples
logger.info('User logged in', {
  userId: user.id,
  email: user.email,
  ipAddress: req.ip
});

logger.error('Failed to send notification', {
  notificationId: notification.id,
  userId: user.id,
  error: error.message,
  stack: error.stack
});
```

### Application Metrics

```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

// HTTP Request metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Business metrics
const chargeSessionsTotal = new Counter({
  name: 'charge_sessions_total',
  help: 'Total number of charge sessions created',
  labelNames: ['status']
});

const pendingOdometersGauge = new Gauge({
  name: 'pending_odometers_count',
  help: 'Current number of sessions pending odometer'
});

const notificationsSent = new Counter({
  name: 'notifications_sent_total',
  help: 'Total notifications sent',
  labelNames: ['type', 'status']
});

// Обновяване на метриките
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .inc();
  });
  
  next();
});

// Endpoint за Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Health Checks

```typescript
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      redis: 'unknown',
      smtp: 'unknown',
      worker: 'unknown'
    }
  };
  
  try {
    // Database check
    await db.$queryRaw`SELECT 1`;
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'unhealthy';
  }
  
  try {
    // Redis check
    await redisClient.ping();
    health.checks.redis = 'healthy';
  } catch (error) {
    health.checks.redis = 'unhealthy';
    health.status = 'degraded';
  }
  
  try {
    // SMTP check
    await emailService.verify();
    health.checks.smtp = 'healthy';
  } catch (error) {
    health.checks.smtp = 'unhealthy';
    health.status = 'degraded';
  }
  
  try {
    // Worker check
    const workers = await notificationQueue.getWorkers();
    health.checks.worker = workers.length > 0 ? 'healthy' : 'unhealthy';
  } catch (error) {
    health.checks.worker = 'unhealthy';
    health.status = 'degraded';
  }
  
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

---

**Следваща стъпка:** План за внедряване
