# Story 9.6: Database Migration Safety

## Story Info
- **Epic**: 9 - Production Hardening
- **Status**: done
- **Started**: 2025-12-25
- **Completed**: 2025-12-25
- **FRs Covered**: FR59 (Database Migrations)

## User Story

As a database administrator,
I want safe migration patterns,
So that schema changes don't cause downtime.

## Acceptance Criteria

### AC1: Migration Rollback Capability
**Given** a migration has been applied
**When** issues are discovered
**Then** the migration can be rolled back safely

### AC2: Zero-Downtime Migration Patterns
**Given** a production database
**When** migrations are applied
**Then** they follow zero-downtime patterns

### AC3: Migration Dry-Run in CI
**Given** pending migrations
**When** CI runs validation
**Then** migrations are validated without applying

### AC4: Backup Before Migration
**Given** a migration is about to run
**When** the script executes
**Then** a backup is created first

## Technical Implementation

### Safe Migration Script

`scripts/migrate-safe.sh` provides:

```bash
# Commands
./scripts/migrate-safe.sh up              # Apply pending migrations
./scripts/migrate-safe.sh down            # Rollback last migration
./scripts/migrate-safe.sh status          # Show migration status
./scripts/migrate-safe.sh history         # Show history
./scripts/migrate-safe.sh validate        # Dry-run validation
./scripts/migrate-safe.sh backup          # Create backup only

# Options
--dry-run       # Simulate without changes
--skip-backup   # Skip backup (not recommended)
--force         # Force despite warnings
--verbose       # Verbose output
```

### Zero-Downtime Patterns Validated

The script warns about:
- `DROP TABLE/DATABASE` statements
- Non-transactional migrations
- `NOT NULL` columns without `DEFAULT`
- Non-concurrent index creation

### Rollback Directory Structure

```
supabase/migrations/
├── 20231223_001_add_rls_policies.sql
├── 20241224_002_aria_conversations.sql
├── rollback/
│   └── 20241224_002_aria_conversations_down.sql
```

### Backup Management

- Automatic backup before each migration
- Stored in `./backups/` directory
- Retention: 5 most recent backups
- Format: `backup_YYYYMMDD_HHMMSS.sql`

### Migration Tracking

- Local tracking via `.migration_history`
- Migration status command shows applied vs pending
- History command shows chronological order

### Files Created

| File | Purpose |
|------|---------|
| `scripts/migrate-safe.sh` | Main migration script |
| `docs/migration-safety.md` | Comprehensive documentation |
| `supabase/migrations/rollback/` | Rollback scripts directory |
| Example rollback script | Template for rollbacks |

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Validate Migrations
  run: |
    chmod +x ./scripts/migrate-safe.sh
    ./scripts/migrate-safe.sh --dry-run validate
```

## Definition of Done
- [x] Safe migration script created
- [x] Rollback capability implemented
- [x] Zero-downtime pattern validation
- [x] Dry-run mode for CI
- [x] Automatic backup before migration
- [x] Backup retention management
- [x] Migration history tracking
- [x] Comprehensive documentation
- [x] Rollback directory structure
- [x] Example rollback script

## Usage Examples

```bash
# CI validation
./scripts/migrate-safe.sh --dry-run validate

# Production migration
./scripts/migrate-safe.sh up

# Emergency rollback
./scripts/migrate-safe.sh down

# Check status
./scripts/migrate-safe.sh status
```
