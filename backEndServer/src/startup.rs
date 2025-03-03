use std::sync::Arc;
use webauthn_rs::prelude::*;
use mongodb::{Client, Database};

#[derive(Clone)]
pub struct AppState {
    pub webauthn: Arc<Webauthn>,
    pub db: Database,
}

impl AppState {
    pub async fn new() -> Self {
        let client = Client::with_uri_str("mongodb+srv://suraj:suraj@cluster0.pbka6.mongodb.net/")
            .await
            .expect("Failed to connect to MongoDB");
        let db = client.database("auth_db");

        let rp_id = "localhost";
        let rp_origin = Url::parse("http://localhost:8081").expect("Invalid URL"); // Matches frontend
        let builder = WebauthnBuilder::new(rp_id, &rp_origin).expect("Invalid configuration");
        let builder = builder.rp_name("Axum Webauthn-rs");
        let webauthn = Arc::new(builder.build().expect("Invalid configuration"));
        println!("Connected to MongoDB");
        AppState { webauthn, db }
    }
}