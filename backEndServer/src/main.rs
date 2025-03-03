use axum::{extract::Extension, http::StatusCode, response::IntoResponse, routing::post, Router};
use std::net::SocketAddr;
use tower_sessions::{
    cookie::{time::Duration, SameSite},
    Expiry, MemoryStore, SessionManagerLayer,
};
use tower_http::cors::{CorsLayer};
use http::header::{HeaderValue, CONTENT_TYPE, ACCEPT, ORIGIN, ACCESS_CONTROL_REQUEST_METHOD, ACCESS_CONTROL_REQUEST_HEADERS};
use http::Method;

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

    // Create the app state
    let app_state = AppState::new().await;

    let session_store = MemoryStore::default();

    // Define the address
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));

    // Build our application with routes
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
                .with_same_site(SameSite::Strict)
                .with_secure(false) // TODO: change to true for HTTPS/production
                .with_expiry(Expiry::OnInactivity(Duration::seconds(360)))
        )
        .layer(CorsLayer::new()
            .allow_origin("http://localhost:8081".parse::<HeaderValue>().unwrap()) // Changed to 8081
            .allow_methods(vec![Method::GET, Method::POST, Method::OPTIONS])
            .allow_headers(vec![
                CONTENT_TYPE,
                ACCEPT,
                ORIGIN,
                ACCESS_CONTROL_REQUEST_METHOD,
                ACCESS_CONTROL_REQUEST_HEADERS,
            ])
            .allow_credentials(true))
        .fallback(handler_404);

    let app = Router::new()
        .merge(app)
        .nest_service("/", tower_http::services::ServeDir::new("../frontEnd/js"));

    info!("listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("Unable to spawn tcp listener");

    axum::serve(listener, app).await.unwrap();
}

async fn handler_404() -> impl IntoResponse {
    (StatusCode::NOT_FOUND, "nothing to see here")
}