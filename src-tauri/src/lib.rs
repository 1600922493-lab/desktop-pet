use tauri::webview::WebviewWindowBuilder;

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
    let scale = window.scale_factor().unwrap_or(1.0);
    Ok(WindowBounds {
        x: pos.x as f64 / scale,
        y: pos.y as f64 / scale,
    })
}

#[tauri::command]
fn close_app(app: tauri::AppHandle) {
    app.exit(0);
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![drag_window, get_window_bounds, close_app])
        .setup(|app| {
            let window = WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::App("index.html".into()),
            )
            .title("桌宠")
            .inner_size(300.0, 300.0)
            .resizable(false)
            .decorations(false)
            .transparent(true)
            .always_on_top(true)
            .shadow(false)
            .background_color(tauri::window::Color(0, 0, 0, 0))
            .build()?;

            let _ = window.set_visible_on_all_workspaces(true);
            window.show()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
