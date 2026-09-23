use tauri::Manager;

#[derive(serde::Serialize)]
struct WindowBounds {
    x: f64,
    y: f64,
}

#[tauri::command]
fn drag_window(window: tauri::Window, x: f64, y: f64) {
    let _ = window.set_position(tauri::Position::Logical(
        tauri::LogicalPosition::new(x - 150.0, y - 150.0),
    ));
}

#[tauri::command]
fn get_window_bounds(window: tauri::Window) -> Result<WindowBounds, String> {
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    Ok(WindowBounds {
        x: pos.x as f64,
        y: pos.y as f64,
    })
}

#[tauri::command]
fn close_app(app: tauri::AppHandle) {
    app.exit(0);
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            drag_window,
            get_window_bounds,
            close_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
