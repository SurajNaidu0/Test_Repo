use axum::{
    extract::{Extension, Json, Path, Query},
    http::StatusCode,
    response::{IntoResponse, Sse},
    Router, routing::{get, post},
};
use futures::TryStreamExt;
use mongodb::bson::{doc, oid::ObjectId, DateTime};
use serde::{Deserialize, Serialize};
use tower_sessions::Session;
use std::time::Duration;
use async_stream::stream;
use chrono::Utc;
use serde_json;

use crate::auth::{is_authenticated, User}; // Import User from auth module
use crate::error::WebauthnError;
use crate::startup::AppState;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PollOption {
    pub id: String,
    pub text: String,
    pub votes: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Poll {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub title: String,
    pub options: Vec<PollOption>,
    pub creator_id: ObjectId,
    pub created_at: DateTime,
    pub is_closed: bool,
    pub total_votes: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Vote {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub poll_id: ObjectId,
    pub user_id: ObjectId,
    pub option_id: String,
    pub voted_at: DateTime,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePollRequest {
    pub title: String,
    pub options: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VoteRequest {
    pub option_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PollResponse {
    pub id: String,
    pub title: String,
    pub options: Vec<PollOption>,
    pub creator_id: String,
    pub creator_username: String, // Included as per previous update
    pub created_at: String,
    pub is_closed: bool,
    pub total_votes: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PollStatistics {
    pub total_votes: i32,
    pub options_data: Vec<OptionStatistics>,
    pub created_at: String,
    pub time_since_creation: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OptionStatistics {
    pub id: String,
    pub text: String,
    pub votes: i32,
    pub percentage: f64,
}

#[derive(Debug, Deserialize)]
pub struct PollQueryParams {
    creator: Option<String>,
    closed: Option<bool>,
}

pub async fn get_polls(
    Extension(app_state): Extension<AppState>,
    session: Session,
    Query(params): Query<PollQueryParams>,
) -> Result<impl IntoResponse, WebauthnError> {
    let poll_collection = app_state.db.collection::<Poll>("polls");
    let user_collection = app_state.db.collection::<User>("users");

    let mut filter = doc! {};
    if let Some(creator) = params.creator {
        if creator == "me" {
            let user_id = is_authenticated(&session).await?;
            filter.insert("creator_id", user_id);
        } else {
            filter.insert("creator_id", ObjectId::parse_str(creator)
                .map_err(|_| WebauthnError::InvalidInput("Invalid creator ID".into()))?);
        }
    }
    if let Some(closed) = params.closed {
        filter.insert("is_closed", closed);
    }

    let mut cursor = poll_collection.find(filter, None).await
        .map_err(|e| { error!("Failed to fetch polls: {:?}", e); WebauthnError::DatabaseError })?;

    let mut poll_responses = Vec::new();
    while let Some(poll) = cursor.try_next().await
        .map_err(|e| { error!("Failed to collect polls: {:?}", e); WebauthnError::DatabaseError })? {
        let creator = user_collection.find_one(doc! { "_id": &poll.creator_id }, None).await
            .map_err(|e| { error!("Failed to fetch user: {:?}", e); WebauthnError::DatabaseError })?
            .ok_or_else(|| { error!("Creator not found for poll: {:?}", poll.id); WebauthnError::UserNotFound })?;

        poll_responses.push(PollResponse {
            id: poll.id.unwrap().to_string(),
            title: poll.title,
            options: poll.options,
            creator_id: poll.creator_id.to_string(),
            creator_username: creator.username, // Now included
            created_at: poll.created_at.to_string(),
            is_closed: poll.is_closed,
            total_votes: poll.total_votes,
        });
    }

    Ok(Json(poll_responses))
}

pub async fn create_poll(
    Extension(app_state): Extension<AppState>,
    session: Session,
    Json(poll_req): Json<CreatePollRequest>,
) -> Result<impl IntoResponse, WebauthnError> {
    let user_id = is_authenticated(&session).await?;

    if poll_req.title.trim().is_empty() {
        return Err(WebauthnError::InvalidInput("Poll title cannot be empty".into()));
    }
    if poll_req.options.len() < 2 {
        return Err(WebauthnError::InvalidInput("Poll must have at least 2 options".into()));
    }

    let mut unique_options = std::collections::HashSet::new();
    for option in &poll_req.options {
        if option.trim().is_empty() {
            return Err(WebauthnError::InvalidInput("Poll options cannot be empty".into()));
        }
        if !unique_options.insert(option.trim().to_lowercase()) {
            return Err(WebauthnError::InvalidInput("Duplicate poll options not allowed".into()));
        }
    }

    let options: Vec<PollOption> = poll_req.options.iter().map(|text| PollOption {
        id: uuid::Uuid::new_v4().to_string(),
        text: text.clone(),
        votes: 0,
    }).collect();

    let poll = Poll {
        id: None,
        title: poll_req.title,
        options,
        creator_id: user_id,
        created_at: DateTime::now(),
        is_closed: false,
        total_votes: 0,
    };

    let poll_collection = app_state.db.collection::<Poll>("polls");
    let result = poll_collection.insert_one(poll, None).await
        .map_err(|e| { error!("Failed to insert poll: {:?}", e); WebauthnError::DatabaseError })?;

    let poll_id = result.inserted_id.as_object_id().ok_or(WebauthnError::DatabaseError)?;
    info!("Poll created with ID: {}", poll_id);
    Ok((StatusCode::CREATED, Json(doc! { "poll_id": poll_id.to_string() })))
}

pub async fn get_poll(
    Extension(app_state): Extension<AppState>,
    Path(poll_id): Path<String>,
) -> Result<impl IntoResponse, WebauthnError> {
    let poll_id = ObjectId::parse_str(&poll_id).map_err(|_| WebauthnError::InvalidInput("Invalid poll ID".into()))?;
    let poll_collection = app_state.db.collection::<Poll>("polls");
    let user_collection = app_state.db.collection::<User>("users");

    let poll = poll_collection.find_one(doc! { "_id": poll_id }, None).await
        .map_err(|_| WebauthnError::DatabaseError)?
        .ok_or(WebauthnError::UserNotFound)?;

    let creator = user_collection.find_one(doc! { "_id": &poll.creator_id }, None).await
        .map_err(|e| { error!("Failed to fetch user: {:?}", e); WebauthnError::DatabaseError })?
        .ok_or_else(|| { error!("Creator not found for poll: {:?}", poll.id); WebauthnError::UserNotFound })?;

    Ok(Json(PollResponse {
        id: poll.id.unwrap().to_string(),
        title: poll.title,
        options: poll.options,
        creator_id: poll.creator_id.to_string(),
        creator_username: creator.username,
        created_at: poll.created_at.to_string(),
        is_closed: poll.is_closed,
        total_votes: poll.total_votes,
    }))
}

pub async fn vote_poll(
    Extension(app_state): Extension<AppState>,
    session: Session,
    Path(poll_id): Path<String>,
    Json(vote_req): Json<VoteRequest>,
) -> Result<impl IntoResponse, WebauthnError> {
    let user_id = is_authenticated(&session).await?;
    let poll_id = ObjectId::parse_str(&poll_id).map_err(|_| WebauthnError::InvalidInput("Invalid poll ID".into()))?;

    let poll_collection = app_state.db.collection::<Poll>("polls");
    let vote_collection = app_state.db.collection::<Vote>("votes");

    if vote_collection.find_one(doc! { "poll_id": &poll_id, "user_id": &user_id }, None).await
        .map_err(|_| WebauthnError::DatabaseError)?.is_some() {
        return Err(WebauthnError::InvalidInput("User already voted".into()));
    }

    let poll = poll_collection.find_one(doc! { "_id": &poll_id }, None).await
        .map_err(|_| WebauthnError::DatabaseError)?
        .ok_or(WebauthnError::UserNotFound)?;

    if poll.is_closed {
        return Err(WebauthnError::InvalidInput("Poll is closed".into()));
    }

    let _ = poll.options.iter().find(|opt| opt.id == vote_req.option_id)
        .ok_or(WebauthnError::InvalidInput("Invalid option ID".into()))?;

    let vote = Vote {
        id: None,
        poll_id,
        user_id,
        option_id: vote_req.option_id.clone(),
        voted_at: DateTime::now(),
    };
    vote_collection.insert_one(vote, None).await
        .map_err(|_| WebauthnError::DatabaseError)?;

    poll_collection.update_one(
        doc! { "_id": &poll_id, "options.id": &vote_req.option_id },
        doc! { "$inc": { "options.$.votes": 1, "total_votes": 1 } },
        None,
    ).await.map_err(|_| WebauthnError::DatabaseError)?;

    Ok(StatusCode::OK)
}

pub async fn close_poll(
    Extension(app_state): Extension<AppState>,
    session: Session,
    Path(poll_id): Path<String>,
) -> Result<impl IntoResponse, WebauthnError> {
    let user_id = is_authenticated(&session).await?;
    let poll_id = ObjectId::parse_str(&poll_id).map_err(|_| WebauthnError::InvalidInput("Invalid poll ID".into()))?;

    let poll_collection = app_state.db.collection::<Poll>("polls");
    let poll = poll_collection.find_one(doc! { "_id": &poll_id }, None).await
        .map_err(|_| WebauthnError::DatabaseError)?
        .ok_or(WebauthnError::UserNotFound)?;

    if poll.creator_id != user_id {
        return Err(WebauthnError::Unauthenticated);
    }

    poll_collection.update_one(
        doc! { "_id": &poll_id },
        doc! { "$set": { "is_closed": true } },
        None,
    ).await.map_err(|_| WebauthnError::DatabaseError)?;

    Ok(StatusCode::OK)
}

pub async fn reset_poll(
    Extension(app_state): Extension<AppState>,
    session: Session,
    Path(poll_id): Path<String>,
) -> Result<impl IntoResponse, WebauthnError> {
    let user_id = is_authenticated(&session).await?;
    let poll_id = ObjectId::parse_str(&poll_id).map_err(|_| WebauthnError::InvalidInput("Invalid poll ID".into()))?;

    let poll_collection = app_state.db.collection::<Poll>("polls");
    let vote_collection = app_state.db.collection::<Vote>("votes");

    let poll = poll_collection.find_one(doc! { "_id": &poll_id }, None).await
        .map_err(|_| WebauthnError::DatabaseError)?
        .ok_or(WebauthnError::UserNotFound)?;

    if poll.creator_id != user_id {
        return Err(WebauthnError::Unauthenticated);
    }

    poll_collection.update_one(
        doc! { "_id": &poll_id },
        doc! { "$set": { "options.$[].votes": 0, "total_votes": 0 } },
        None,
    ).await.map_err(|_| WebauthnError::DatabaseError)?;

    vote_collection.delete_many(doc! { "poll_id": &poll_id }, None).await
        .map_err(|_| WebauthnError::DatabaseError)?;

    Ok(StatusCode::OK)
}

pub async fn poll_results(
    Extension(app_state): Extension<AppState>,
    Path(poll_id): Path<String>,
) -> Result<Sse<impl futures::Stream<Item = Result<axum::response::sse::Event, WebauthnError>>>, WebauthnError> {
    let poll_id = ObjectId::parse_str(&poll_id).map_err(|_| WebauthnError::InvalidInput("Invalid poll ID".into()))?;
    let poll_collection = app_state.db.collection::<Poll>("polls");

    let stream = stream! {
        loop {
            let poll = poll_collection.find_one(doc! { "_id": &poll_id }, None).await
                .map_err(|_| WebauthnError::DatabaseError)?
                .ok_or(WebauthnError::UserNotFound)?;

            let now = Utc::now();
            let created_at = chrono::DateTime::<Utc>::from_timestamp(poll.created_at.timestamp_millis() / 1000, 0)
                .unwrap_or(now);
            let duration = now - created_at;
            let time_since_creation = format!("{}s", duration.num_seconds());

            let stats = PollStatistics {
                total_votes: poll.total_votes,
                options_data: poll.options.iter().map(|opt| OptionStatistics {
                    id: opt.id.clone(),
                    text: opt.text.clone(),
                    votes: opt.votes,
                    percentage: if poll.total_votes > 0 { (opt.votes as f64 / poll.total_votes as f64) * 100.0 } else { 0.0 },
                }).collect(),
                created_at: poll.created_at.to_string(),
                time_since_creation,
            };

            yield Ok(axum::response::sse::Event::default()
                .data(serde_json::to_string(&stats).unwrap()));
            tokio::time::sleep(Duration::from_secs(1)).await;
        }
    };

    Ok(Sse::new(stream))
}

pub fn routes() -> Router {
    Router::new()
        .route("/api/polls", get(get_polls).post(create_poll))
        .route("/api/polls/:pollId", get(get_poll))
        .route("/api/polls/:pollId/vote", post(vote_poll))
        .route("/api/polls/:pollId/close", post(close_poll))
        .route("/api/polls/:pollId/reset", post(reset_poll))
        .route("/api/polls/:pollId/results", get(poll_results))
}