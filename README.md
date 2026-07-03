# LokaIndex

Quick commands for IT troubleshooting, networking, web development, and security.

Available as a **web app** and **CLI tool**.

## Install

```bash
npm i -g @indah_sekar/loka
```

## Quick Start

```bash
loka ping 192.168.1.1       # Ping an IP
loka flush-dns              # Flush DNS cache
loka troubleshoot windows   # Run all windows diagnostics
loka web enumerate host.com # Run web enumeration tools
```

Run `loka` without arguments to see all available shortcuts and groups.

## How It Works

### Shortcuts

Run commands by friendly name instead of IDs:

```bash
loka ping 192.168.1.1
loka flush-dns
loka traceroute google.com
loka tasklist
loka nmap 192.168.1.1
loka dev
loka build
```

### Command IDs

Every command has a short ID. Use it to run directly:

```bash
loka w7          # ping (Windows)
loka l6          # ping (Linux)
loka sf1         # create Vite project
```

| OS       | Prefix | Example  |
| -------- | ------ | -------- |
| Windows  | `w`    | `w1`-`w27` |
| Linux    | `l`    | `l1`-`l42` |
| Website  | `s`    | `s1`-`s8`  |
| Software | `sf`   | `sf1`-`sf9` |

### Groups

Run multiple commands at once:

```bash
loka troubleshoot linux       # Linux diagnostics
loka troubleshoot windows     # Windows diagnostics
loka web enumerate host.com   # All web enumeration tools
loka web scan host.com        # Web scanning tools
loka service vite my-app      # Full Vite setup
loka service npm              # NPM publish workflow
loka linux network            # All linux network commands
loka windows network          # All windows network commands
```

### Placeholder Flags

Commands with `{PLACEHOLDER}` values use defaults. Override them with flags:

```bash
loka w7                              # ping 8.8.8.8 (default)
loka w7 --ip 192.168.1.1             # ping 192.168.1.1
loka l23 --service sshd              # sudo systemctl restart sshd
loka sf1 --project my-app            # npm create vite@latest my-app
loka s7 --ip 10.0.0.1 --port 443     # nikto with custom IP and port
```

Common flags:

| Flag | Description | Example |
| ---- | ----------- | ------- |
| `--ip` | IP address | `--ip 192.168.1.1` |
| `--domain` | Domain name | `--domain github.com` |
| `--url` | Full URL | `--url https://target.com` |
| `--port` | Port number | `--port 443` |
| `--service` | Service name | `--service nginx` |
| `--project` | Project name | `--project my-app` |
| `--user` | Username | `--user admin` |
| `--process` | Process name | `--process chrome` |

Run `loka --help` to see all available flags.

## Listing Commands

```bash
loka --list                          # All commands
loka --list --os linux               # Linux only
loka --list --os windows             # Windows only
loka --list --category Network       # By category
loka --search ping                   # Search by keyword
```

## Copy to Clipboard

```bash
loka --copy w7                       # Copy command text instead of running
loka --copy ping 192.168.1.1         # Copy shortcut command
```

## Web App

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Features

- Shortcuts — run commands by friendly name
- Groups — run multiple commands at once
- Default values — commands work out of the box
- Placeholder flags — customize commands with `--ip`, `--service`, etc.
- Clipboard copy — copy commands with `--copy`
- Search — find commands by keyword
- Web app — visual interface with terminal output

## License

MIT
