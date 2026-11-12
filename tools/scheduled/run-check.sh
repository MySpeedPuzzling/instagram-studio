#!/bin/zsh
# One unattended insights check (launchd job com.msp-instagram.check-<name>): runs Claude Code headless on the prompt
# in var/scheduled/prompt-<name>.txt with a narrow tool allowlist (read files, pull insights, list comments, edit docs,
# git add/commit; it cannot publish, reply, push or run anything else), shows a macOS notification, then removes its
# own launchd job. Log: var/scheduled/check-<name>.log. Scheduled with tools/scheduled/schedule.sh.
N="$1"; REPO="${0:A:h:h:h}"; DIR="$REPO/var/scheduled"
export PATH=/opt/homebrew/bin:/usr/local/bin:$HOME/.local/bin:/usr/bin:/bin:/usr/sbin:/sbin
cd "$REPO" || exit 1
LOG="$DIR/check-$N.log"
[ -f "$DIR/prompt-$N.txt" ] || { echo "no prompt for $N" >> "$LOG"; exit 1; }
echo "== $(date) start check $N" >> "$LOG"
claude -p "$(cat "$DIR/prompt-$N.txt")" --allowedTools "Read" "Glob" "Grep" "Edit" "Write" "Bash(node tools/insights.ts:*)" "Bash(node tools/comments.ts:*)" "Bash(git add:*)" "Bash(git commit:*)" "Bash(git status:*)" "Bash(git diff:*)" "Bash(date:*)" >> "$LOG" 2>&1
RC=$?
echo "== $(date) end check $N (exit $RC)" >> "$LOG"
osascript -e "display notification \"Check $N finished (exit $RC). Reports are in content/reports/\" with title \"MSP Instagram insights\"" 2>/dev/null
rm -f "$HOME/Library/LaunchAgents/com.msp-instagram.check-$N.plist"
launchctl bootout "gui/$(id -u)/com.msp-instagram.check-$N" 2>/dev/null
