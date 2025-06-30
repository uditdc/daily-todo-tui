# Publishing Guide

This document explains how to publish the `daily-todo-tui` package to npm using the automated GitHub workflow.

## Prerequisites

1. **NPM Token**: You need to add an `NPM_TOKEN` secret to your GitHub repository
   - Go to [npmjs.com](https://www.npmjs.com) and create an account
   - Generate an automation token in your npm account settings
   - Add it as a secret named `NPM_TOKEN` in your GitHub repository settings

2. **Repository Setup**: Ensure your repository is properly configured on GitHub

## Publishing Methods

### 1. Automatic Publishing via Git Tags

The recommended way to publish is by creating version tags:

```bash
# Update version in package.json (optional - workflow can do this)
npm version patch   # or minor, major

# Create and push a version tag
git tag v1.0.1
git push origin v1.0.1
```

This will:
- Run tests on Node.js 16.x, 18.x, and 20.x
- Build the package
- Publish to npm with public access
- Create a GitHub release with installation instructions

### 2. Manual Publishing via GitHub Actions

You can also trigger publishing manually:

1. Go to GitHub Actions in your repository
2. Select the "Build and Publish to NPM" workflow
3. Click "Run workflow"
4. Optionally specify a version number

## Package Details

- **Package Name**: `daily-todo-tui`
- **Global Commands**: `daily-todo` and `todo-tui`
- **Installation**: `npm install -g daily-todo-tui`

## Workflow Features

### Testing
- Runs on multiple Node.js versions (16.x, 18.x, 20.x)
- Performs TypeScript type checking
- Builds and verifies the package structure
- Tests CLI functionality

### Publishing
- Only publishes on version tags (format: `v*`)
- Automatically updates package.json version from tag
- Creates GitHub releases with installation instructions
- Publishes with public access (no scoped package required)

### Security
- Uses npm automation tokens
- Runs in isolated GitHub Actions environment
- Only triggers on explicit version tags or manual dispatch

## Files Included in Package

The published package includes:
- `dist/` - Compiled JavaScript and TypeScript declarations
- `README.md` - User documentation
- `CLAUDE.md` - Development documentation
- `package.json` - Package metadata

Files excluded via `.npmignore`:
- Source TypeScript files (`src/`)
- Development configuration
- GitHub workflows
- Node modules and lock files

## Local Testing

Before publishing, you can test the package locally:

```bash
# Build the package
npm run build

# Test type checking
npm test

# Simulate packaging
npm pack --dry-run

# Test the CLI
node dist/index.js --help
```

## Version Management

Follow semantic versioning:
- **Patch** (1.0.1): Bug fixes, small improvements
- **Minor** (1.1.0): New features, backward compatible
- **Major** (2.0.0): Breaking changes

The workflow will automatically use the version from the git tag, so ensure your tags follow the `v{major}.{minor}.{patch}` format.