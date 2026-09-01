#!/bin/bash
set -euo pipefail

# Installs the ScrapeGraphAI toolchain for Claude Code on the web sessions.
# Local sessions are left untouched — run `pip install -r requirements.txt`
# and `playwright install chromium` yourself when working locally.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

python3 -m pip install --quiet -r "$CLAUDE_PROJECT_DIR/requirements.txt"

# The remote container ships Chromium under $PLAYWRIGHT_BROWSERS_PATH, but its
# revision (and directory layout) may lag behind what the pip playwright
# package expects, and the egress proxy blocks browser downloads. Bridge the
# expected revision directories to the pre-installed executables so plain
# chromium.launch() works. Chromium resolves resources via /proc/self/exe,
# so a symlinked executable finds its .pak files next to the real binary.
python3 - <<'PY'
import json
import os
import pathlib
import sys

import playwright

root = pathlib.Path(os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "/opt/pw-browsers"))
if not root.is_dir():
    sys.exit(0)

# dir prefix in the browsers path, executable path playwright expects
# (linux-x64), and executable names older pre-installed revisions may use.
LAYOUT = {
    "chromium": ("chromium", ("chrome-linux64", "chrome"), ("chrome",)),
    "chromium-headless-shell": (
        "chromium_headless_shell",
        ("chrome-headless-shell-linux64", "chrome-headless-shell"),
        ("chrome-headless-shell", "headless_shell"),
    ),
}

spec_path = pathlib.Path(playwright.__file__).parent / "driver" / "package" / "browsers.json"
spec = json.loads(spec_path.read_text())
for browser in spec["browsers"]:
    layout = LAYOUT.get(browser["name"])
    if layout is None:
        continue
    prefix, exe_rel, exe_names = layout
    expected_root = root / f"{prefix}-{browser['revision']}"
    exe = expected_root.joinpath(*exe_rel)
    if exe.exists():
        continue
    if expected_root.is_symlink():
        expected_root.unlink()
    for installed in sorted(root.glob(f"{prefix}-*"), reverse=True):
        if installed == expected_root or installed.is_symlink() or not installed.is_dir():
            continue
        hits = [
            h
            for name in exe_names
            for h in installed.rglob(name)
            if h.is_file() and os.access(h, os.X_OK)
        ]
        if hits:
            exe.parent.mkdir(parents=True, exist_ok=True)
            exe.symlink_to(hits[0])
            (expected_root / "INSTALLATION_COMPLETE").touch()
            (expected_root / "DEPENDENCIES_VALIDATED").touch()
            print(f"linked {exe} -> {hits[0]}")
            break
PY

# Verify the browser actually launches; fall back to a download if it doesn't.
if ! python3 -c "
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    p.chromium.launch(headless=True).close()
"; then
  python3 -m playwright install chromium
fi
