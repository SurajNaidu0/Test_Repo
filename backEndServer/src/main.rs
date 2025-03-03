use axum::{extract::Extension, http::StatusCode, response::IntoResponse, routing::post, Router};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use axum::http::{HeaderValue, Method, header};
use tower_sessions::{
    cookie::{time::Duration, SameSite},
    Expiry, MemoryStore, SessionManagerLayer,
};
mod error;
use crate::startup::AppState;
use crate::auth::{start_register, finish_register, start_authentication, finish_authentication};
use crate::polls::create_poll;
#[macro_use]
extern crate tracing;

mod auth;
mod startup;
mod polls;


#[tokio::main]
async fn main() {
    if std::env::var("RUST_LOG").is_err() {
        std::env::set_var("RUST_LOG", "INFO");
    }
    // initialize tracing
    tracing_subscriber::fmt::init();

    let cors = CorsLayer::new()
        // Allow requests from the Next.js frontend
        .allow_origin("http://localhost:3000".parse::<HeaderValue>().unwrap())
        // Allow all methods you need
        .allow_methods([Method::GET, Method::POST])
        // Allow content-type header
        .allow_headers([header::CONTENT_TYPE])
        // Important for authentication cookies
        .allow_credentials(true);

    // Create the app
    let app_state = AppState::new().await;

    let session_store = MemoryStore::default();

    //build our application with a route
    let app = Router::new()
        .route("/register_start/:username", post(start_register))
        .route("/register_finish", post(finish_register))
        .route("/login_start/:username", post(start_authentication))
        .route("/login_finish", post(finish_authentication))
        .route("/api/polls", post(create_poll))
        .layer(Extension(app_state))
        .layer(
            SessionManagerLayer::new(session_store)
                .with_name("webauthnrs")
                // Change these two lines here ↓
                .with_same_site(SameSite::None) // Changed from Strict to None
                .with_secure(false)             // Use false for local dev
                // ↑ Update these settings
                .with_expiry(Expiry::OnInactivity(Duration::seconds(360))),
        )
        .layer(cors) // Add the CORS layer after this
        .fallback(handler_404);



    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    info!("listening on {addr}");

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("Unable to spawn tcp listener");

    axum::serve(listener, app).await.unwrap();
}

async fn handler_404() -> impl IntoResponse {
    (StatusCode::NOT_FOUND, "nothing to see here")
}