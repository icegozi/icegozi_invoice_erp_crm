# ============================================================
#  invoice ERP/CRM — Docker Makefile (MERN stack)
#  Services: mongo (invoice-mongo) · backend (invoice-backend) · frontend (invoice-frontend)
#  Run `make help` to list all commands.
# ============================================================

# ---------- Config ----------
COMPOSE       := docker compose
NODE_IMAGE    := node:20.9.0-slim

BACKEND       := invoice-backend
FRONTEND      := invoice-frontend
DB            := invoice-mongo
MONGO_DB      := invoice

BACKUP_DIR    := backups

# ---------- Colors ----------
TITLE_COLOR   := \033[1;33m
COMMAND_COLOR := \033[0;32m
NO_COLOR      := \033[0m

.DEFAULT_GOAL := help

# =====================================================================
#  Help
# =====================================================================
help: ## List all command name
	@printf "${TITLE_COLOR}Usage:${NO_COLOR}\n";\
	printf "  ${COMMAND_COLOR}make <command>${NO_COLOR}\n\n";\
	printf "${TITLE_COLOR}Example:${NO_COLOR}\n";\
	printf "  ${COMMAND_COLOR}make up${NO_COLOR}\n\n";\
	printf "${TITLE_COLOR}Available commands:${NO_COLOR}\n";\
	grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' ${MAKEFILE_LIST} \
	| sed -n "s/^\(.*\): \(.*\)##\(.*\)/  $(shell printf "${COMMAND_COLOR}") \1$(shell printf "${NO_COLOR}")@\3/p" \
	| column -t -s'@';

# =====================================================================
#  Lifecycle
# =====================================================================
start: ## Start containers
	@$(COMPOSE) up -d
	@echo "Containers started"

stop: ## Stop containers
	@$(COMPOSE) stop
	@echo "Containers stopped"

up: ## Start all containers (build if images don't exist)
	@$(MAKE) _check-stale
	@uid=`id -u` gid=`id -g` $(COMPOSE) up --build --detach --remove-orphans
	@branch_or_tag=$$(git symbolic-ref -q --short HEAD || git describe --tags --exact-match 2>/dev/null || echo "unknown");\
	sha_id=$$(git rev-parse --short HEAD 2>/dev/null || echo "unknown");\
	echo "$$branch_or_tag - $$sha_id" > VERSION 2>/dev/null || true
	@echo "Containers started (backend :8000 · frontend :3000 · mongo :27017)"
	@echo "VERSION file updated"

up-latest: ## Rebuild images from scratch and start (no cache)
	@uid=`id -u` gid=`id -g` $(COMPOSE) build --no-cache
	@$(MAKE) _check-stale
	@uid=`id -u` gid=`id -g` $(COMPOSE) up --detach --remove-orphans
	@echo "Containers started with a fresh build"

PROJECT := $(notdir $(CURDIR))
_check-stale:
	@clash=0; \
	for c in $(DB) $(BACKEND) $(FRONTEND); do \
		owner=$$(docker inspect -f '{{ index .Config.Labels "com.docker.compose.project" }}' $$c 2>/dev/null) || continue; \
		if [ -n "$$owner" ] && [ "$$owner" != "$(PROJECT)" ]; then \
			clash=1; \
			id=$$(docker inspect -f '{{ slice .Id 0 12 }}' $$c 2>/dev/null); \
			status=$$(docker inspect -f '{{ .State.Status }}' $$c 2>/dev/null); \
			printf "$(TITLE_COLOR)⚠  Name '%s' is taken by another compose project$(NO_COLOR)\n" "$$c"; \
			printf "     container id : %s\n" "$$id"; \
			printf "     project      : %s (current: %s)\n" "$$owner" "$(PROJECT)"; \
			printf "     status       : %s\n" "$$status"; \
			printf "     free it with : $(COMMAND_COLOR)docker rm -f %s$(NO_COLOR)\n" "$$c"; \
		fi; \
	done; \
	if [ "$$clash" = "1" ]; then \
		printf "$(TITLE_COLOR)Fix all of the above at once:$(NO_COLOR) $(COMMAND_COLOR)make fix-stale$(NO_COLOR)\n"; \
		printf "$(TITLE_COLOR)Then re-run this target.$(NO_COLOR)\n"; \
		exit 1; \
	fi

fix-stale: ## Force-remove containers squatting our names from another compose project
	@removed=0; \
	for c in $(DB) $(BACKEND) $(FRONTEND); do \
		owner=$$(docker inspect -f '{{ index .Config.Labels "com.docker.compose.project" }}' $$c 2>/dev/null) || continue; \
		if [ -n "$$owner" ] && [ "$$owner" != "$(PROJECT)" ]; then \
			printf "Removing %s (owned by project '%s')... " "$$c" "$$owner"; \
			docker rm -f $$c >/dev/null 2>&1 && echo "done" || echo "failed"; \
			removed=1; \
		fi; \
	done; \
	if [ "$$removed" = "0" ]; then echo "No stale containers from other projects — nothing to do."; fi

down: ## Stop and remove containers
	@$(COMPOSE) down
	@echo "Containers stopped"

restart: ## Restart all containers
	@$(MAKE) down
	@$(MAKE) up

destroy: ## Stop containers and remove volumes (deletes the database)
	@$(COMPOSE) down -v --remove-orphans
	@echo "All containers and volumes removed (database wiped)"

build: ## Build Docker images
	@uid=`id -u` gid=`id -g` $(COMPOSE) build
	@echo "Images built"

build-prod: ## Build production images without cache
	@$(COMPOSE) -f docker-compose.yml build --no-cache
	@echo "Production images built"

config: ## Show merged docker-compose configuration
	@$(COMPOSE) config

# =====================================================================
#  Status & Logs
# =====================================================================
status: ## Show status of all containers
	@$(COMPOSE) ps

health: ## Check health/status of invoice services
	@echo "Checking service health..."
	@curl --fail --silent --show-error http://localhost:8000/health
	@echo
	@$(COMPOSE) ps

logs: ## Tail logs from all containers
	@$(COMPOSE) logs -f

logs-backend: ## Tail backend (Node/Express) logs
	@docker logs -f $(BACKEND)

logs-frontend: ## Tail frontend (nginx) logs
	@docker logs -f $(FRONTEND)

logs-db: ## Tail MongoDB logs
	@docker logs -f $(DB)

# =====================================================================
#  Shell access
# =====================================================================
sh-backend: ## Open a shell in the backend container
	@docker exec -it $(BACKEND) sh

sh-backend-root: ## Open a shell in the backend container as root
	@docker exec -it --user 0 $(BACKEND) sh

sh-frontend: ## Open a shell in the frontend (nginx) container
	@docker exec -it $(FRONTEND) sh

sh-db: ## Open a shell in the MongoDB container
	@docker exec -it $(DB) sh

mongo: ## Open a mongosh shell on the invoice database
	@docker exec -it $(DB) mongosh $(MONGO_DB)

# =====================================================================
#  Backend / Node tasks (run inside the live backend container)
# =====================================================================
container-install: ## Reinstall the unified root Node dependencies in backend container
	@docker exec -t --user 0 $(BACKEND) npm install
	@echo "Root dependencies installed in backend container"

setup: ## Seed initial admin + default settings (default login admin123)
	@docker exec -t $(BACKEND) npm run setup
	@echo "Database seeded"

reset: ## Wipe all collections (keeps the database, clears data)
	@docker exec -t $(BACKEND) npm run reset
	@echo "Collections reset"

upgrade: ## Run the backend upgrade/migration script
	@docker exec -t $(BACKEND) npm run upgrade
	@echo "Upgrade script finished"

# Generate a new Mongoose model on the HOST source tree (writes to ./backend).
# A throwaway node container mounts the repository root so no Node install is needed locally.
# MODEL (not NAME) is used on purpose — NAME is often already set in the shell env.
# Usage:
#   make make-model MODEL=Product
#   make make-model MODEL=Product FIELDS="name:string:required price:number:default=0" CONTROLLER=1
make-model: ## Generate a new model (usage: make make-model MODEL=Product FIELDS="name:string ...")
	@if [ -z "$(MODEL)" ]; then \
		echo "Usage: make make-model MODEL=Product FIELDS=\"name:string:required price:number\" [CONTROLLER=1]"; \
		exit 1; \
	fi
	@docker run --rm --user $$(id -u):$$(id -g) -v "$(PWD):/app" -w /app $(NODE_IMAGE) \
		node backend/src/cli/makeModel.js $(MODEL) $(FIELDS) $(if $(CONTROLLER),--controller,)
	@echo "Run 'make restart' (or rebuild) so the backend picks up the new model"

# =====================================================================
#  Local development (host, hot-reload — needs Node + MongoDB)
# =====================================================================
install: ## Install all Node dependencies on the host
	@npm install
	@echo "Dependencies installed"

test: ## Run the complete Node test suite
	@npm test

check: ## Run tests and production frontend build
	@npm test
	@npm run build
	@echo "Tests and frontend build passed"

mongo-up: ## Start only the MongoDB container (DB for host dev servers)
	@$(COMPOSE) up --detach mongo
	@echo "MongoDB running on :27017 (db 'invoice')"

dev: ## Run backend + frontend dev servers with hot reload (Ctrl+C stops both)
	@if [ ! -x node_modules/.bin/nodemon ] || [ ! -x node_modules/.bin/vite ]; then \
		echo "Dependencies missing — run 'make install' first."; exit 1; fi
	-@$(COMPOSE) stop backend frontend >/dev/null 2>&1 || true
	@$(COMPOSE) up --detach mongo
	@echo "🚀 Backend :8000 (nodemon) + Frontend :3000 (vite). Press Ctrl+C to stop both."
	@trap 'kill 0' INT TERM EXIT; \
		npm run dev:backend & \
		npm run dev:frontend & \
		wait

dev-backend: ## Run only the backend dev server (nodemon, :8000)
	@npm run dev:backend

dev-frontend: ## Run only the frontend dev server (vite, :3000)
	@$(COMPOSE) stop frontend >/dev/null 2>&1 || true
	@npm run dev:frontend

vite: dev-frontend ## Alias: run Vite development server

build-frontend: ## Build the frontend for production (npm run build → frontend/dist)
	@npm run build
	@echo "Frontend built → frontend/dist"

stop-dev: ## Stop host dev servers + the mongo-up container
	# Scoped to THIS project's path so other projects' nodemon/vite are never touched.
	# The [x] bracket stops pkill from matching its own command line.
	-@pkill -f "$(CURDIR)/node_modules.*[n]odemon" 2>/dev/null || true
	-@pkill -f "$(CURDIR)/node_modules.*[v]ite" 2>/dev/null || true
	@$(COMPOSE) stop mongo
	@echo "Dev servers and mongo stopped"

# =====================================================================
#  Frontend tasks
# =====================================================================
lint: ## Run frontend ESLint (in a throwaway node container)
	@docker run --rm --user $$(id -u):$$(id -g) -v "$(PWD):/app" -w /app $(NODE_IMAGE) \
		sh -c "npm ci --no-audit --no-fund && npm run lint"

rebuild-frontend: ## Rebuild and restart only the frontend container
	@uid=`id -u` gid=`id -g` $(COMPOSE) up --build --detach --force-recreate --no-deps frontend
	@echo "Frontend rebuilt"

rebuild-backend: ## Rebuild and restart only the backend container
	@uid=`id -u` gid=`id -g` $(COMPOSE) up --build --detach --force-recreate --no-deps backend
	@echo "Backend rebuilt"

restart-backend: ## Restart only backend without rebuilding its image
	@$(COMPOSE) restart backend

restart-frontend: ## Restart only frontend without rebuilding its image
	@$(COMPOSE) restart frontend

# =====================================================================
#  Database backup / restore
# =====================================================================
db-backup: ## Dump the MongoDB database to ./backups/<timestamp>.archive
	@mkdir -p $(BACKUP_DIR)
	@stamp=$$(date +%Y%m%d-%H%M%S);\
	docker exec $(DB) sh -c "mongodump --db $(MONGO_DB) --archive" > $(BACKUP_DIR)/$$stamp.archive;\
	echo "Backup written to $(BACKUP_DIR)/$$stamp.archive"

db-restore: ## Restore from an archive (usage: make db-restore FILE=backups/xxx.archive)
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make db-restore FILE=backups/<timestamp>.archive"; \
		exit 1; \
	fi
	@docker exec -i $(DB) sh -c "mongorestore --drop --archive" < $(FILE)
	@echo "Database restored from $(FILE)"

# =====================================================================
#  Cleanup
# =====================================================================
clean: ## Remove dangling Docker images and build cache
	@echo "Cleaning dangling images and build cache..."
	@docker image prune -f
	@docker builder prune -f
	@echo "Clean completed"

.PHONY: help up up-latest _check-stale fix-stale down restart destroy build build-prod config \
	status health logs logs-backend logs-frontend logs-db \
	sh-backend sh-backend-root sh-frontend sh-db mongo \
	container-install setup reset upgrade make-model \
	install test check mongo-up dev dev-backend dev-frontend vite build-frontend stop-dev \
	lint rebuild-frontend rebuild-backend restart-backend restart-frontend db-backup db-restore clean
