#!/usr/bin/env bash
#
# Hatch JS installer — scaffolds a fullstack starter into a fresh directory.
#
# Interactive (recommended):
#   curl -fsSL https://raw.githubusercontent.com/alphaofficial/hatchjs/main/install.sh | bash
#
# Non-interactive (defaults):
#   curl -fsSL https://raw.githubusercontent.com/alphaofficial/hatchjs/main/install.sh | bash -s -- --quick my-app
#
# Flags:
#   --quick               Skip prompts and use defaults
#   --branch <name>       Branch to clone (default: main)
#   --no-install          Skip 'npm install' and migrations
#   --no-git              Skip 'git init' inside the new project
#
set -euo pipefail

REPO_URL="${HATCH_REPO:-https://github.com/alphaofficial/hatchjs.git}"
REPO_API="${HATCH_REPO_API:-https://api.github.com/repos/alphaofficial/hatchjs}"
REF=""           # Resolved later — defaults to latest released tag
REF_KIND=""      # "tag" or "branch"
DO_INSTALL=1
DO_GIT=1
QUICK=0
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

# Read a single line from the user, even when piped via curl. Falls back
# to the provided default if no TTY is available.
prompt() {
  local msg="$1"
  local default="${2:-}"
  local reply=""

  if [ -e /dev/tty ]; then
    if [ -n "$default" ]; then
      printf "  %s [%s]: " "$msg" "$default" > /dev/tty
    else
      printf "  %s: " "$msg" > /dev/tty
    fi
    IFS= read -r reply < /dev/tty || reply=""
  fi

  if [ -z "$reply" ]; then
    reply="$default"
  fi
  printf "%s" "$reply"
}

slugify() {
  printf "%s" "$1" | tr '[:upper:] ' '[:lower:]-' | tr -cd 'a-z0-9-_' | sed 's/^-//;s/-$//'
}

# --- arg parsing ------------------------------------------------------------
while [ $# -gt 0 ]; do
  case "$1" in
    --quick)        QUICK=1 ;;
    --no-install)   DO_INSTALL=0 ;;
    --no-git)       DO_GIT=0 ;;
    --branch)       shift; REF="${1:-main}"; REF_KIND="branch" ;;
    --tag)          shift; REF="${1:?}"; REF_KIND="tag" ;;
    --ref)          shift; REF="${1:?}"; REF_KIND="branch" ;;
    -h|--help)
      cat <<EOF
Hatch JS installer

Usage:
  install.sh [target-dir] [--quick] [--branch <name>] [--no-install] [--no-git]

Options:
  --quick           Skip prompts and use defaults
  --tag <name>      Pin a specific release tag (default: latest release)
  --branch <name>   Clone a branch instead of a release tag
  --no-install      Skip 'npm install' and migrations
  --no-git          Skip 'git init' inside the new project
  -h, --help        Show this help
EOF
      exit 0
      ;;
    -*) die "Unknown option: $1" ;;
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

# --- gather settings --------------------------------------------------------
DEFAULT_NAME="${TARGET_DIR:-my-hatch-app}"
DEFAULT_NAME=$(slugify "$DEFAULT_NAME")
[ -n "$DEFAULT_NAME" ] || DEFAULT_NAME="my-hatch-app"

GIT_AUTHOR=$(git config --global user.name 2>/dev/null || true)
GIT_EMAIL=$(git config --global user.email 2>/dev/null || true)
DEFAULT_AUTHOR="$GIT_AUTHOR"
[ -n "$GIT_EMAIL" ] && [ -n "$GIT_AUTHOR" ] && DEFAULT_AUTHOR="$GIT_AUTHOR <$GIT_EMAIL>"

if [ "$QUICK" = "1" ]; then
  APP_SLUG="$DEFAULT_NAME"
  APP_NAME=$(printf "%s" "$DEFAULT_NAME" | awk -F- '{for(i=1;i<=NF;i++)$i=toupper(substr($i,1,1)) substr($i,2)}1' OFS=" ")
  APP_DESC="A Hatch JS app"
  APP_AUTHOR="$DEFAULT_AUTHOR"
  APP_DB="sqlite"
  APP_PORT="3000"
else
  echo
  info "Configure your project (press enter to accept defaults)"
  APP_SLUG=$(prompt "Project directory" "$DEFAULT_NAME")
  APP_SLUG=$(slugify "$APP_SLUG")
  [ -n "$APP_SLUG" ] || APP_SLUG="$DEFAULT_NAME"

  DEFAULT_DISPLAY=$(printf "%s" "$APP_SLUG" | awk -F- '{for(i=1;i<=NF;i++)$i=toupper(substr($i,1,1)) substr($i,2)}1' OFS=" ")
  APP_NAME=$(prompt "Display name" "$DEFAULT_DISPLAY")
  APP_DESC=$(prompt "Description" "A Hatch JS app")
  APP_AUTHOR=$(prompt "Author" "$DEFAULT_AUTHOR")
  APP_DB=$(prompt "Database (sqlite|postgres)" "sqlite")
  APP_PORT=$(prompt "Dev server port" "3000")
fi

case "$APP_DB" in
  sqlite|postgres) ;;
  *) die "Database must be 'sqlite' or 'postgres' (got: $APP_DB)" ;;
esac

[ ! -e "$APP_SLUG" ] || die "Target directory '$APP_SLUG' already exists"

# --- resolve ref (latest released tag unless overridden) -------------------
if [ -z "$REF" ]; then
  info "Resolving latest released version"
  LATEST=""
  if command -v curl >/dev/null 2>&1; then
    LATEST=$(curl -fsSL "$REPO_API/releases/latest" 2>/dev/null \
      | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' \
      | head -n1 || true)
  fi
  if [ -n "$LATEST" ]; then
    REF="$LATEST"
    REF_KIND="tag"
    ok "Latest release: $REF"
  else
    warn "Could not resolve latest release — falling back to main branch"
    REF="main"
    REF_KIND="branch"
  fi
fi

# --- clone ------------------------------------------------------------------
echo
info "Cloning $REPO_URL ($REF_KIND: $REF) into $APP_SLUG"
git clone --depth=1 --branch "$REF" --quiet "$REPO_URL" "$APP_SLUG"
rm -rf "$APP_SLUG/.git"
ok "Source fetched"

cd "$APP_SLUG"

# --- prune source-only files -----------------------------------------------
rm -rf test
rm -f install.sh Dockerfile ecosystem.config.js start.sh

# --- replace marketing landing with a minimal starter Home -----------------
cat > src/views/pages/Home.tsx <<'TSX'
import { Head } from '@inertiajs/react';

interface Props {
	applicationName: string;
}

export default function Home({ applicationName }: Props) {
	return (
		<>
			<Head>
				<title>{applicationName}</title>
			</Head>
			<main className="min-h-screen bg-white text-gray-900 antialiased flex items-center justify-center px-6">
				<div className="max-w-xl text-center">
					<div className="mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center rounded-md bg-gray-900 text-white text-lg font-bold">
						{applicationName.charAt(0)}
					</div>
					<h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
						Welcome to {applicationName}
					</h1>
					<p className="mt-6 text-lg text-gray-600">
						Edit <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm">src/views/pages/Home.tsx</code> and save to reload.
					</p>
					<p className="mt-8 text-sm text-gray-500">
						See the{' '}
						<a
							href="https://github.com/alphaofficial/hatchjs/blob/main/docs/DEVELOPER_GUIDE.md"
							className="font-semibold text-gray-900 underline underline-offset-2 hover:no-underline"
						>
							developer guide
						</a>{' '}
						to add controllers, pages, and models.
					</p>
				</div>
			</main>
		</>
	);
}
TSX

# --- strip demo pages, controllers, and routes ------------------------------
# Keep User model + auth middleware + sessions as plumbing, but remove all
# auth UI and demo pages. Devs add their own routes/pages from a clean slate.
rm -f \
  src/views/pages/About.tsx \
  src/views/pages/Dashboard.tsx \
  src/views/pages/Users.tsx \
  src/views/pages/User.tsx \
  src/views/pages/Auth/Login.tsx \
  src/views/pages/Auth/Register.tsx \
  src/controllers/AboutController.ts \
  src/controllers/AuthController.ts \
  src/controllers/UserController.ts
rmdir src/views/pages/Auth 2>/dev/null || true

cat > src/config/pages.ts <<'TS'
const VIEWS = ['Home', 'Error'] as const;

export type PageName = (typeof VIEWS)[number];
TS

cat > src/routes/route.ts <<'TS'
import { Router } from 'express';
import { PublicController } from '../controllers/PublicController';
import { InertiaExpressMiddleware } from '../middleware/inertia';

const route = Router();

route.use(InertiaExpressMiddleware.apply);

route.get('/', PublicController.index);

export default route;
TS

# --- patch package.json -----------------------------------------------------
info "Updating package.json"
APP_SLUG="$APP_SLUG" APP_DESC="$APP_DESC" APP_AUTHOR="$APP_AUTHOR" HATCH_REF="$REF" HATCH_REF_KIND="$REF_KIND" \
  node - <<'NODE'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

pkg.name = process.env.APP_SLUG;
pkg.version = '0.1.0';
pkg.description = process.env.APP_DESC;
pkg.author = process.env.APP_AUTHOR;
pkg.license = 'MIT';
pkg.hatch = { version: process.env.HATCH_REF, kind: process.env.HATCH_REF_KIND };

if (pkg.scripts) {
  delete pkg.scripts.test;
  delete pkg.scripts['test:integration'];
}

const TEST_DEPS = [
  'jest',
  '@types/jest',
  'ts-jest',
  'jest-mock-extended',
  'supertest',
  '@types/supertest',
];
if (pkg.devDependencies) {
  for (const d of TEST_DEPS) delete pkg.devDependencies[d];
}

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
NODE
ok "package.json updated"

# Refresh lockfile so npm install reflects the new dep set.
rm -f package-lock.json

# --- write .env -------------------------------------------------------------
info "Writing .env"

if command -v openssl >/dev/null 2>&1; then
  SECRET=$(openssl rand -hex 32)
else
  SECRET=$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')
fi

cat > .env <<EOF
# Generated by the Hatch JS installer
NODE_ENV=development
PORT=$APP_PORT
APP_NAME=$APP_NAME
APP_URL=http://localhost:$APP_PORT
TRUST_PROXY=loopback

SESSION_SECRET=$SECRET
SESSION_MAX_AGE=86400000

DB_PATH=$APP_SLUG.db

RATE_LIMIT_ENABLED=false
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_AUTH_WINDOW_MS=60000
EOF
ok ".env created with generated SESSION_SECRET"

if [ "$APP_DB" = "postgres" ]; then
  warn "Postgres selected — edit src/database/orm.config.ts to switch the driver to @mikro-orm/postgresql and add DATABASE_URL to .env"
fi

# --- install + migrate ------------------------------------------------------
if [ "$DO_INSTALL" = "1" ]; then
  info "Installing dependencies (npm install)"
  npm install --silent --no-audit --no-fund
  ok "Dependencies installed"

  if [ "$APP_DB" = "sqlite" ]; then
    info "Running database migrations"
    npm run migration:run --silent
    ok "Migrations applied"
  else
    warn "Skipping migrations — configure Postgres first, then run: npm run migration:run"
  fi
fi

# --- git init ---------------------------------------------------------------
if [ "$DO_GIT" = "1" ]; then
  info "Initializing fresh git history"
  git init -q
  git add -A
  if [ -n "$GIT_AUTHOR" ] && [ -n "$GIT_EMAIL" ]; then
    git commit -q -m "Initial commit from Hatch JS" || true
  else
    git -c user.name="hatch" -c user.email="hatch@local" commit -q -m "Initial commit from Hatch JS" || true
  fi
  ok "git initialized"
fi

# --- done -------------------------------------------------------------------
cat <<EOF

$(ok "$APP_NAME is ready in ./$APP_SLUG")

Next steps:

  cd $APP_SLUG
  npm run dev

Then open http://localhost:$APP_PORT

Useful commands:
  npm run dev              Start dev server
  npm run build            Production build
  npm start                Run built server
  npm run migration:run    Apply pending migrations
  npm run migration:create Create a blank migration

EOF
