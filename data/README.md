# Data Directory

## Overview

This directory contains the database schema and seed data scripts for the VBP Performance OS MVP.

## Files

### `create_data.sql`
- **Purpose**: Complete database schema and synthetic demo data
- **Contains**: 
  - Schema definitions for 26 tables
  - Demo data for 5 Wichita-based provider groups
  - 30 members, 12 users, VBP contracts, performance metrics
  - Hospital events, referrals, care gaps, action tasks
- **Size**: ~46KB of SQL

## Database Initialization

The `create_data.sql` file is **copied** to `database/init/01-init.sql` and runs automatically when the PostgreSQL container is first created.

### How It Works

1. Docker Compose mounts `./database/init` to `/docker-entrypoint-initdb.d` in the postgres container
2. PostgreSQL automatically executes all `.sql` files in that directory on first startup
3. The schema is created and data is loaded before the application starts

### To Update Database Schema

If you modify `create_data.sql`:

```bash
# Option 1: Manually reload (for existing database)
docker exec -i vbp-postgres psql -U vbp_user -d vbp_database < data/create_data.sql

# Option 2: Copy and reset (fresh start)
cp data/create_data.sql database/init/01-init.sql
docker-compose down -v
docker-compose up -d
```

## Demo Data Overview

**Reporting Period**: Dec-25 Report  
**Rolling Window**: Jan-25 through Dec-25 (R12)  
**Market**: Wichita, Kansas  
**Data Type**: 100% synthetic (no PHI)

### Provider Groups (5)

1. **Ark Valley Primary Care Partners** - Strong performer (90% capture rate)
2. **Prairie Health Family Physicians** - Access and quality gaps (67% capture)
3. **ICT Community Care Network** - Hospital cost issues (56% capture)
4. **Riverside Medical Group of Wichita** - Referral leakage (65% capture)
5. **Air Capital Physician Alliance** - High-risk population (62% capture)

### Key Metrics

- **Members**: 30 (6 per group)
- **Users**: 12 across all organizations
- **VBP Domains**: 4 per contract (Access, Quality, Hospital Costs, Referral Costs)
- **Performance Metrics**: 16 tracked metrics per provider
- **Care Gaps**: 11 open gaps requiring intervention
- **Hospital Events**: 9 admissions/ER visits
- **Referral Events**: 9 specialty referrals (some OON)
- **Action Tasks**: 9 care management tasks

## Notes

- All data is synthetic for demonstration purposes
- Member names, DOBs, and identifiers are fictional
- Performance metrics represent realistic VBP scenarios
- Financial amounts are scaled for demo clarity
