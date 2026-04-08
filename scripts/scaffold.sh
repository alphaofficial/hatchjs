#!/usr/bin/env bash
# Hatch scaffold — generate pages, controllers, and routes.
#
# Usage:
#   scripts/scaffold.sh page <Name> [path] [--model] [--fields "a:type,b:type"]
#   scripts/scaffold.sh controller <Name>
#   scripts/scaffold.sh route <method> <path> <Controller.action> [--auth|--guest]
#   scripts/scaffold.sh model <Name> [--fields "a:type,b:type"]
#
# Field types: string, text, int, bool, date, datetime, decimal, uuid, json
# Append "?" for nullable, e.g. publishedAt:datetime?
#
# Examples:
#   scripts/scaffold.sh page Posts
#   scripts/scaffold.sh page Post --model --fields "title:string,body:text"
#   scripts/scaffold.sh model Post --fields "title:string,views:int"
#   scripts/scaffold.sh route get /health Public.health

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PAGES_DIR="$ROOT/src/views/pages"
CTRL_DIR="$ROOT/src/controllers"
ROUTES_FILE="$ROOT/src/routes/route.ts"
MODELS_DIR="$ROOT/src/models"
MAPPINGS_DIR="$ROOT/src/database/mappings"

red()   { printf '\033[31m%s\033[0m\n' "$*" >&2; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
info()  { printf '  %s\n' "$*"; }

die() { red "error: $*"; exit 1; }

# --- helpers ---------------------------------------------------------------

# PascalCase guard
assert_pascal() {
	case "$1" in
		[A-Z]*) ;;
		*) die "name must be PascalCase: $1" ;;
	esac
}

# Name -> kebab path segment (Posts -> posts, BlogPosts -> blog-posts)
kebab() {
	printf '%s' "$1" \
		| sed -E 's/([a-z0-9])([A-Z])/\1-\2/g' \
		| tr '[:upper:]' '[:lower:]'
}

# basename of a page path: Auth/Profile -> Profile
basename_of() { printf '%s' "${1##*/}"; }

# Insert a route line before `export default route;`
insert_route_line() {
	local line="$1"
	grep -qF "$line" "$ROUTES_FILE" && { info "route already present, skipping"; return; }
	# Insert a blank separator only if the previous line isn't already blank
	awk -v ins="$line" '
		/^export default route;/ && !done {
			print ins
			print ""
			done = 1
		}
		{ print }
	' "$ROUTES_FILE" > "$ROUTES_FILE.tmp"
	mv "$ROUTES_FILE.tmp" "$ROUTES_FILE"
	info "updated src/routes/route.ts"
}

ensure_import() {
	local import_line="$1"
	grep -qF "$import_line" "$ROUTES_FILE" && return
	# Insert after the last existing import line
	awk -v ins="$import_line" '
		/^import / { last = NR }
		{ lines[NR] = $0 }
		END {
			for (i = 1; i <= NR; i++) {
				print lines[i]
				if (i == last) print ins
			}
		}
	' "$ROUTES_FILE" > "$ROUTES_FILE.tmp"
	mv "$ROUTES_FILE.tmp" "$ROUTES_FILE"
}

# --- generators ------------------------------------------------------------

make_controller() {
	local name="$1"              # Posts  or  Billing
	local file="$CTRL_DIR/${name}Controller.ts"
	if [ -e "$file" ]; then
		info "controller exists: ${name}Controller.ts"
		return
	fi
	cat > "$file" <<TS
import { Request, Response } from 'express';
import { BaseController } from './BaseController';

export class ${name}Controller extends BaseController {
	static async index(req: Request, res: Response) {
		const instance = new ${name}Controller();
		return await instance.render(req, res, '${name}', {
			title: '${name}',
		});
	}
}
TS
	green "created src/controllers/${name}Controller.ts"
}

make_page() {
	local page_path="$1"         # Posts  or  Auth/Profile
	local base
	base="$(basename_of "$page_path")"
	local dir="$PAGES_DIR"
	case "$page_path" in
		*/*) dir="$PAGES_DIR/${page_path%/*}" ;;
	esac
	mkdir -p "$dir"
	local file="$dir/${base}.tsx"
	if [ -e "$file" ]; then
		info "page exists: ${page_path}.tsx"
		return
	fi
	cat > "$file" <<TSX
import { Head } from '@inertiajs/react';

interface Props {
	title: string;
}

export default function ${base}({ title }: Props) {
	return (
		<>
			<Head title="${base}" />
			<div className="min-h-screen bg-gray-50">
				<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
					<h1 className="text-3xl font-light">{title}</h1>
					<p className="mt-4 text-gray-600">
						Edit <code>src/views/pages/${page_path}.tsx</code> to get started.
					</p>
				</main>
			</div>
		</>
	);
}
TSX
	green "created src/views/pages/${page_path}.tsx"
}

# Resolve a field type spec ("string", "text?", "int", "datetime?") to:
#   echo "<ts_type> <mikro_type> <nullable:0|1>"
resolve_type() {
	local spec="$1"
	local nullable=0
	case "$spec" in
		*\?) nullable=1; spec="${spec%\?}" ;;
	esac
	local ts mikro
	case "$spec" in
		string|varchar)       ts=string;  mikro=string ;;
		text)                 ts=string;  mikro=text ;;
		int|integer|number)   ts=number;  mikro=number ;;
		bool|boolean)         ts=boolean; mikro=boolean ;;
		date|datetime)        ts=Date;    mikro=Date ;;
		decimal)              ts=string;  mikro=decimal ;;
		uuid)                 ts=string;  mikro=uuid ;;
		json)                 ts=any;     mikro=json ;;
		*) die "unknown field type: $spec (expected string|text|int|bool|date|decimal|uuid|json, optional ? suffix)" ;;
	esac
	printf '%s %s %s' "$ts" "$mikro" "$nullable"
}

# Emit TS class-property lines from FIELDS ("title:string,body:text?")
emit_model_fields() {
	local fields="$1"
	[ -z "$fields" ] && return
	local IFS=','
	for pair in $fields; do
		local fname="${pair%%:*}"
		local spec="${pair#*:}"
		local resolved ts _mikro nullable
		resolved="$(resolve_type "$spec")" || exit 1
		IFS=' ' read -r ts _mikro nullable <<< "$resolved"
		if [ "$nullable" = "1" ]; then
			printf '\t%s?: %s;\n' "$fname" "$ts"
		else
			printf '\t%s!: %s;\n' "$fname" "$ts"
		fi
	done
}

# Emit mikro EntitySchema property entries from FIELDS
emit_mapping_fields() {
	local fields="$1"
	[ -z "$fields" ] && return
	local IFS=','
	for pair in $fields; do
		local fname="${pair%%:*}"
		local spec="${pair#*:}"
		local resolved _ts mikro nullable
		resolved="$(resolve_type "$spec")" || exit 1
		IFS=' ' read -r _ts mikro nullable <<< "$resolved"
		if [ "$nullable" = "1" ]; then
			printf '\t\t%s: { type: "%s", nullable: true },\n' "$fname" "$mikro"
		else
			printf '\t\t%s: { type: "%s" },\n' "$fname" "$mikro"
		fi
	done
}

make_model() {
	local name="$1"              # Post
	local fields="${2:-}"        # "title:string,body:text"
	local file="$MODELS_DIR/${name}.ts"
	if [ -e "$file" ]; then
		info "model exists: ${name}.ts"
		return
	fi
	local field_lines
	field_lines="$(emit_model_fields "$fields")"
	{
		printf 'export class %s {\n' "$name"
		printf '\tid!: string;\n'
		[ -n "$field_lines" ] && printf '%s\n' "$field_lines"
		printf '\tcreatedAt: Date = new Date();\n'
		printf '\tupdatedAt: Date = new Date();\n'
		printf '}\n'
	} > "$file"
	green "created src/models/${name}.ts"
}

make_mapping() {
	local name="$1"              # Post
	local fields="${2:-}"        # "title:string,body:text"
	local lower
	lower="$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]')"
	local table
	table="$(kebab "$name" | tr '-' '_')s"
	local file="$MAPPINGS_DIR/${lower}.map.ts"
	if [ -e "$file" ]; then
		info "mapping exists: ${lower}.map.ts"
		return
	fi
	local prop_lines
	prop_lines="$(emit_mapping_fields "$fields")"
	{
		printf 'import { EntitySchema } from "@mikro-orm/postgresql";\n'
		printf 'import { %s } from "@/models/%s";\n\n' "$name" "$name"
		printf 'export const %sMapper = new EntitySchema<%s>({\n' "$name" "$name"
		printf '\tclass: %s,\n' "$name"
		printf '\ttableName: "%s",\n' "$table"
		printf '\tproperties: {\n'
		printf '\t\tid: { type: "string", primary: true },\n'
		[ -n "$prop_lines" ] && printf '%s\n' "$prop_lines"
		printf '\t\tcreatedAt: { type: "Date", defaultRaw: "CURRENT_TIMESTAMP" },\n'
		printf '\t\tupdatedAt: { type: "Date", defaultRaw: "CURRENT_TIMESTAMP", onUpdate: () => new Date() },\n'
		printf '\t},\n'
		printf '});\n'
	} > "$file"
	green "created src/database/mappings/${lower}.map.ts"
}

add_route() {
	local method="$1"            # get/post/put/delete
	local url="$2"               # /posts
	local target="$3"            # Posts.index
	local guard="$4"             # auth | guest | ""

	case "$method" in
		get|post|put|patch|delete) ;;
		*) die "unknown http method: $method" ;;
	esac

	local ctrl="${target%.*}"
	local action="${target#*.}"
	[ "$ctrl" = "$target" ] && die "route target must be Controller.action (got: $target)"

	ensure_import "import { ${ctrl}Controller } from '../controllers/${ctrl}Controller';"

	local middleware=""
	case "$guard" in
		auth)  middleware=", auth" ;;
		guest) middleware=", guest" ;;
	esac

	local line="route.${method}('${url}'${middleware}, ${ctrl}Controller.${action});"
	insert_route_line "$line"
}

# --- commands --------------------------------------------------------------

cmd_page() {
	local name="" url="" with_model=0 fields=""
	while [ $# -gt 0 ]; do
		case "$1" in
			--model)  with_model=1; shift ;;
			--fields) fields="${2:-}"; shift 2 ;;
			--)       shift; break ;;
			-*)       die "unknown flag: $1" ;;
			*)
				if [ -z "$name" ]; then name="$1"
				elif [ -z "$url" ]; then url="$1"
				else die "unexpected arg: $1"
				fi
				shift ;;
		esac
	done
	[ -z "$name" ] && die "usage: scaffold.sh page <Name> [path] [--model] [--fields \"a:string,b:text\"]"
	assert_pascal "$(basename_of "$name")"

	local base
	base="$(basename_of "$name")"
	[ -z "$url" ] && url="/$(kebab "$base")"
	[ -n "$fields" ] && [ "$with_model" = "0" ] && with_model=1

	make_controller "$base"
	make_page "$name"
	add_route get "$url" "${base}.index" ""
	if [ "$with_model" = "1" ]; then
		make_model "$base" "$fields"
		make_mapping "$base" "$fields"
		info "next: npm run migrate"
	fi
	# Refresh the generated pages.ts registry so the new page is wired up.
	# Skipped when there's no package.json (e.g. scaffold.sh tests in a tmp sandbox)
	# or when SCAFFOLD_SKIP_PAGES_GENERATE=1.
	if [ "${SCAFFOLD_SKIP_PAGES_GENERATE:-0}" != "1" ] && [ -f package.json ] && \
		grep -q '"pages:generate"' package.json; then
		npm run -s pages:generate >/dev/null || info "pages:generate failed; run 'npm run pages:generate' manually"
	fi
	green "done. visit ${url}"
}

cmd_model() {
	local name="" fields=""
	while [ $# -gt 0 ]; do
		case "$1" in
			--fields) fields="${2:-}"; shift 2 ;;
			-*)       die "unknown flag: $1" ;;
			*)        [ -z "$name" ] && name="$1" || die "unexpected arg: $1"; shift ;;
		esac
	done
	[ -z "$name" ] && die "usage: scaffold.sh model <Name> [--fields \"a:string,b:text\"]"
	assert_pascal "$name"
	make_model "$name" "$fields"
	make_mapping "$name" "$fields"
	info "next: npm run migrate"
}

cmd_controller() {
	local name="${1:-}"
	[ -z "$name" ] && die "usage: scaffold.sh controller <Name>"
	assert_pascal "$name"
	make_controller "$name"
}

cmd_route() {
	local method="${1:-}"
	local url="${2:-}"
	local target="${3:-}"
	local guard=""
	case "${4:-}" in
		--auth)  guard=auth ;;
		--guest) guard=guest ;;
		"")      ;;
		*)       die "unknown flag: $4" ;;
	esac
	[ -z "$method" ] || [ -z "$url" ] || [ -z "$target" ] && \
		die "usage: scaffold.sh route <method> <path> <Controller.action> [--auth|--guest]"
	add_route "$method" "$url" "$target" "$guard"
}

# --- entrypoint ------------------------------------------------------------

sub="${1:-}"
shift || true
case "$sub" in
	page)       cmd_page "$@" ;;
	controller) cmd_controller "$@" ;;
	route)      cmd_route "$@" ;;
	model)      cmd_model "$@" ;;
	""|-h|--help)
		sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'
		;;
	*) die "unknown command: $sub" ;;
esac
