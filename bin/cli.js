#!/usr/bin/env node

import { readFileSync } from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

let commands;
try {
  commands = JSON.parse(readFileSync(join(__dirname, "..", "dist", "data", "commands.json"), "utf-8"));
} catch {
  commands = JSON.parse(readFileSync(join(__dirname, "..", "src", "data", "commands.json"), "utf-8"));
}

const args = process.argv.slice(2);

const FLAG_MAP = {
  "--ip": "{IP}",
  "--domain": "{DOMAIN}",
  "--interface": "{INTERFACE}",
  "--device": "{DEVICE}",
  "--volume": "{VOLUME}",
  "--drive": "{DRIVE}",
  "--process": "{PROCESS}",
  "--service": "{SERVICE}",
  "--pid": "{PID}",
  "--appname": "{APPNAME}",
  "--user": "{USERNAME}",
  "--password": "{PASSWORD}",
  "--path": "{PATH}",
  "--chain": "{CHAIN}",
  "--url": "{URL}",
  "--port": "{PORT}",
  "--protocol": "{PROTOCOL}",
  "--project": "{PROJECT_NAME}",
  "--token": "{NPMJS_TOKEN}",
};

const SHORTCUT_ALIASES = {
  "ping": "w7",
  "traceroute": "w8",
  "flush-dns": "w1",
  "reset-winsock": "w2",
  "release-ip": "w3",
  "renew-ip": "w4",
  "reset-firewall": "w5",
  "show-network": "w6",
  "sfc": "w9",
  "dism": "w10",
  "check-disk": "w11",
  "disk-cleanup": "w12",
  "sysinfo": "w13",
  "event-viewer": "w14",
  "tasklist": "w15",
  "kill": "w16",
  "services": "w17",
  "restart-service": "w18",
  "netstat": "w19",
  "check-updates": "w20",
  "reset-update": "w21",
  "update-history": "w22",
  "drivers": "w23",
  "scan-devices": "w24",
  "shutdown": "w25",
  "restart": "w26",
  "cancel-shutdown": "w27",
  "lping": "l6",
  "ltraceroute": "l7",
  "lflush-dns": "l1",
  "lnetwork": "l2",
  "ldhcp": "l3",
  "lip": "l4",
  "lrouting": "l5",
  "lports": "l8",
  "lfirewall": "l9",
  "dns": "l10",
  "lupdate": "l11",
  "lupdate-fedora": "l12",
  "lupdate-arch": "l13",
  "ldisk": "l14",
  "lmemory": "l15",
  "luname": "l16",
  "luptime": "l17",
  "lblk": "l18",
  "lps": "l19",
  "ltop": "l20",
  "lkill": "l21",
  "lservices": "l22",
  "lservice": "l23",
  "lfailed": "l24",
  "ljournal": "l25",
  "lsmart": "l26",
  "lfsck": "l27",
  "lmount": "l28",
  "lfind-large": "l29",
  "linode": "l30",
  "lusers": "l31",
  "lchown": "l32",
  "lsudo": "l33",
  "lunlock": "l34",
  "lshut": "l35",
  "lreboot": "l36",
  "lschedule-shut": "l37",
  "lcancel-shut": "l38",
  "lsyslog": "l39",
  "ldmesg": "l40",
  "lboot-log": "l41",
  "llshw": "l42",
  "curl": "s1",
  "whatweb": "s2",
  "nmap": "s3",
  "nmap-udp": "s4",
  "wpscan": "s5",
  "dirsearch": "s6",
  "nikto": "s7",
  "cewl": "s8",
  "create-vite": "sf1",
  "npm-install": "sf2",
  "dev": "sf3",
  "build": "sf4",
  "npm-init": "sf5",
  "npm-login": "sf6",
  "npm-token": "sf7",
  "npm-publish": "sf8",
  "npm-publish-public": "sf9",
};

const GROUP_ALIASES = {
  "troubleshoot linux": {
    name: "Linux Troubleshoot",
    ids: ["l4", "l6", "l8", "l10", "l14", "l15", "l16", "l19", "l24", "l39"],
  },
  "troubleshoot windows": {
    name: "Windows Troubleshoot",
    ids: ["w1", "w6", "w7", "w13", "w15", "w19"],
  },
  "troubleshoot": {
    name: "System Troubleshoot",
    ids: ["w1", "w6", "w7", "w13", "w15", "w19"],
  },
  "web enumerate": {
    name: "Web Enumeration",
    ids: ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"],
  },
  "web scan": {
    name: "Web Scanning",
    ids: ["s2", "s3", "s4", "s7"],
  },
  "service vite": {
    name: "Vite Full Setup",
    ids: ["sf1", "sf2", "sf3", "sf4"],
  },
  "service npm": {
    name: "NPM Publish Workflow",
    ids: ["sf5", "sf6", "sf7", "sf8", "sf9"],
  },
  "linux network": {
    name: "Linux Network",
    ids: ["l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8", "l9", "l10"],
  },
  "linux system": {
    name: "Linux System",
    ids: ["l11", "l12", "l13", "l14", "l15", "l16", "l17", "l18"],
  },
  "linux process": {
    name: "Linux Process & Services",
    ids: ["l19", "l20", "l21", "l22", "l23", "l24", "l25"],
  },
  "linux disk": {
    name: "Linux Disk & Filesystem",
    ids: ["l26", "l27", "l28", "l29", "l30"],
  },
  "linux user": {
    name: "Linux User & Permissions",
    ids: ["l31", "l32", "l33", "l34"],
  },
  "linux logs": {
    name: "Linux Logs & Diagnostics",
    ids: ["l39", "l40", "l41", "l42"],
  },
  "windows network": {
    name: "Windows Network",
    ids: ["w1", "w2", "w3", "w4", "w5", "w6", "w7", "w8"],
  },
  "windows system": {
    name: "Windows System",
    ids: ["w9", "w10", "w11", "w12", "w13", "w14"],
  },
  "windows process": {
    name: "Windows Process & Services",
    ids: ["w15", "w16", "w17", "w18", "w19"],
  },
  "windows update": {
    name: "Windows Update",
    ids: ["w20", "w21", "w22"],
  },
};

function printHelp() {
  console.log(`
  LokaIndex — Cross-platform toolkit for sysadmin and troubleshooting.

  USAGE
    loka <command>              Run a command by shortcut name
    loka <command> <value>      Run with custom value (e.g. IP, domain)
    loka <group>                Run a group of commands at once
    loka <id>                   Run by command ID (e.g. w7, l6)

  QUICK SHORTCUTS
    loka ping 192.168.1.1       Ping an IP address
    loka flush-dns              Flush DNS cache
    loka traceroute google.com  Trace route to domain
    loka tasklist               List running processes
    loka nmap 192.168.1.1       Nmap TCP scan
    loka dev                    Start Vite dev server
    loka build                  Build for production

  GROUPS (run multiple commands)
    loka troubleshoot linux     All linux diagnostic commands
    loka troubleshoot windows   All windows diagnostic commands
    loka web enumerate host.com Run all web enumeration tools
    loka web scan host.com      Run web scanning tools
    loka service vite my-app    Full Vite project setup
    loka service npm            NPM publish workflow
    loka linux network          All linux network commands
    loka windows network        All windows network commands

  OPTIONS
    -h, --help       Show help
    -l, --list       List all commands
    --os <os>        Filter: windows, linux, website, software
    --category <cat> Filter by category
    --search <query> Search commands
    --copy           Copy command to clipboard instead of running

  PLACEHOLDER FLAGS
    --ip <ip>            IP address        --domain <domain>    Domain name
    --url <url>          Full URL          --port <port>        Port number
    --user <user>        Username          --service <name>     Service name
    --process <name>     Process name      --project <name>     Project name
    --device <dev>       Block device      --drive <drive>      Drive letter

  EXAMPLES
    loka w7 --ip 10.0.0.1         Ping custom IP
    loka l23 --service sshd       Restart sshd service
    loka sf1 --project my-app     Create Vite project
    loka --search dns             Search for DNS commands
    loka --list --os linux        List all linux commands
    loka --copy w7                Copy command to clipboard
`);
}

function getFilteredCommands(osFilter, categoryFilter, searchQuery) {
  const osList = osFilter ? [osFilter] : Object.keys(commands);
  let allCmds = [];

  for (const os of osList) {
    if (!commands[os]) continue;
    for (const cat of commands[os]) {
      if (categoryFilter && cat.category.toLowerCase() !== categoryFilter.toLowerCase()) continue;
      let cmds = cat.commands;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        cmds = cmds.filter((c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.command.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      }
      allCmds.push(...cmds.map((c) => ({ os, category: cat.category, ...c })));
    }
  }
  return allCmds;
}

function printResults(results) {
  if (results.length === 0) return;

  const maxNo = Math.max(...results.map((r) => r.id.length), 2);
  const maxName = Math.max(...results.map((r) => r.name.length), 4);
  const maxCmd = Math.max(...results.map((r) => r.command.length), 7);

  let currentOs = null;
  for (const r of results) {
    if (r.os !== currentOs) {
      console.log(`\n  ${r.os.toUpperCase()}`);
      console.log(`    ${"no".padEnd(maxNo)}  ${"name".padEnd(maxName)}  ${"command".padEnd(maxCmd)}  description`);
      console.log(`    ${"-".repeat(maxNo)}  ${"-".repeat(maxName)}  ${"-".repeat(maxCmd)}  -----------`);
      currentOs = r.os;
    }
    console.log(`    ${r.id.padEnd(maxNo)}  ${r.name.padEnd(maxName)}  ${r.command.padEnd(maxCmd)}  ${r.description}`);
  }
  console.log(`\n  Found: ${results.length} command(s)`);
}

function findById(id) {
  const q = id.toLowerCase();
  for (const [os, categories] of Object.entries(commands)) {
    for (const cat of categories) {
      for (const cmd of cat.commands) {
        if (cmd.id.toLowerCase() === q) return { os, category: cat.category, ...cmd };
      }
    }
  }
  return null;
}

function parsePlaceholderFlags(args) {
  const values = {};
  for (const [flag, placeholder] of Object.entries(FLAG_MAP)) {
    const idx = args.indexOf(flag);
    if (idx !== -1 && args[idx + 1]) {
      values[placeholder] = args[idx + 1];
    }
  }
  return values;
}

function resolveShortcut(args) {
  const skipFlags = new Set(["--copy"]);
  let idx = 0;
  while (idx < args.length && skipFlags.has(args[idx])) idx++;
  if (idx >= args.length) return null;

  const name = args[idx].toLowerCase();
  if (name.startsWith("-")) return null;

  const cmdId = SHORTCUT_ALIASES[name];
  if (!cmdId) return null;

  const cmd = findById(cmdId);
  if (!cmd) return null;

  const inlineArgs = args.slice(idx + 1).filter(a => !skipFlags.has(a));
  const placeholders = [];
  const phRegex = /\{(\w+)\}/g;
  let m;
  while ((m = phRegex.exec(cmd.command)) !== null) {
    placeholders.push(m[1]);
  }

  const flagValues = {};
  if (placeholders.length === 1 && inlineArgs.length === 1) {
    flagValues[`{${placeholders[0]}}`] = inlineArgs[0];
  } else if (placeholders.length > 1 && inlineArgs.length > 0) {
    for (let i = 0; i < Math.min(inlineArgs.length, placeholders.length); i++) {
      flagValues[`{${placeholders[i]}}`] = inlineArgs[i];
    }
  }

  return { cmd, flagValues };
}

function resolveGroup(args) {
  const skipFlags = new Set(["--copy"]);
  let idx = 0;
  while (idx < args.length && skipFlags.has(args[idx])) idx++;
  if (idx >= args.length) return null;

  const lowerArgs = args.slice(idx).map(a => a.toLowerCase());

  let bestMatch = null;
  let bestLen = 0;
  for (const key of Object.keys(GROUP_ALIASES)) {
    const keyParts = key.split(" ");
    if (lowerArgs.length >= keyParts.length) {
      const candidate = lowerArgs.slice(0, keyParts.length).join(" ");
      if (candidate === key && keyParts.length > bestLen) {
        bestMatch = key;
        bestLen = keyParts.length;
      }
    }
  }

  if (!bestMatch) return null;

  const group = GROUP_ALIASES[bestMatch];
  const remainingArgs = args.slice(idx + bestLen).filter(a => !skipFlags.has(a));
  const inlineArg = remainingArgs.length > 0 ? remainingArgs[0] : null;

  return { group, inlineArg };
}

function executeGroup(group, inlineArg, shouldCopy) {
  console.log(`\n  === ${group.name} (${group.ids.length} commands) ===\n`);

  for (const cmdId of group.ids) {
    const cmd = findById(cmdId);
    if (!cmd) continue;

    const placeholders = [];
    const phRegex = /\{(\w+)\}/g;
    let m;
    while ((m = phRegex.exec(cmd.command)) !== null) {
      placeholders.push(m[1]);
    }

    const flagValues = {};
    if (inlineArg && placeholders.length > 0) {
      flagValues[`{${placeholders[0]}}`] = inlineArg;
    }

    const finalCmd = prepareCommand(cmd, cmd.os, flagValues);
    console.log(`  [${cmd.id}] ${cmd.name}: ${finalCmd}`);

    if (shouldCopy) {
      copyToClipboard(finalCmd);
    } else {
      try { execSync(finalCmd, { stdio: "inherit", shell: true }); } catch {}
    }
    console.log("");
  }

  console.log(`  === Done: ${group.name} ===\n`);
}

function replacePlaceholders(command, defaultCmd, flagValues) {
  let result = command;
  let hasUnresolved = false;

  for (const [placeholder, value] of Object.entries(flagValues)) {
    result = result.replaceAll(placeholder, value);
  }

  for (const placeholder of Object.values(FLAG_MAP)) {
    if (result.includes(placeholder)) {
      hasUnresolved = true;
      break;
    }
  }

  if (hasUnresolved && defaultCmd) {
    return defaultCmd;
  }

  return result;
}

function prepareCommand(cmd, os, flagValues) {
  const base = cmd.command;
  const defaultCmd = cmd.default || null;
  let final = replacePlaceholders(base, defaultCmd, flagValues);

  if ((os === "linux") && !final.startsWith("sudo ")) {
    return `sudo ${final}`;
  }
  return final;
}

function copyToClipboard(text) {
  try {
    const platform = process.platform;
    if (platform === "darwin") execSync("pbcopy", { input: text });
    else if (platform === "linux") {
      try { execSync("xclip -selection clipboard", { input: text }); }
      catch { execSync("xsel --clipboard --input", { input: text }); }
    }
    else if (platform === "win32") execSync("clip", { input: text });
    return true;
  } catch {
    return false;
  }
}

function handleResult(cmd, shouldCopy, flagValues) {
  const finalCmd = prepareCommand(cmd, cmd.os, flagValues);
  if (shouldCopy) {
    const copied = copyToClipboard(finalCmd);
    console.log(copied ? "  Command copied to clipboard!" : "  Failed to copy. Install xclip/xsel/pbcopy.");
  } else {
    console.log(`\n  Executing: $ ${finalCmd}\n`);
    try { execSync(finalCmd, { stdio: "inherit", shell: true }); } catch {}
  }
}

function main() {
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    printHelp();
    return;
  }

  const group = resolveGroup(args);
  if (group) {
    const shouldCopy = args.includes("--copy");
    executeGroup(group.group, group.inlineArg, shouldCopy);
    return;
  }

  const shortcut = resolveShortcut(args);
  if (shortcut) {
    const { cmd, flagValues } = shortcut;
    const shouldCopy = args.includes("--copy");
    if (shouldCopy) {
      const finalCmd = prepareCommand(cmd, cmd.os, flagValues);
      const copied = copyToClipboard(finalCmd);
      console.log(copied ? "  Command copied to clipboard!" : "  Failed to copy. Install xclip/xsel/pbcopy.");
    } else {
      handleResult(cmd, false, flagValues);
    }
    return;
  }

  const osFlag = args.indexOf("--os");
  const catFlag = args.indexOf("--category");
  const searchFlag = args.indexOf("--search");
  const shouldCopy = args.includes("--copy");

  const osFilter = osFlag !== -1 ? args[osFlag + 1]?.toLowerCase() : null;
  const categoryFilter = catFlag !== -1 ? args[catFlag + 1] : null;
  const searchQuery = searchFlag !== -1 ? args[searchFlag + 1] : null;

  const flagValues = parsePlaceholderFlags(args);

  const skipArgs = new Set([
    "--os", "--category", "--search", "--copy",
    ...Object.keys(FLAG_MAP),
  ]);

  const skipIndices = new Set();
  for (let i = 0; i < args.length; i++) {
    if (skipArgs.has(args[i])) {
      skipIndices.add(i);
      if (i + 1 < args.length && args[i + 1] && !args[i + 1].startsWith("-")) {
        skipIndices.add(i + 1);
      }
    }
    if (osFlag !== -1 && i === osFlag + 1) skipIndices.add(i);
    if (catFlag !== -1 && i === catFlag + 1) skipIndices.add(i);
    if (searchFlag !== -1 && i === searchFlag + 1) skipIndices.add(i);
  }

  let filteredArgs = args.filter((_, i) => !skipIndices.has(i));

  const isList = filteredArgs.includes("--list") || filteredArgs.includes("-l");
  const query = filteredArgs.join(" ");

  if (isList) {
    printResults(getFilteredCommands(osFilter, categoryFilter, searchQuery));
    return;
  }

  if (!query && !searchQuery && !categoryFilter) {
    printHelp();
    return;
  }

  // Try find by ID first
  if (query && !searchQuery && !categoryFilter) {
    const byId = findById(query);
    if (byId) {
      if (osFilter && byId.os !== osFilter) {
        console.log(`\n  Command "${query}" is for ${byId.os}, not ${osFilter}`);
        return;
      }
      printResults([byId]);
      handleResult(byId, shouldCopy, flagValues);
      return;
    }
  }

  const results = getFilteredCommands(osFilter, categoryFilter, searchQuery || query);
  if (results.length === 0) {
    console.log(`\n  No commands found matching "${searchQuery || query}"`);
    console.log("  Try: loka --list to see all available commands\n");
    return;
  }

  printResults(results);
  if (shouldCopy || results.length === 1) {
    handleResult(results[0], shouldCopy, flagValues);
  }
}

main();
