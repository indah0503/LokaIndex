# OS Troubleshooter - Architecture

## Project Structure

```mermaid
flowchart TD
    subgraph Root["Root Directory"]
        PKG["package.json"]
        HTML["index.html"]
        VITE["vite.config.js"]
        SERVER["server.js"]
    end

    subgraph BIN["bin/"]
        CLI["cli.js<br/>(CLI Entry Point)"]
    end

    subgraph SRC["src/"]
        MAIN["main.jsx"]
        APP["App.jsx"]
        CSS["App.css"]
        ERR["ErrorBoundary.jsx"]

        subgraph DATA["data/"]
            CMDJSON["commands.json"]
            CMDJS["commands.js"]
        end
    end

    subgraph PUBLIC["public/"]
        FAV["favicon.svg"]
        ICONS["icons.svg"]
    end

    subgraph DIST["dist/ (Build Output)"]
        DHTML["index.html"]
        DJS["assets/index-*.js"]
        DCSS["assets/index-*.css"]
        DDATA["data/commands.json"]
    end

    PKG -->|"bin: os-t"| CLI
    PKG -->|"exports"| CMDJSON
    HTML --> MAIN
    MAIN --> APP
    MAIN --> ERR
    APP --> CSS
    APP --> CMDJS

    VITE -->|"build"| DIST
    VITE -->|"dev server"| APP

    style Root fill:#1a1a2e,stroke:#aa3bff,color:#fff
    style BIN fill:#16213e,stroke:#aa3bff,color:#fff
    style SRC fill:#0f3460,stroke:#aa3bff,color:#fff
    style DATA fill:#533483,stroke:#aa3bff,color:#fff
    style PUBLIC fill:#1a1a2e,stroke:#aa3bff,color:#fff
    style DIST fill:#2d1b69,stroke:#aa3bff,color:#fff
```

## CLI Architecture

```mermaid
flowchart LR
    User["User Terminal"]

    subgraph CLI["bin/cli.js"]
        PARSE["Parse Args"]
        LOAD["Load commands.json"]
        FIND["findCommand / findById"]
        LIST["listCommands"]
        EXEC["executeCommand<br/>(execSync)"]
        COPY["copyToClipboard"]
    end

    subgraph DATA["Data Source"]
        JSON["commands.json"]
    end

    subgraph SHELL["System Shell"]
        SH["execSync()"]
    end

    User -->|"os-t --list"| PARSE
    User -->|"os-t w1"| PARSE
    User -->|"os-t --search ping"| PARSE

    PARSE --> LOAD
    LOAD --> JSON
    JSON --> FIND
    JSON --> LIST

    FIND -->|"by ID"| EXEC
    FIND -->|"by name"| LIST
    LIST -->|"--list"| User
    LIST -->|"1 result"| EXEC
    LIST -->|"--copy"| COPY
    FIND -->|"--copy"| COPY

    COPY -->|"clip / pbcopy / xclip"| User
    EXEC --> SH
    SH -->|"stdout/stderr"| User

    style CLI fill:#1a1a2e,stroke:#aa3bff,color:#fff
    style DATA fill:#533483,stroke:#aa3bff,color:#fff
    style SHELL fill:#0f3460,stroke:#aa3bff,color:#fff
```

## Web App Architecture

```mermaid
flowchart TD
    subgraph BROWSER["Browser"]
        UI["React App<br/>(App.jsx)"]

        subgraph STATE["React State"]
            OS["selectedOS"]
            CAT["selectedCategory"]
            CMD["selectedCmd"]
            TERM["terminalOutput"]
            SRCH["searchQuery"]
        end

        subgraph UI_COMP["UI Components"]
            OSSEL["OS Selector<br/>(windows/linux/macos)"]
            CATSEL["Category Dropdown"]
            CMDSEL["Command Dropdown"]
            DETAIL["Command Detail"]
            TERMINAL["Terminal Panel"]
        end
    end

    subgraph SERVER_LAYER["Server Layer"]
        subgraph DEV["Dev Mode<br/>(vite.config.js)"]
            VMIDDLE["Vite Middleware<br/>/api/execute"]
        end

        subgraph PROD["Production Mode<br/>(server.js)"]
            PMIDDLE["HTTP Server<br/>/api/execute"]
        end
    end

    subgraph EXEC_LAYER["Execution"]
        EXEC["child_process.exec()"]
        SHELL["System Shell"]
    end

    subgraph LOCALSTORAGE["localStorage"]
        RECENT["Recent Commands"]
    end

    UI --> OSSEL
    UI --> CATSEL
    UI --> CMDSEL
    UI --> DETAIL
    UI --> TERMINAL

    OSSEL --> OS
    CATSEL --> CAT
    CMDSEL --> CMD

    DETAIL -->|"Execute"| VMIDDLE
    DETAIL -->|"Execute"| PMIDDLE
    DETAIL -->|"Copy"| RECENT

    VMIDDLE --> EXEC
    PMIDDLE --> EXEC
    EXEC --> SHELL
    SHELL -->|"stdout/stderr"| TERMINAL

    style BROWSER fill:#1a1a2e,stroke:#aa3bff,color:#fff
    style STATE fill:#533483,stroke:#aa3bff,color:#fff
    style UI_COMP fill:#0f3460,stroke:#aa3bff,color:#fff
    style SERVER_LAYER fill:#16213e,stroke:#aa3bff,color:#fff
    style DEV fill:#0f3460,stroke:#aa3bff,color:#fff
    style PROD fill:#0f3460,stroke:#aa3bff,color:#fff
    style EXEC_LAYER fill:#2d1b69,stroke:#aa3bff,color:#fff
    style LOCALSTORAGE fill:#533483,stroke:#aa3bff,color:#fff
```

## Data Flow

```mermaid
flowchart LR
    subgraph SOURCE["Data Sources"]
        JSON["commands.json<br/>(CLI + npm package)"]
        JS["commands.js<br/>(Web App)"]
    end

    subgraph CLI_FLOW["CLI Usage"]
        CLI["bin/cli.js"]
        NPM["npm package<br/>consumers"]
    end

    subgraph WEB_FLOW["Web App Usage"]
        VITE["Vite Dev Server"]
        BUILD["npm run build"]
        PROD["server.js"]
    end

    subgraph CONSUMERS["End Users"]
        TERMINAL["Terminal"]
        BROWSER["Browser"]
    end

    JSON -->|"readFileSync"| CLI
    JSON -->|"import"| NPM
    JS -->|"import"| VITE
    JS -->|"bundled into"| BUILD
    BUILD -->|"served by"| PROD

    CLI -->|"execSync"| TERMINAL
    NPM -->|"programmatic"| TERMINAL
    VITE -->|"fetch /api/execute"| BROWSER
    PROD -->|"fetch /api/execute"| BROWSER

    style SOURCE fill:#533483,stroke:#aa3bff,color:#fff
    style CLI_FLOW fill:#0f3460,stroke:#aa3bff,color:#fff
    style WEB_FLOW fill:#0f3460,stroke:#aa3bff,color:#fff
    style CONSUMERS fill:#2d1b69,stroke:#aa3bff,color:#fff
```

## API Execute Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser as Browser<br/>(App.jsx)
    participant Server as Server<br/>(vite / server.js)
    participant Exec as child_process.exec()
    participant Shell as System Shell

    User->>Browser: Click "Execute"
    Browser->>Browser: prepareCommand()<br/>(add sudo for linux/macos)
    Browser->>Server: POST /api/execute<br/>{ command: "ping 8.8.8.8" }

    alt Dev Mode (vite.config.js)
        Server->>Server: terminalPlugin middleware
    else Production Mode (server.js)
        Server->>Server: HTTP request handler
    end

    Server->>Server: Parse JSON body
    Server->>Server: Validate command string
    Server->>Exec: exec(command,<br/>cwd, timeout: 30s,<br/>maxBuffer: 512KB)
    Exec->>Shell: Spawn shell process
    Shell-->>Exec: stdout + stderr
    Exec-->>Server: callback(error, stdout, stderr)
    Server->>Server: Build response JSON
    Server-->>Browser: { stdout, stderr,<br/>exitCode, message }
    Browser->>Browser: Update terminalOutput state
    Browser-->>User: Display output in<br/>Terminal Panel
```

## Command Data Structure

```mermaid
flowchart TD
    subgraph COMMAND["Single Command Object"]
        ID["id: w1"]
        NAME["name: Flush DNS Cache"]
        CMD["command: ipconfig /flushdns"]
        DESC["description: Clear the DNS resolver cache"]
        DEF["default: (optional)"]
    end

    subgraph CATEGORY["Category"]
        CAT["category: Network"]
        CMDS["commands: [...]"]
    end

    subgraph OS["OS Platform"]
        WIN["windows"]
        LIN["linux"]
        MAC["macos"]
    end

    OS --> CATEGORY
    CATEGORY --> COMMAND
    CMD -->|"CLI shows this"| CLI_USER["CLI User"]
    DEF -->|"Web app shows this"| WEB_USER["Web User"]
    DEF -.->|"if exists, replaces"| CMD

    style COMMAND fill:#533483,stroke:#aa3bff,color:#fff
    style CATEGORY fill:#0f3460,stroke:#aa3bff,color:#fff
    style OS fill:#1a1a2e,stroke:#aa3bff,color:#fff
```

## Build Process

```mermaid
flowchart LR
    subgraph DEV["Development"]
        NPMDEV["npm run dev"]
        VITE["Vite Dev Server<br/>:5173"]
        HMR["Hot Module<br/>Replacement"]
    end

    subgraph BUILD_STEP["Build"]
        NPMBUILD["npm run build"]
        VITEBUILD["vite build"]
        OPT["Optimize &<br/>Minify"]
    end

    subgraph OUTPUT["Build Output"]
        DIST["dist/"]
        DHTML["index.html"]
        DJS["assets/index-*.js"]
        DCSS["assets/index-*.css"]
    end

    subgraph PROD_STEP["Production"]
        NPMSTART["npm run start"]
        NODESERVER["server.js<br/>:3000"]
        STATIC["Static File<br/>Serving"]
    end

    NPMDEV --> VITE
    VITE --> HMR

    NPMBUILD --> VITEBUILD
    VITEBUILD --> OPT
    OPT --> DIST
    DIST --> DHTML
    DIST --> DJS
    DIST --> DCSS

    NPMSTART --> NODESERVER
    NODESERVER --> STATIC
    STATIC --> DIST

    style DEV fill:#0f3460,stroke:#aa3bff,color:#fff
    style BUILD_STEP fill:#533483,stroke:#aa3bff,color:#fff
    style OUTPUT fill:#2d1b69,stroke:#aa3bff,color:#fff
    style PROD_STEP fill:#16213e,stroke:#aa3bff,color:#fff
```

## File Relationships

```mermaid
flowchart TD
    PKG["package.json"]

    subgraph CLI_FILES["CLI"]
        CLI["bin/cli.js"]
    end

    subgraph WEB_FILES["Web App"]
        MAIN["src/main.jsx"]
        APP["src/App.jsx"]
        CSS["src/App.css"]
        ERR["src/ErrorBoundary.jsx"]
    end

    subgraph DATA_FILES["Data"]
        JSON["src/data/commands.json"]
        JS["src/data/commands.js"]
    end

    subgraph CONFIG["Config"]
        VITE["vite.config.js"]
        SERVER["server.js"]
        HTML["index.html"]
    end

    PKG -->|"bin.os-t"| CLI
    PKG -->|"main / exports"| JSON
    PKG -->|"files"| CLI
    PKG -->|"files"| JSON
    PKG -->|"files"| JS

    CLI -->|"readFileSync"| JSON
    MAIN -->|"createRoot"| APP
    MAIN -->|"ErrorBoundary"| ERR
    APP -->|"import"| JS
    APP -->|"import"| CSS
    HTML -->|"<script>"| MAIN
    VITE -->|"dev server"| APP
    VITE -->|"build"| SERVER
    SERVER -->|"serve dist"| VITE

    style PKG fill:#aa3bff,stroke:#aa3bff,color:#fff
    style CLI_FILES fill:#0f3460,stroke:#aa3bff,color:#fff
    style WEB_FILES fill:#16213e,stroke:#aa3bff,color:#fff
    style DATA_FILES fill:#533483,stroke:#aa3bff,color:#fff
    style CONFIG fill:#2d1b69,stroke:#aa3bff,color:#fff
```
