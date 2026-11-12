#!/bin/zsh
# Twice-daily insights pull (launchd job com.msp-instagram.insights-pull): read-only Instagram API calls into
# content/state.sqlite, so every post, Reel and live Story gets a snapshot without anyone asking. No Claude, no
# publishing. Log: var/scheduled/pull.log. Install or change it with tools/scheduled/schedule.sh.
REPO="${0:A:h:h:h}"
export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
cd "$REPO" || exit 1
mkdir -p var/scheduled
echo "== $(date '+%Y-%m-%d %H:%M') pull" >> var/scheduled/pull.log
node tools/insights.ts 2>&1 | grep -v "ExperimentalWarning\|trace-warnings" | sed -E 's/access_token=[^& ]+/access_token=<redacted>/g' >> var/scheduled/pull.log
