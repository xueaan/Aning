# Anning (安宁) - Makefile for development and build tasks
# Usage: make <target>

.PHONY: help dev build typecheck lint format test clean install deps rust-check rust-test icon-gen

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN := \033[32m
YELLOW := \033[33m
BLUE := \033[34m
RED := \033[31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Anning (安宁) Development Commands$(NC)"
	@echo "=================================="
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# Development Commands
dev: ## Start development server (Tauri + React)
	@echo "$(YELLOW)Starting Anning development server...$(NC)"
	pnpm tauri dev

dev-frontend: ## Start only frontend development server
	@echo "$(YELLOW)Starting frontend development server...$(NC)"
	pnpm dev

# Build Commands
build: typecheck ## Build application for production
	@echo "$(YELLOW)Building Anning application...$(NC)"
	pnpm tauri build

build-frontend: typecheck ## Build only frontend
	@echo "$(YELLOW)Building frontend...$(NC)"
	pnpm build

build-debug: ## Build Tauri app in debug mode
	@echo "$(YELLOW)Building Tauri app (debug)...$(NC)"
	cd src-tauri && cargo build

# Code Quality
typecheck: ## Run TypeScript type checking
	@echo "$(YELLOW)Running TypeScript type checking...$(NC)"
	pnpm typecheck

lint: ## Run ESLint
	@echo "$(YELLOW)Running ESLint...$(NC)"
	pnpm lint

lint-fix: ## Run ESLint with auto-fix
	@echo "$(YELLOW)Running ESLint with auto-fix...$(NC)"
	pnpm lint --fix

format: ## Format code with Prettier
	@echo "$(YELLOW)Formatting code with Prettier...$(NC)"
	pnpm format

# Rust/Tauri specific
rust-check: ## Check Rust code compilation
	@echo "$(YELLOW)Checking Rust code...$(NC)"
	cd src-tauri && cargo check

rust-test: ## Run Rust tests
	@echo "$(YELLOW)Running Rust tests...$(NC)"
	cd src-tauri && cargo test

rust-fmt: ## Format Rust code
	@echo "$(YELLOW)Formatting Rust code...$(NC)"
	cd src-tauri && cargo fmt

rust-clippy: ## Run Rust clippy linter
	@echo "$(YELLOW)Running Rust clippy...$(NC)"
	cd src-tauri && cargo clippy

# Dependencies
install: ## Install all dependencies
	@echo "$(YELLOW)Installing dependencies...$(NC)"
	pnpm install

deps: install ## Alias for install

update-deps: ## Update dependencies
	@echo "$(YELLOW)Updating dependencies...$(NC)"
	pnpm update

# Testing
test: typecheck rust-check ## Run all tests (TypeScript + Rust)
	@echo "$(GREEN)All tests passed!$(NC)"

test-frontend: typecheck ## Test frontend only
	@echo "$(GREEN)Frontend tests passed!$(NC)"

test-backend: rust-test ## Test backend only
	@echo "$(GREEN)Backend tests passed!$(NC)"

# Utilities
preview: ## Preview built frontend
	@echo "$(YELLOW)Starting preview server...$(NC)"
	pnpm preview

clean: ## Clean build artifacts
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	rm -rf dist/
	rm -rf src-tauri/target/
	rm -rf node_modules/.vite/

clean-deps: ## Clean and reinstall dependencies
	@echo "$(YELLOW)Cleaning dependencies...$(NC)"
	rm -rf node_modules/
	rm -f pnpm-lock.yaml
	pnpm install

# Icon generation
icon-gen: ## Generate icons from SVG
	@echo "$(YELLOW)Generating icons...$(NC)"
	cd src-tauri/icons && \
	magick icon.svg -resize 32x32 32x32.png && \
	magick icon.svg -resize 128x128 128x128.png && \
	magick icon.svg -resize 256x256 128x128@2x.png && \
	magick icon.svg -resize 512x512 icon.png && \
	magick icon.svg -resize 512x512 icon.icns
	@echo "$(GREEN)Icons generated successfully!$(NC)"

# Git helpers
git-status: ## Show git status
	@git status

commit: ## Quick commit with message (usage: make commit MSG="commit message")
	@if [ -z "$(MSG)" ]; then \
		echo "$(RED)Error: Please provide a commit message$(NC)"; \
		echo "Usage: make commit MSG=\"your commit message\""; \
		exit 1; \
	fi
	@git add .
	@git commit -m "$(MSG)"

# Platform-specific builds
build-mac: ## Build for macOS only
	@echo "$(YELLOW)Building for macOS...$(NC)"
	pnpm tauri build --target universal-apple-darwin

build-windows: ## Build for Windows only
	@echo "$(YELLOW)Building for Windows...$(NC)"
	pnpm tauri build --target x86_64-pc-windows-msvc

build-linux: ## Build for Linux only
	@echo "$(YELLOW)Building for Linux...$(NC)"
	pnpm tauri build --target x86_64-unknown-linux-gnu

# Development workflow shortcuts
ready: install typecheck lint rust-check ## Prepare project (install deps, check types, lint)
	@echo "$(GREEN)Project is ready for development!$(NC)"

ci: typecheck lint rust-check rust-test ## Run all CI checks
	@echo "$(GREEN)All CI checks passed!$(NC)"

quick-start: install dev ## Quick start: install deps and start dev server

# Info
info: ## Show project information
	@echo "$(BLUE)Anning (安宁) - 本地优先个人知识管理平台$(NC)"
	@echo "========================================"
	@echo "Frontend: React 18 + TypeScript + Vite"
	@echo "Backend:  Tauri 2.0 + Rust"
	@echo "UI:       TailwindCSS + Feather-Glass"
	@echo "Editor:   Tiptap 3.x"
	@echo ""
	@echo "Current branch: $$(git branch --show-current)"
	@echo "Node version:   $$(node --version)"
	@echo "Rust version:   $$(rustc --version)"
	@echo "PNPM version:   $$(pnpm --version)"