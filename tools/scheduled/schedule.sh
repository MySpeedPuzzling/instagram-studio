#!/bin/zsh
# Background jobs of this repo (macOS launchd, user agents; they run without an open Claude session, and a job missed
# while the Mac slept runs on wake):
#   tools/scheduled/schedule.sh pull                                  # install the twice-daily insights pull (08:10, 20:10)
#   tools/scheduled/schedule.sh check <name> <month> <day> <hour> <minute>   # one unattended Claude check, prompt in var/scheduled/prompt-<name>.txt
#   tools/scheduled/schedule.sh reviews                               # install the weekly (Mon 07:20) and monthly (1st, 07:40) Claude reviews
#   tools/scheduled/schedule.sh list                                  # what is installed
#   tools/scheduled/schedule.sh remove <label-suffix>                 # e.g. remove insights-pull, remove check-reel48
REPO="${0:A:h:h:h}"; LA="$HOME/Library/LaunchAgents"; U="gui/$(id -u)"
plist() { # label, program args (xml), calendar (xml)
  cat > "$LA/com.msp-instagram.$1.plist" <<P
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.msp-instagram.$1</string>
  <key>ProgramArguments</key><array>$2</array>
  <key>StartCalendarInterval</key>$3
  <key>StandardOutPath</key><string>$REPO/var/scheduled/launchd.log</string>
  <key>StandardErrorPath</key><string>$REPO/var/scheduled/launchd.log</string>
</dict></plist>
P
  launchctl bootout "$U/com.msp-instagram.$1" 2>/dev/null
  launchctl bootstrap "$U" "$LA/com.msp-instagram.$1.plist" && echo "installed com.msp-instagram.$1"
}
mkdir -p "$REPO/var/scheduled"
case "$1" in
  pull) plist insights-pull "<string>$REPO/tools/scheduled/pull.sh</string>" "<array><dict><key>Hour</key><integer>8</integer><key>Minute</key><integer>10</integer></dict><dict><key>Hour</key><integer>20</integer><key>Minute</key><integer>10</integer></dict></array>" ;;
  check) [ -f "$REPO/var/scheduled/prompt-$2.txt" ] || { echo "write var/scheduled/prompt-$2.txt first"; exit 2; }
    plist "check-$2" "<string>$REPO/tools/scheduled/run-check.sh</string><string>$2</string>" "<dict><key>Month</key><integer>$3</integer><key>Day</key><integer>$4</integer><key>Hour</key><integer>$5</integer><key>Minute</key><integer>$6</integer></dict>" ;;
  reviews) plist weekly-review "<string>$REPO/tools/scheduled/run-check.sh</string><string>weekly</string><string>keep</string>" "<dict><key>Weekday</key><integer>1</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>20</integer></dict>"
    plist monthly-review "<string>$REPO/tools/scheduled/run-check.sh</string><string>monthly</string><string>keep</string>" "<dict><key>Day</key><integer>1</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>40</integer></dict>" ;;
  list) launchctl list | grep msp-instagram; ls "$LA" | grep msp-instagram ;;
  remove) launchctl bootout "$U/com.msp-instagram.$2" 2>/dev/null; rm -f "$LA/com.msp-instagram.$2.plist"; echo "removed com.msp-instagram.$2" ;;
  *) sed -n 2,9p "$0" ;;
esac
