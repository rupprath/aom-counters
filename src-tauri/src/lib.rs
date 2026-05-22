use std::fs;
use tauri::{LogicalSize, Manager, Size};

/// Name of the local read-write settings file (DR-9), stored in the app's
/// config directory.
const SETTINGS_FILE: &str = "user-settings.json";

/// The four window footprints. `setup` is the pre-match picker; `collapsed`,
/// `default`, and `expanded` are the in-match footprint ladder (FR-17..19).
fn footprint_size(mode: &str) -> Option<(f64, f64)> {
    match mode {
        "setup" => Some((360.0, 600.0)),
        "collapsed" => Some((76.0, 76.0)),
        "default" => Some((900.0, 240.0)),
        "expanded" => Some((1180.0, 240.0)),
        _ => None,
    }
}

/// Resize the OS window to the requested footprint.
///
/// Window behaviour is the only logic kept in the Rust backend — almost
/// everything else lives in the frontend (see the requirements). Always-on-top
/// and the borderless/transparent chrome are set declaratively in
/// tauri.conf.json; only the live footprint changes need a command.
#[tauri::command]
fn set_window_mode(window: tauri::Window, mode: String) -> Result<(), String> {
    let (width, height) =
        footprint_size(&mode).ok_or_else(|| format!("unknown window mode: {mode}"))?;
    window
        .set_size(Size::Logical(LogicalSize::new(width, height)))
        .map_err(|err| err.to_string())
}

/// Read the persisted user-settings file, or `None` if it does not exist yet.
///
/// This is plain file I/O — the frontend owns all parsing, defaults, and
/// schema migration, so the Rust side stays free of app logic.
#[tauri::command]
fn load_settings(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let path = app
        .path()
        .app_config_dir()
        .map_err(|err| err.to_string())?
        .join(SETTINGS_FILE);
    match fs::read_to_string(&path) {
        Ok(text) => Ok(Some(text)),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(err) => Err(err.to_string()),
    }
}

/// Write the user-settings file, creating the app config directory if needed.
#[tauri::command]
fn save_settings(app: tauri::AppHandle, contents: String) -> Result<(), String> {
    let dir = app.path().app_config_dir().map_err(|err| err.to_string())?;
    fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
    fs::write(dir.join(SETTINGS_FILE), contents).map_err(|err| err.to_string())
}

/// Hand off to winget to install the latest release.
///
/// The app is distributed through winget, so winget — not the app — owns
/// installs and upgrades (DR-11a). The app never downloads or self-installs;
/// it only detects a newer release and delegates here. This spawns
/// `winget upgrade` in its own console window via `start`, so it survives the
/// app closing and shows the user progress. The frontend closes the app right
/// after, so winget can replace the running executable.
#[tauri::command]
fn winget_upgrade(package_id: String) -> Result<(), String> {
    // `package_id` is an app-side constant, but validate anyway: restricting it
    // to winget PackageIdentifier characters guarantees nothing can be smuggled
    // onto the command line.
    if package_id.is_empty()
        || !package_id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '-' | '_' | '+'))
    {
        return Err(format!("invalid winget package id: {package_id}"));
    }

    // `start` launches winget in a detached console, so the `spawn()` below
    // succeeds even when winget is missing — the user would just see the app
    // close with nothing happening. Probe for winget first, so the frontend
    // can surface a real error and fall back to the manual instructions.
    let winget_available = std::process::Command::new("cmd")
        .args(["/c", "where", "winget"])
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .map(|status| status.success())
        .unwrap_or(false);
    if !winget_available {
        return Err("winget was not found on this system".to_string());
    }

    std::process::Command::new("cmd")
        .args([
            "/c",
            "start",
            "",
            "winget",
            "upgrade",
            "--id",
            &package_id,
            "--exact",
            "--accept-package-agreements",
            "--accept-source-agreements",
        ])
        .spawn()
        .map(|_| ())
        .map_err(|err| err.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_window_mode,
            load_settings,
            save_settings,
            winget_upgrade
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
