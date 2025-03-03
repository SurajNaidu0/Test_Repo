use axum::{http::StatusCode, response::IntoResponse, Router};
use std::net::SocketAddr;
use tower_sessions::{cookie::{time::Duration, SameSite}, Expiry, MemoryStore, SessionManagerLayer};
use tower_http::cors::{CorsLayer};
use http::header::{HeaderValue, CONTENT_TYPE, ACCEPT, ORIGIN, ACCESS_CONTROL_REQUEST_METHOD, ACCESS_CONTROL_REQUEST_HEADERS};
use http::Method;

mod auth;
mod error;
mod polls;
mod startup;

use crate::startup::AppState;
#[macro_use]
extern crate tracing;

#[tokio::main]
async fn main() {
    if std::env::var("RUST_LOG").is_err() {
        std::env::set_var("RUST_LOG", "INFO");
    }
    tracing_subscriber::fmt::init();

    let app_state = AppState::new().await;
    let session_store = MemoryStore::default();
    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));

    let app = Router::new()
        .merge(auth::routes())
        .merge(polls::routes())
        .layer(axum::Extension(app_state))
        .layer(
            SessionManagerLayer::new(session_store)
                .with_name("webauthnrs")
                .with_same_site(SameSite::Strict)
                .with_secure(false)
                .with_expiry(Expiry::OnInactivity(Duration::seconds(360)))
        )
        .layer(CorsLayer::new()
            .allow_origin("http://localhost:8081".parse::<HeaderValue>().unwrap())
            .allow_methods(vec![Method::GET, Method::POST, Method::OPTIONS])
            .allow_headers(vec![CONTENT_TYPE, ACCEPT, ORIGIN, ACCESS_CONTROL_REQUEST_METHOD, ACCESS_CONTROL_REQUEST_HEADERS])
            .allow_credentials(true))
        .fallback(handler_404);

    info!("listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.expect("Unable to spawn tcp listener");
    axum::serve(listener, app).await.unwrap();
}

async fn handler_404() -> impl IntoResponse {
    (StatusCode::NOT_FOUND, "nothing to see here")
}