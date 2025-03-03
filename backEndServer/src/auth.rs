use crate::error::WebauthnError;
use crate::startup::AppState;
use axum::{
    extract::{Extension, Json, Path},
    http::StatusCode,
    response::IntoResponse,
    Router, routing::post,
};
use tower_sessions::Session;
use log::{error, info};
use webauthn_rs::prelude::*;
use mongodb::bson::{doc, Binary};  // Removed unused `self`
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<mongodb::bson::oid::ObjectId>,
    pub username: String,
    pub keys: Passkey,
    #[serde(with = "uuid_binary_format")]
    pub uuid: Uuid,
}

pub async fn is_authenticated(session: &Session) -> Result<mongodb::bson::oid::ObjectId, WebauthnError> {
    let user_id = session.get::<mongodb::bson::oid::ObjectId>("user_id").await
        .map_err(|e| { error!("Session error: {:?}", e); WebauthnError::CorruptSession })?
        .ok_or_else(|| { info!("User not authenticated"); WebauthnError::Unauthenticated })?;
    Ok(user_id)
}

mod uuid_binary_format {
    use mongodb::bson::Binary;
    use mongodb::bson::spec::BinarySubtype;
    use serde::{Deserialize, Deserializer, Serialize, Serializer};
    use uuid::Uuid;

    pub fn serialize<S>(uuid: &Uuid, serializer: S) -> Result<S::Ok, S::Error>
    where S: Serializer {
        let bytes = uuid.as_bytes();
        let binary = Binary { subtype: BinarySubtype::Generic, bytes: bytes.to_vec() };
        Binary::serialize(&binary, serializer)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Uuid, D::Error>
    where D: Deserializer<'de> {
        let binary = Binary::deserialize(deserializer)?;
        let bytes: [u8; 16] = binary.bytes.as_slice().try_into().map_err(|_| serde::de::Error::custom("Expected binary of length 16 for UUID"))?;
        Ok(Uuid::from_bytes(bytes))
    }
}

pub async fn start_register(
    Extension(app_state): Extension<AppState>,
    session: Session,
    Path(username): Path<String>,
) -> Result<impl IntoResponse, WebauthnError> {
    info!("Starting registration for user: {}", username);
    let user_collection = app_state.db.collection::<User>("users");
    let user_option = user_collection.find_one(doc! { "username": username.clone() }, None).await
        .map_err(|e| { error!("Database error during user search: {:?}", e); WebauthnError::DatabaseError })?;

    if user_option.is_none() {
        let user_unique_id = Uuid::new_v4();
        let _ = session.remove_value("reg_state").await;

        match app_state.webauthn.start_passkey_registration(user_unique_id, &username, &username, None) {
            Ok((ccr, reg_state)) => {
                session.insert("reg_state", (username.clone(), user_unique_id, reg_state)).await
                    .map_err(|e| { error!("Session error: {:?}", e); WebauthnError::CorruptSession })?;
                info!("Registration challenge created for user: {}", username);
                Ok(Json(ccr))
            }
            Err(e) => {
                error!("WebAuthn registration initialization error: {:?}", e);
                Err(WebauthnError::Unknown)
            }
        }
    } else {
        info!("User '{}' already exists", username);
        Err(WebauthnError::UserExists)
    }
}

pub async fn finish_register(
    Extension(app_state): Extension<AppState>,
    session: Session,
    Json(reg): Json<RegisterPublicKeyCredential>,
) -> Result<impl IntoResponse, WebauthnError> {
    let (username, user_unique_id, reg_state) = match session.get::<(String, Uuid, PasskeyRegistration)>("reg_state").await {
        Ok(Some(data)) => data,
        Ok(None) => { error!("No registration state found in session"); return Err(WebauthnError::CorruptSession); }
        Err(e) => { error!("Failed to get session data: {:?}", e); return Err(WebauthnError::InvalidSessionState(e)); }
    };

    let _ = session.remove_value("reg_state").await;

    match app_state.webauthn.finish_passkey_registration(&reg, &reg_state) {
        Ok(passkey) => {
            let user = User { id: None, username: username.clone(), keys: passkey, uuid: user_unique_id }; // Clone username
            let user_collection = app_state.db.collection::<User>("users");
            user_collection.insert_one(user, None).await
                .map_err(|e| { error!("Failed to store user: {:?}", e); WebauthnError::DatabaseError })?;
            info!("User registration completed successfully for: {}", username);
            Ok(StatusCode::OK)
        }
        Err(e) => {
            error!("WebAuthn registration completion error: {:?}", e);
            Err(WebauthnError::InvalidCredential)
        }
    }
}

pub async fn start_authentication(
    Extension(app_state): Extension<AppState>,
    session: Session,
    Path(username): Path<String>,
) -> Result<impl IntoResponse, WebauthnError> {
    info!("Starting authentication for user: {}", username);
    let _ = session.remove_value("auth_state").await;

    let user_collection = app_state.db.collection::<User>("users");
    let user = user_collection.find_one(doc! { "username": username.clone() }, None).await
        .map_err(|e| { error!("Database error during user search: {:?}", e); WebauthnError::DatabaseError })?
        .ok_or_else(|| { info!("User '{}' not found", username); WebauthnError::UserNotFound })?;

    match app_state.webauthn.start_passkey_authentication(&[user.keys.clone()]) {
        Ok((rcr, auth_state)) => {
            session.insert("auth_state", (user.uuid, auth_state)).await
                .map_err(|e| { error!("Session error: {:?}", e); WebauthnError::CorruptSession })?;
            info!("Authentication challenge created for user: {}", username);
            Ok(Json(rcr))
        }
        Err(e) => {
            error!("WebAuthn authentication initialization error: {:?}", e);
            Err(WebauthnError::Unknown)
        }
    }
}

pub async fn finish_authentication(
    Extension(app_state): Extension<AppState>,
    session: Session,
    Json(auth): Json<PublicKeyCredential>,
) -> Result<impl IntoResponse, WebauthnError> {
    let (user_uuid, auth_state) = match session.get::<(Uuid, PasskeyAuthentication)>("auth_state").await {
        Ok(Some(data)) => data,
        Ok(None) => { error!("No authentication state found in session"); return Err(WebauthnError::CorruptSession); }
        Err(e) => { error!("Failed to get session data: {:?}", e); return Err(WebauthnError::InvalidSessionState(e)); }
    };

    let _ = session.remove_value("auth_state").await;

    let user_collection = app_state.db.collection::<User>("users");
    let binary = Binary { subtype: mongodb::bson::spec::BinarySubtype::Generic, bytes: user_uuid.as_bytes().to_vec() };
    let user = user_collection.find_one(doc! { "uuid": binary }, None).await
        .map_err(|e| { error!("Database error during user lookup: {:?}", e); WebauthnError::DatabaseError })?
        .ok_or_else(|| { error!("User with UUID {:?} not found", user_uuid); WebauthnError::UserNotFound })?;

    match app_state.webauthn.finish_passkey_authentication(&auth, &auth_state) {
        Ok(auth_result) => {
            let mut updated_user = user.clone();
            updated_user.keys.update_credential(&auth_result);

            if let Some(id) = user.id {
                user_collection.replace_one(doc! { "_id": id }, updated_user, None).await
                    .map_err(|e| { error!("Failed to update user credential: {:?}", e); WebauthnError::DatabaseError })?;
                session.insert("user_id", id).await
                    .map_err(|e| { error!("Failed to store user ID in session: {:?}", e); WebauthnError::CorruptSession })?;
                info!("Authentication successful for user with UUID: {:?}", user_uuid);
                Ok(StatusCode::OK)
            } else {
                error!("User document is missing _id field");
                Err(WebauthnError::DatabaseError)
            }
        }
        Err(e) => {
            error!("WebAuthn authentication completion error: {:?}", e);
            Err(WebauthnError::InvalidCredential)
        }
    }
}

pub async fn logout(session: Session) -> Result<impl IntoResponse, WebauthnError> {
    session.remove_value("user_id").await
        .map_err(|e| { error!("Session error: {:?}", e); WebauthnError::CorruptSession })?;
    Ok(StatusCode::OK)
}

pub fn routes() -> Router {
    Router::new()
        .route("/register_start/:username", post(start_register))
        .route("/register_finish", post(finish_register))
        .route("/login_start/:username", post(start_authentication))
        .route("/login_finish", post(finish_authentication))
        .route("/api/auth/logout", post(logout)) // Added
}