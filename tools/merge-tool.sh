#!/bin/bash

# Smart Merge Tool for Forgesteel Draachenmar
# Merges updates from community repo while preserving custom changes

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DRAACHENMAR_DIR="$PWD"
ANDY_DIR="../forgesteel-andy"
BACKUP_DIR="$HOME/forgesteel-backups/backup-$(date +%Y%m%d-%H%M%S)"
MERGE_REPORT="merge-report-$(date +%Y%m%d-%H%M%S).txt"

# Files to always keep (ours - never auto-merge)
# NOTE: These are Draachenmar-specific customizations that should never be overwritten
# by community updates. Server/ and db/ contain our backend implementation.
ALWAYS_KEEP=(
    # Backend infrastructure (MySQL + Express API)
    "server/"
    "db/"

    # Draachenmar-specific sourcebooks
    "src/data/sourcebooks/draachenmar.ts"
    "src/data/sourcebooks/draachenmar-extensions.ts"

    # Authentication and API services
    "src/services/api.ts"                    # Contains encounter API client + all backend integrations
    "src/services/firebase.ts"
    "src/services/character-storage.ts"
    "src/services/encounter-storage.ts"      # Campaign encounter sync service

    # Auth context and pages
    "src/contexts/AuthContext.tsx"
    "src/components/pages/auth/auth-page.tsx"

    # Custom modals for backend features
    "src/components/modals/admin-tools/"
    "src/components/modals/assign-gm/"
    "src/components/modals/assign-campaign/"
    "src/components/modals/sync-encounter/"       # Campaign encounter sync modal

    # Navigation components with Draachenmar customizations
    "src/components/panels/app-footer/"           # Contains Campaigns button navigation

    # Library edit page with Sync to Campaign button
    "src/components/pages/library/library-edit/library-edit-page.tsx"  # Has "Sync to Campaign" button for encounters

    # Campaign system (Draachenmar-specific backend integration)
    "src/components/pages/campaigns/"             # Campaign list and details pages (includes .scss with tab styles)
    "src/components/campaigns/"                   # Campaign sub-components including:
                                                  #   - EncounterList.tsx (monster count display with sourcebooks)
                                                  #   - ProjectList.tsx, CharacterList.tsx
    "src/models/campaign.ts"                      # Campaign TypeScript models

    # Documentation
    "claudedocs/"
    ".htaccess"
    "MERGE_GUIDE.md"
    "MERGE_SUMMARY.md"
    "ADDITIVE_ARCHITECTURE.md"
    "DEV_COMMANDS.md"
    "merge-tool.sh"
    "tools/"
    "sample_characters/"
)

# Community sourcebooks to auto-merge (accept theirs)
COMMUNITY_SOURCEBOOKS=(
    "src/data/sourcebooks/core.ts"
    "src/data/sourcebooks/playtest.ts"
    "src/data/sourcebooks/magazine-ratcatcher.ts"
    "src/data/sourcebooks/magazine-blacksmith.ts"
)

# Draachenmar-specific ancestries (keep - never auto-merge)
DRAACHENMAR_ANCESTRIES=(
    "src/data/ancestries/angulotl.ts"
    "src/data/ancestries/aurealgar.ts"
    "src/data/ancestries/aurkin.ts"
    "src/data/ancestries/aurven.ts"
    "src/data/ancestries/caprini.ts"
    "src/data/ancestries/cervari.ts"
    "src/data/ancestries/elgari.ts"
    "src/data/ancestries/falcar.ts"
    "src/data/ancestries/lizardfolk.ts"
    "src/data/ancestries/seraphite.ts"
    "src/data/ancestries/strigara.ts"
    "src/data/ancestries/verminari.ts"
    "src/data/ancestries/warforged.ts"
    "src/data/ancestries/zefiri.ts"
)

# Files requiring manual merge
MANUAL_MERGE=(
    "src/components/main/main.tsx"
    "src/index.tsx"
    "package.json"
    "src/data/ancestry-data.ts"
    "src/components/pages/heroes/hero-view/hero-view-page.tsx"
    "vite.config.ts"
)

# Log function
log() {
    echo -e "${GREEN}[MERGE]${NC} $1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$MERGE_REPORT"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    echo "[WARNING] $1" >> "$MERGE_REPORT"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "[ERROR] $1" >> "$MERGE_REPORT"
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    if [ ! -d "$ANDY_DIR" ]; then
        log_error "Andy repo not found at: $ANDY_DIR"
        exit 1
    fi

    if [ ! -d "$DRAACHENMAR_DIR/.git" ]; then
        log_error "Not in a git repository"
        exit 1
    fi

    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        log_error "You have uncommitted changes. Please commit or stash them first."
        git status --short
        exit 1
    fi

    log "Prerequisites check passed ✓"
}

# Create backup
create_backup() {
    log "Creating backup at: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"

    # Backup entire directory
    cp -r "$DRAACHENMAR_DIR" "$BACKUP_DIR/"

    log "Backup created ✓"
}

# Analyze differences
analyze_differences() {
    log "Analyzing differences between repos..."

    echo "" >> "$MERGE_REPORT"
    echo "=== DIFFERENCE ANALYSIS ===" >> "$MERGE_REPORT"
    echo "" >> "$MERGE_REPORT"

    # Find new files in Andy repo
    log_info "Finding new files in community repo..."

    cd "$ANDY_DIR"
    find . -type f \
        -not -path "./.git/*" \
        -not -path "./node_modules/*" \
        -not -path "./distribution/*" \
        -not -path "./dist/*" \
        > /tmp/andy-files.txt

    cd "$DRAACHENMAR_DIR"
    find . -type f \
        -not -path "./.git/*" \
        -not -path "./node_modules/*" \
        -not -path "./distribution/*" \
        -not -path "./dist/*" \
        -not -path "./server/*" \
        -not -path "./db/*" \
        -not -path "./claudedocs/*" \
        > /tmp/draach-files.txt

    # New files in Andy that aren't in Draachenmar
    comm -23 <(sort /tmp/andy-files.txt) <(sort /tmp/draach-files.txt) > /tmp/new-files.txt

    if [ -s /tmp/new-files.txt ]; then
        log_info "New files found in community repo:"
        cat /tmp/new-files.txt | head -20
        echo "NEW FILES:" >> "$MERGE_REPORT"
        cat /tmp/new-files.txt >> "$MERGE_REPORT"
        echo "" >> "$MERGE_REPORT"
    fi

    # Modified files
    log_info "Finding modified files..."

    while IFS= read -r file; do
        if [ -f "$ANDY_DIR/$file" ] && [ -f "$DRAACHENMAR_DIR/$file" ]; then
            if ! diff -q "$ANDY_DIR/$file" "$DRAACHENMAR_DIR/$file" > /dev/null 2>&1; then
                echo "$file" >> /tmp/modified-files.txt
            fi
        fi
    done < /tmp/draach-files.txt

    if [ -s /tmp/modified-files.txt ]; then
        log_info "Modified files found:"
        cat /tmp/modified-files.txt | head -20
        echo "MODIFIED FILES:" >> "$MERGE_REPORT"
        cat /tmp/modified-files.txt >> "$MERGE_REPORT"
        echo "" >> "$MERGE_REPORT"
    fi
}

# Check if file should be kept (never overwrite)
should_keep_file() {
    local file="$1"

    for pattern in "${ALWAYS_KEEP[@]}"; do
        if [[ "$file" == "$pattern"* ]]; then
            return 0  # Keep
        fi
    done

    for ancestry in "${DRAACHENMAR_ANCESTRIES[@]}"; do
        if [[ "$file" == "$ancestry" ]]; then
            return 0  # Keep
        fi
    done

    return 1  # Don't auto-keep
}

# Check if file is a community sourcebook (always accept theirs)
is_community_sourcebook() {
    local file="$1"

    for sourcebook in "${COMMUNITY_SOURCEBOOKS[@]}"; do
        if [[ "$file" == "$sourcebook" ]]; then
            return 0  # Is community sourcebook
        fi
    done

    return 1  # Not community sourcebook
}

# Check if file needs manual merge
needs_manual_merge() {
    local file="$1"

    for pattern in "${MANUAL_MERGE[@]}"; do
        if [[ "$file" == "$pattern" ]]; then
            return 0  # Needs manual merge
        fi
    done

    return 1  # Auto-merge OK
}

# Merge new files
merge_new_files() {
    log "Merging new files from community repo..."

    if [ ! -s /tmp/new-files.txt ]; then
        log_info "No new files to merge"
        return
    fi

    local count=0
    while IFS= read -r file; do
        # Remove leading ./ if present
        file="${file#./}"

        # Skip if it's a file we should never merge
        if should_keep_file "$file"; then
            log_warn "Skipping protected file: $file"
            continue
        fi

        # Copy new file
        local dir=$(dirname "$file")
        mkdir -p "$dir"
        cp "$ANDY_DIR/$file" "$file"

        log_info "Copied new file: $file"
        count=$((count + 1))
    done < /tmp/new-files.txt

    log "Copied $count new files ✓"
}

# Merge modified files
merge_modified_files() {
    log "Merging modified files..."

    if [ ! -s /tmp/modified-files.txt ]; then
        log_info "No modified files to merge"
        return
    fi

    local auto_merged=0
    local manual_needed=0
    local skipped=0
    local community_merged=0

    while IFS= read -r file; do
        # Remove leading ./ if present
        file="${file#./}"

        # Skip protected files
        if should_keep_file "$file"; then
            log_warn "Skipping protected file: $file"
            skipped=$((skipped + 1))
            continue
        fi

        # Always auto-merge community sourcebooks
        if is_community_sourcebook "$file"; then
            cp "$ANDY_DIR/$file" "$file"
            log_info "Auto-merged community sourcebook: $file"
            community_merged=$((community_merged + 1))
            continue
        fi

        # Check if manual merge needed
        if needs_manual_merge "$file"; then
            log_warn "Manual merge needed: $file"
            echo "MANUAL_MERGE_NEEDED: $file" >> "$MERGE_REPORT"

            # Create side-by-side comparison
            mkdir -p ".merge-conflicts"
            cp "$file" ".merge-conflicts/$(basename $file).draachenmar"
            cp "$ANDY_DIR/$file" ".merge-conflicts/$(basename $file).andy"

            manual_needed=$((manual_needed + 1))
            continue
        fi

        # Auto-merge (accept theirs for non-critical files)
        cp "$ANDY_DIR/$file" "$file"
        log_info "Auto-merged: $file"
        auto_merged=$((auto_merged + 1))

    done < /tmp/modified-files.txt

    log "Community sourcebooks auto-merged: $community_merged files ✓"
    log "Auto-merged: $auto_merged files ✓"
    log_warn "Manual merge needed: $manual_needed files"
    log_info "Skipped (protected): $skipped files"
}

# Update package.json carefully
merge_package_json() {
    log "Merging package.json (preserving backend dependencies)..."

    if [ ! -f "$ANDY_DIR/package.json" ]; then
        log_warn "No package.json in Andy repo"
        return
    fi

    # Create comparison files
    mkdir -p ".merge-conflicts"
    cp "package.json" ".merge-conflicts/package.json.draachenmar"
    cp "$ANDY_DIR/package.json" ".merge-conflicts/package.json.andy"

    log_warn "package.json needs manual merge - files saved to .merge-conflicts/"
    echo "MANUAL_MERGE_NEEDED: package.json" >> "$MERGE_REPORT"
}

# Create merge summary
create_summary() {
    log "Creating merge summary..."

    echo "" >> "$MERGE_REPORT"
    echo "=== MERGE SUMMARY ===" >> "$MERGE_REPORT"
    echo "Date: $(date)" >> "$MERGE_REPORT"
    echo "Backup Location: $BACKUP_DIR" >> "$MERGE_REPORT"
    echo "" >> "$MERGE_REPORT"

    if [ -d ".merge-conflicts" ]; then
        echo "FILES REQUIRING MANUAL MERGE:" >> "$MERGE_REPORT"
        ls -1 .merge-conflicts/ >> "$MERGE_REPORT"
        echo "" >> "$MERGE_REPORT"

        log_warn "Manual merge required for files in .merge-conflicts/"
        log_info "Compare: .merge-conflicts/*.draachenmar vs .merge-conflicts/*.andy"
    fi

    echo "" >> "$MERGE_REPORT"
    echo "NEXT STEPS:" >> "$MERGE_REPORT"
    echo "1. Review changes: git status" >> "$MERGE_REPORT"
    echo "2. Manually merge files in .merge-conflicts/" >> "$MERGE_REPORT"
    echo "3. Test: npm install && npm run build" >> "$MERGE_REPORT"
    echo "4. Test backend: npm run server:build" >> "$MERGE_REPORT"
    echo "5. Commit: git add . && git commit -m 'Merge community updates'" >> "$MERGE_REPORT"
    echo "" >> "$MERGE_REPORT"

    log "Merge report saved to: $MERGE_REPORT"
}

# Main execution
main() {
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════╗"
    echo "║   Forgesteel Draachenmar Smart Merge Tool    ║"
    echo "╚═══════════════════════════════════════════════╝"
    echo -e "${NC}"

    log "Starting merge process..."

    check_prerequisites
    create_backup
    analyze_differences
    merge_new_files
    merge_modified_files
    merge_package_json
    create_summary

    echo ""
    log "Merge process completed! ✓"
    echo ""
    log_info "Review the merge report: $MERGE_REPORT"
    log_info "Backup location: $BACKUP_DIR"

    if [ -d ".merge-conflicts" ]; then
        echo ""
        log_warn "⚠️  Manual merge required for some files"
        log_info "Check .merge-conflicts/ directory"
    fi

    echo ""
    log_info "Next steps:"
    echo "  1. git status                  # Review changes"
    echo "  2. Resolve conflicts in .merge-conflicts/"
    echo "  3. npm install                 # Update dependencies"
    echo "  4. npm run build               # Test frontend"
    echo "  5. npm run server:build        # Test backend"
    echo "  6. git add . && git commit     # Commit changes"
}

# Run
main
