#!/usr/bin/env bash
#
# express-inertia installer
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/alphaofficial/express-inertia/main/install.sh | bash -s my-app
#   curl -fsSL https://raw.githubusercontent.com/alphaofficial/express-inertia/main/install.sh | bash -s my-app --branch main --no-install
#
set -euo pipefail

REPO_URL="${EXPRESS_INERTIA_REPO:-https://github.com/alphaofficial/express-inertia.git}"
BRANCH="main"
DO_INSTALL=1
TARGET_DIR=""

# --- helpers ----------------------------------------------------------------
info()  { printf "\033[1;34m==>\033[0m %s\n" "$*"; }
ok()    { printf "\033[1;32m✓\033[0m %s\n" "$*"; }
warn()  { printf "\033[1;33m!\033[0m %s\n" "$*"; }
err()   { printf "\033[1;31m✗\033[0m %s\n" "$*" >&2; }
die()   { err "$*"; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

# --- arg parsing ------------------------------------------------------------
while [ $# -gt 0 ]; do
  case "$1" in
    --branch)
      shift
      BRANCH="${1:-main}"
      ;;
    --no-install)
      DO_INSTALL=0
      ;;
    -h|--help)
      cat <<EOF
express-inertia installer

Usage:
  install.sh <target-dir> [--branch <branch>] [--no-install]

Options:
  --branch <name>   Branch to clone (default: main)
  --no-install      Skip 'npm ci' and migrations
  -h, --help        Show this help
EOF
      exit 0
      ;;
    -*)
      die "Unknown option: $1"
      ;;
    *)
      if [ -z "$TARGET_DIR" ]; then
        TARGET_DIR="$1"
      else
        die "Unexpected argument: $1"
      fi
      ;;
  esac
  shift
done

[ -n "$TARGET_DIR" ] || die "Usage: install.sh <target-dir> [--branch <name>] [--no-install]"
[ ! -e "$TARGET_DIR" ] || die "Target directory '$TARGET_DIR' already exists"

# --- preflight --------------------------------------------------------------
info "Checking prerequisites"
require_cmd git
require_cmd node

NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
if [ "$NODE_MAJOR" -lt 20 ]; then
  die "Node.js >= 20 required (found $(node -v))"
fi
ok "Node $(node -v)"

if [ "$DO_INSTALL" = "1" ]; then
  require_cmd npm
fi

# --- clone ------------------------------------------------------------------
info "Cloning $REPO_URL ($BRANCH) into $TARGET_DIR"
git clone --depth=1 --branch "$BRANCH" "$REPO_URL" "$TARGET_DIR"
rm -rf "$TARGET_DIR/.git"
( cd "$TARGET_DIR" && git init -q && git add -A && git -c user.email=installer@local -c user.name=installer commit -q -m "Initial commit" || true )
ok "Project scaffolded"

# --- env --------------------------------------------------------------------
info "Generating .env"
cd "$TARGET_DIR"

if [ -f env.example ]; then
  cp env.example .env
else
  : > .env
fi

# Generate a strong session secret
if command -v openssl >/dev/null 2>&1; then
  SECRET=$(openssl rand -hex 32)
else
  SECRET=$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')
fi

# Replace placeholder if present, otherwise append
if grep -q '^SESSION_SECRET=' .env; then
  # portable in-place sed (mac + linux)
  awk -v s="$SECRET" 'BEGIN{FS=OFS="="} /^SESSION_SECRET=/{print "SESSION_SECRET",s; next} {print}' .env > .env.tmp && mv .env.tmp .env
else
  printf "SESSION_SECRET=%s\n" "$SECRET" >> .env
fi
ok ".env created with generated SESSION_SECRET"

# --- install + migrate ------------------------------------------------------
if [ "$DO_INSTALL" = "1" ]; then
  info "Installing dependencies (npm ci)"
  npm ci
  ok "Dependencies installed"

  info "Running database migrations"
  npm run migration:run
  ok "Migrations applied"
fi

# --- done -------------------------------------------------------------------
cat <<EOF

$(ok "express-inertia ready in ./$TARGET_DIR")

Next steps:

  cd $TARGET_DIR
  npm run dev

Then open http://localhost:3000

Useful commands:
  npm run dev              Start dev server (Express + Vite watch)
  npm run build            Production build
  npm start                Run built server
  npm test                 Run integration tests
  npm run migration:run    Apply pending migrations

EOF
