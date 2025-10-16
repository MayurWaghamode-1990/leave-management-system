#!/bin/bash

# Team Sync Script for Leave Management System
# Run this at the start of your day and before creating PRs

set -e  # Exit on error

echo "🔄 Syncing with team's latest changes..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Show current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}📍 Current branch: ${CURRENT_BRANCH}${NC}"
echo ""

# 2. Fetch latest from remote
echo "📥 Fetching latest changes from GitHub..."
git fetch origin
echo ""

# 3. Check if develop exists locally
if git show-ref --verify --quiet refs/heads/develop; then
    echo "✅ Develop branch exists locally"
else
    echo "⚠️  Creating develop branch from main..."
    git checkout -b develop origin/main
    git push origin develop
fi

# 4. Update develop branch
echo "🔄 Updating develop branch..."
git checkout develop
git pull origin develop
echo ""

# 5. Show what teammates are working on
echo "👥 Active branches from teammates:"
git branch -r | grep -v HEAD | grep -v main | grep -v develop | head -10
echo ""

echo "📋 Open Pull Requests:"
if command -v gh &> /dev/null; then
    gh pr list --limit 5
else
    echo "   (Install 'gh' CLI to see PRs: https://cli.github.com/)"
fi
echo ""

# 6. Check if we're on a feature branch
if [ "$CURRENT_BRANCH" != "develop" ] && [ "$CURRENT_BRANCH" != "main" ]; then
    echo "🔀 You're on feature branch: ${CURRENT_BRANCH}"
    read -p "   Merge latest develop into your branch? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout "$CURRENT_BRANCH"
        echo "🔀 Merging develop into ${CURRENT_BRANCH}..."
        if git merge develop; then
            echo -e "${GREEN}✅ Merge successful!${NC}"
        else
            echo -e "${RED}⚠️  Merge conflicts detected!${NC}"
            echo "   Resolve conflicts, then run:"
            echo "   git add ."
            echo "   git commit -m 'merge: Resolve conflicts with develop'"
            exit 1
        fi
    fi
else
    echo -e "${GREEN}✅ On develop branch, ready to create new feature branch!${NC}"
    echo ""
    echo "To start new feature:"
    echo "  git checkout -b feature/your-feature-name"
fi

echo ""
echo -e "${GREEN}🎉 Sync complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Start/continue working on your feature"
echo "  2. Commit and push changes regularly"
echo "  3. Create PR when ready: gh pr create --base develop"
