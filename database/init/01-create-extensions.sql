-- Enable required PostgreSQL extensions

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Earth distance calculations (for station locations)
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- Text search (for future search functionality)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
