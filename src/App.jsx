import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { troubleshootingCommands } from "./data/commands";
import "./App.css";

function App() {
  const [selectedOS, setSelectedOS] = useState("windows");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [executing, setExecuting] = useState(false);

  const terminalRef = useRef(null);

  const categories = useMemo(
    () => (troubleshootingCommands[selectedOS] || []).map((c) => c.category),
    [selectedOS],
  );

  const allCommands = useMemo(() => {
    const osData = troubleshootingCommands[selectedOS] || [];
    const found = osData.find((c) => c.category === selectedCategory);
    return found?.commands || [];
  }, [selectedOS, selectedCategory]);

  const selectedCmd = allCommands[selectedCommandIndex] || null;

  useEffect(() => {
    setSelectedCategory(categories[0] || "");
    setSelectedCommandIndex(0);
  }, [selectedOS, categories]);

  useEffect(() => {
    setSelectedCommandIndex(0);
  }, [selectedCategory]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  const prepareCommand = useCallback((cmd, os) => {
    if ((os === "linux" || os === "macos") && !cmd.startsWith("sudo ")) {
      return `sudo ${cmd}`;
    }
    return cmd;
  }, []);

  const copyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopiedIndex(key);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const executeCommand = async (cmd, name) => {
    const timestamp = new Date().toLocaleTimeString();
    const finalCmd = prepareCommand(cmd, selectedOS);

    setTerminalOutput((prev) => [
      ...prev,
      { type: "command", text: finalCmd, name, time: timestamp },
    ]);

    setExecuting(true);

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: finalCmd }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();

      setTerminalOutput((prev) => {
        const updated = [...prev];
        if (data.stdout) {
          updated.push({
            type: "stdout",
            text: data.stdout.trimEnd(),
            time: timestamp,
          });
        }
        if (data.stderr) {
          updated.push({
            type: "stderr",
            text: data.stderr.trimEnd(),
            time: timestamp,
          });
        }
        if (data.exitCode !== 0) {
          updated.push({
            type: "error",
            text: `Process exited with code ${data.exitCode}`,
            time: timestamp,
          });
        }
        if (!data.stdout && !data.stderr && data.exitCode === 0) {
          updated.push({
            type: "info",
            text: "Command executed successfully (no output).",
            time: timestamp,
          });
        }
        return updated;
      });
    } catch (err) {
      setTerminalOutput((prev) => [
        ...prev,
        {
          type: "error",
          text: `Failed to execute: ${err.message}. Make sure the dev server is running.`,
          time: timestamp,
        },
      ]);
    } finally {
      setExecuting(false);
    }
  };

  const clearTerminal = () => {
    setTerminalOutput([]);
  };

  const exportTerminal = () => {
    const lines = terminalOutput
      .map((line) => {
        if (line.type === "command") return `$ ${line.text}`;
        return line.text;
      })
      .join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `terminal-history-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const osIcons = {
    windows: "🖥️",
    linux: "🐧",
    macos: "🍎",
    website: "🌐",
    software: "📱",
  };
  const osIcon = osIcons[selectedOS] || "📱";

  return (
    <div className="app">
      <main className="main-content">
        <div className="controls">
          <div className="os-selector">
            <label>Operating System</label>
            <div className="os-buttons">
              {Object.keys(troubleshootingCommands).map((os) => (
                <button
                  key={os}
                  className={`os-btn ${selectedOS === os ? "active" : ""}`}
                  onClick={() => setSelectedOS(os)}
                >
                  <span className="os-icon">{osIcons[os]}</span>
                  {os.charAt(0).toUpperCase() + os.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="category-selector">
            <label>Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-dropdown"
            >
              {categories.map((cat) => {
                const catData = (troubleshootingCommands[selectedOS] || []).find(
                  (c) => c.category === cat,
                );
                return (
                  <option key={cat} value={cat}>
                    {cat} ({catData?.commands.length || 0})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="commands-section">
          <h2>
            {osIcon} {selectedCategory} Commands
            <span className="command-count">
              {allCommands.length} commands
            </span>
          </h2>

          <div className="command-selector">
            <div className="command-dropdown-wrapper">
              <label>Select Command</label>
              <select
                value={selectedCommandIndex}
                onChange={(e) => setSelectedCommandIndex(Number(e.target.value))}
                className="command-dropdown"
              >
                {allCommands.map((cmd, idx) => (
                  <option key={cmd.id} value={idx}>
                    {cmd.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCmd && (
              <div className="command-detail">
                <div className="command-detail-header">
                  <h3>{selectedCmd.name}</h3>
                  <span className="command-id">{selectedCmd.id}</span>
                </div>
                {selectedCmd.description && (
                  <p className="command-desc">{selectedCmd.description}</p>
                )}
                <code className="command-code">
                  {selectedCmd.default || selectedCmd.command}
                </code>
                {(selectedOS === "linux" || selectedOS === "macos") && (
                  <p className="sudo-note">
                    Will run with: sudo
                  </p>
                )}
                <div className="command-actions">
                  <button
                    className="copy-btn-large"
                    onClick={() =>
                      copyToClipboard(
                        prepareCommand(selectedCmd.default || selectedCmd.command, selectedOS),
                        "detail-copy",
                      )
                    }
                    title="Copy to clipboard (with sudo)"
                  >
                    {copiedIndex === "detail-copy"
                      ? "✓ Copied!"
                      : "📋 Copy Command"}
                  </button>
                  <button
                    className="run-btn"
                    disabled={executing}
                    onClick={() =>
                      executeCommand(selectedCmd.default || selectedCmd.command, selectedCmd.name)
                    }
                  >
                    {executing ? "⏳ Running..." : "▶ Execute"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="terminal-section">
          <div className="terminal-header">
            <div className="terminal-dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <span className="terminal-title">
              {selectedOS === "windows"
                ? "PowerShell"
                : selectedOS === "macos"
                  ? "zsh"
                  : "bash"}{" "}
              Terminal
            </span>
            <div className="terminal-actions">
              <button
                className="export-btn"
                onClick={exportTerminal}
                disabled={terminalOutput.length === 0}
                title="Export terminal history"
              >
                💾 Export
              </button>
              <button className="clear-btn" onClick={clearTerminal}>
                Clear
              </button>
            </div>
          </div>
          <div className="terminal-body" ref={terminalRef}>
            {terminalOutput.length === 0 ? (
              <div className="terminal-placeholder">
                Click "Execute" to run the command and see output here...
              </div>
            ) : (
              terminalOutput.map((line, idx) => (
                <div key={idx} className={`terminal-line ${line.type}`}>
                  {line.type === "command" && (
                    <>
                      <span className="terminal-prompt">
                        {selectedOS === "windows" ? "PS>" : "$"}
                      </span>
                      <span className="terminal-command">{line.text}</span>
                    </>
                  )}
                  {line.type === "stdout" && (
                    <pre className="terminal-stdout">{line.text}</pre>
                  )}
                  {line.type === "stderr" && (
                    <pre className="terminal-stderr">{line.text}</pre>
                  )}
                  {line.type === "error" && (
                    <span className="terminal-error">{line.text}</span>
                  )}
                  {line.type === "info" && (
                    <span className="terminal-info">{line.text}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>
          OS Troubleshooter &mdash; Linux/macOS commands execute with sudo
          automatically.
        </p>
      </footer>
    </div>
  );
}

export default App;
