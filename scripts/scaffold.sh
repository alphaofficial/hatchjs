#!/usr/bin/env bash
# The Boring Architecture scaffold — generate pages, controllers, routes, jobs, mail templates, and event listeners.
#
# Usage:
#   scripts/scaffold.sh page <Name> [path] [--model] [--fields "a:type,b:type"]
#   scripts/scaffold.sh controller <Name>
#   scripts/scaffold.sh route <method> <path> <Controller.action> [--auth|--guest]
#   scripts/scaffold.sh model <Name> [--fields "a:type,b:type"]
#   scripts/scaffold.sh job <Name>
#   scripts/scaffold.sh mail <Name>
#   scripts/scaffold.sh event <Name>
#
# Field types: string, text, int, bool, date, datetime, decimal, uuid, json
# Append "?" for nullable, e.g. publishedAt:datetime?
#
# Examples:
#   scripts/scaffold.sh page Posts
#   scripts/scaffold.sh page Post --model --fields "title:string,body:text"
#   scripts/scaffold.sh model Post --fields "title:string,views:int"
#   scripts/scaffold.sh route get /health Public.health
#   scripts/scaffold.sh job SendWelcomeEmail
#   scripts/scaffold.sh mail OrderConfirmation
#   scripts/scaffold.sh event UserSubscribed

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PAGES_DIR="$ROOT/src/adapters/inbound/http/views/pages"
CTRL_DIR="$ROOT/src/adapters/inbound/http/controllers"
ROUTES_FILE="$ROOT/src/adapters/inbound/http/routes/route.ts"
MODELS_DIR="$ROOT/src/core/models"
MAPPINGS_DIR="$ROOT/src/adapters/outbound/persistence/mappings"
JOBS_DIR="$ROOT/src/adapters/inbound/jobs"
MAIL_DIR="$ROOT/src/adapters/outbound/mail/templates"
LISTENERS_DIR="$ROOT/src/adapters/shared/listeners"

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
camel_var() { printf '%s' "$1" | awk '{print tolower(substr($0,1,1)) substr($0,2)}'; }

# Insert a route line before `return route;`
insert_route_line() {
	local line="$1"
	grep -qF "$line" "$ROUTES_FILE" && { info "route already present, skipping"; return; }
	awk -v ins="$line" '
		/^[[:space:]]*return route;$/ && !done {
			print ins
			print ""
			done = 1
		}
		{ print }
	' "$ROUTES_FILE" > "$ROUTES_FILE.tmp"
	mv "$ROUTES_FILE.tmp" "$ROUTES_FILE"
	info "updated src/adapters/inbound/http/routes/route.ts"
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

ensure_route_controller() {
	local name="$1"
	local class_name="${name}Controller"
	local var_name
	var_name="$(camel_var "$name")Controller"

	# Inject controller instantiation inside createRoutes, after "const route = Router();"
	# This avoids the need to update the RouteControllers interface or function parameters
	if ! grep -qF "const ${var_name} = new ${class_name}();" "$ROUTES_FILE"; then
		awk -v ins="    const ${var_name} = new ${class_name}();" '
			/^[[:space:]]*const route = Router\(\);$/ && !done {
				print
				print ins
				done = 1
				next
			}
			{ print }
		' "$ROUTES_FILE" > "$ROUTES_FILE.tmp"
		mv "$ROUTES_FILE.tmp" "$ROUTES_FILE"
	fi
}

# --- generators ------------------------------------------------------------

make_controller() {
	local name="$1"              # Posts  or  Billing
	local file="$CTRL_DIR/${name}Controller.ts"
	mkdir -p "$CTRL_DIR"
	if [ -e "$file" ]; then
		info "controller exists: ${name}Controller.ts"
		return
	fi
	cat > "$file" <<TS
import { Request, Response } from 'express';
import { BaseController } from '@/adapters/inbound/http/controllers/BaseController';

export class ${name}Controller {
	index = async (req: Request, res: Response) => {
		return new BaseController(req, res).render('${name}', {
			title: '${name}',
		});
	};
}
TS
	green "created src/adapters/inbound/http/controllers/${name}Controller.ts"
}

make_page() {
	local page_path="$1"         # Posts  or  Auth/Profile
	local base
	base="$(basename_of "$page_path")"
	local dir="$PAGES_DIR"
	case "$page_path" in
		*/*)
			dir="$PAGES_DIR/${page_path%/*}"
			;;
	esac
	mkdir -p "$dir"
	local file="$dir/${base}.tsx"
	if [ -e "$file" ]; then
		info "page exists: ${page_path}.tsx"
		return
	fi
	cat > "$file" <<TSX
import { Head, Link } from '@inertiajs/react';

interface Props {
	title: string;
}

export default function ${base}({ title }: Props) {
	return (
		<>
			<Head>
				<title>{title}</title>
				<meta
					name="description"
					content="A clean starting point for your next Express, Inertia, and React product."
				/>
			</Head>

			<main className="min-h-screen overflow-x-hidden bg-white font-display text-slate-900 antialiased">
				<header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
					<div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
						<Link href="/" className="flex items-center gap-x-2.5">
							<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500 text-sm font-black text-white">
								{title.charAt(0).toUpperCase()}
							</span>
							<span className="text-lg font-bold tracking-tight text-slate-900">{title}</span>
						</Link>
						<nav className="hidden items-center gap-x-8 text-sm font-medium text-slate-700 md:flex">
							<a href="#features" className="transition-colors hover:text-slate-900">Features</a>
							<a href="#how" className="transition-colors hover:text-slate-900">How it works</a>
						</nav>
					</div>
				</header>

				<section>
					<div className="mx-auto max-w-6xl px-5 pb-16 pt-20 text-center sm:px-6 sm:pb-20 sm:pt-28 lg:pb-24 lg:pt-36">
						<h1 className="font-display text-[2.75rem] font-black leading-[1.08] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
						Build something <span className="text-rose-500">quietly excellent.</span>
						</h1>
						<p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
							The framework is in place: Express routes, Inertia pages, React views, and server rendering. Shape this landing page around the product you are building.
						</p>
					</div>

					<div className="mx-auto max-w-6xl px-5 pb-20 sm:px-6 sm:pb-24">
						<div className="overflow-hidden rounded-xl bg-slate-950 shadow-2xl shadow-slate-900/20">
							<div className="flex items-center gap-x-3 border-b border-slate-800 px-5 py-3">
								<div className="flex gap-1.5" aria-hidden="true">
									<span className="h-3 w-3 rounded-full bg-rose-500/70" />
									<span className="h-3 w-3 rounded-full bg-amber-500/70" />
									<span className="h-3 w-3 rounded-full bg-emerald-500/70" />
								</div>
								<span className="text-sm font-bold text-white">Run your workspace</span>
							</div>
							<div className="p-5">
								<div className="overflow-x-auto rounded-lg bg-black p-4 font-mono text-sm">
									<span className="select-none text-rose-400">$ </span>
									<span className="text-slate-100">npm run dev</span>
								</div>
								<p className="mt-4 text-sm leading-6 text-slate-400">
									Keep the layout, change the words, and turn this starting point into your own product story.
								</p>
							</div>
						</div>
					</div>
				</section>

				<section id="features" className="border-t border-slate-200 bg-slate-50 py-20 sm:py-24">
					<div className="mx-auto max-w-6xl px-5 sm:px-6">
						<div className="max-w-2xl">
							<p className="text-sm font-bold uppercase tracking-widest text-rose-500">What is already here</p>
							<h2 className="mt-3 font-display text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">A calm base for your product.</h2>
						</div>
						<div className="mt-12 grid gap-6 md:grid-cols-3">
							{['Express routing', 'Inertia pages', 'React SSR'].map((feature) => (
								<div key={feature} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
									<h3 className="text-lg font-bold text-slate-950">{feature}</h3>
									<p className="mt-3 text-sm leading-6 text-slate-600">Use this card as a placeholder for the product benefits your users should understand first.</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<section id="how" className="py-20 sm:py-24">
					<div className="mx-auto max-w-6xl px-5 text-center sm:px-6">
						<p className="text-sm font-bold uppercase tracking-widest text-rose-500">Next step</p>
						<h2 className="mt-3 font-display text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Make this page yours.</h2>
						<p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-700">Swap in your positioning, connect real routes, and keep the same responsive landing structure while your product takes shape.</p>
					</div>
				</section>
			</main>
		</>
	);
}
TSX
	green "created src/adapters/inbound/http/views/pages/${page_path}.tsx"
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
	mkdir -p "$MODELS_DIR"
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
	green "created src/core/models/${name}.ts"
}

make_mapping() {
	local name="$1"              # Post
	local fields="${2:-}"        # "title:string,body:text"
	local lower
	lower="$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]')"
	local table
	table="$(kebab "$name" | tr '-' '_')s"
	local file="$MAPPINGS_DIR/${lower}.map.ts"
	mkdir -p "$MAPPINGS_DIR"
	if [ -e "$file" ]; then
		info "mapping exists: ${lower}.map.ts"
		return
	fi
	local prop_lines
	prop_lines="$(emit_mapping_fields "$fields")"
	{
		printf 'import { EntitySchema } from "@mikro-orm/postgresql";\n'
		printf 'import { %s } from "@/core/models/%s";\n\n' "$name" "$name"
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
	green "created src/adapters/outbound/persistence/mappings/${lower}.map.ts"
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
	local ctrl_var
	ctrl_var="$(camel_var "$ctrl")Controller"

	ensure_import "import { ${ctrl}Controller } from '@/adapters/inbound/http/controllers/${ctrl}Controller';"
	ensure_route_controller "$ctrl"

	local middleware=""
	case "$guard" in
		auth)  middleware=", auth" ;;
		guest) middleware=", guest" ;;
	esac

	local line="    route.${method}('${url}'${middleware}, ${ctrl_var}.${action});"
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

make_job() {
	local name="$1"              # SendWelcomeEmail
	mkdir -p "$JOBS_DIR"
	local camel
	camel="$(printf '%s' "$name" | awk '{print tolower(substr($0,1,1)) substr($0,2)}')"
	local file="$JOBS_DIR/${camel}.ts"
	if [ -e "$file" ]; then
		info "job exists: ${camel}.ts"
		return
	fi
	cat > "$file" <<TS
import { PinoLogger } from '@/adapters/shared/logger/pinoLogger';

interface ${name}Payload extends Record<string, unknown> {
	// add your payload fields here
}

export async function ${camel}(payload: unknown): Promise<void> {
	const data = payload as ${name}Payload;
	PinoLogger.info({
		scope: 'job:${camel}',
		message: 'TODO: implement ${name}',
		params: data,
	});
}
TS
	green "created src/adapters/inbound/jobs/${camel}.ts"
}

make_mail() {
	local name="$1"              # OrderConfirmation
	mkdir -p "$MAIL_DIR"
	local file="$MAIL_DIR/${name}.ts"
	if [ -e "$file" ]; then
		info "mail template exists: ${name}.ts"
		return
	fi
	cat > "$file" <<TS
export interface ${name}Data {
	// add your template variables here
}

export function ${name}(data: ${name}Data): string {
	void data;
	return \`
		<p><!-- TODO: implement ${name} template --></p>
	\`;
}
TS
	green "created src/adapters/outbound/mail/templates/${name}.ts"
}

make_event_listener() {
	local name="$1"              # UserSubscribed
	mkdir -p "$LISTENERS_DIR"
	local camel
	camel="$(printf '%s' "$name" | awk '{print tolower(substr($0,1,1)) substr($0,2)}')"
	local file="$LISTENERS_DIR/${camel}.ts"
	if [ -e "$file" ]; then
		info "listener exists: ${camel}.ts"
		return
	fi
	cat > "$file" <<TS
import type { AppEvents } from '@/core/events/AppEvents';
import { Emitter } from '@/adapters/shared/events';

const eventName: keyof AppEvents = 'user.registered';

// TODO: replace eventName with the event you want to listen for
Emitter.on(eventName, (payload) => {
	// TODO: implement ${name} listener logic
	void payload;
});
TS
	green "created src/adapters/shared/listeners/${camel}.ts"
}

cmd_job() {
	local name="${1:-}"
	[ -z "$name" ] && die "usage: scaffold.sh job <Name>"
	assert_pascal "$name"
	make_job "$name"
}

cmd_mail() {
	local name="${1:-}"
	[ -z "$name" ] && die "usage: scaffold.sh mail <Name>"
	assert_pascal "$name"
	make_mail "$name"
}

cmd_event() {
	local name="${1:-}"
	[ -z "$name" ] && die "usage: scaffold.sh event <Name>"
	assert_pascal "$name"
	make_event_listener "$name"
}

# --- entrypoint ------------------------------------------------------------

sub="${1:-}"
shift || true
case "$sub" in
	page)       cmd_page "$@" ;;
	controller) cmd_controller "$@" ;;
	route)      cmd_route "$@" ;;
	model)      cmd_model "$@" ;;
	job)        cmd_job "$@" ;;
	mail)       cmd_mail "$@" ;;
	event)      cmd_event "$@" ;;
	""|-h|--help)
		sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'
		;;
	*) die "unknown command: $sub" ;;
esac
