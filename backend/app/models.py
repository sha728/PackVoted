# backend/app/models.py
from sqlalchemy import Column, String, DateTime, JSON, Float, Integer, ForeignKey, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
class TripStatus(PyEnum):
    CREATED = "created"
    FORMS_SENT = "forms_sent"
    COLLECTING = "collecting_preferences"
    GENERATING = "generating_recommendations"
    VOTING = "voting"
    SELECTED = "destination_selected"
    ITINERARY_GENERATED = "itinerary_generated"
    COMPLETED = "completed"

class Trip(Base):
    __tablename__ = "trips"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    creator_email = Column(String, nullable=False)
    creator_name = Column(String)
    status = Column(Enum(TripStatus), default=TripStatus.CREATED)
    
    # Trip details
    date_start = Column(DateTime)
    date_end = Column(DateTime)
    duration_days = Column(Integer)
    budget_min = Column(Float)
    budget_max = Column(Float)
    
    # Results
    recommendations = Column(JSON, default=list)
    selected_destination = Column(JSON)
    itinerary = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    creator = relationship("User", backref="created_trips")
    participants = relationship("Participant", back_populates="trip", cascade="all, delete-orphan")

class Participant(Base):
    __tablename__ = "participants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id"))
    email = Column(String, nullable=False)
    name = Column(String)
    
    # Form access
    form_token = Column(String, unique=True, index=True)
    form_completed = Column(Boolean, default=False)
    form_completed_at = Column(DateTime)
    
    # Preferences (stored as submitted)
    budget_ceiling = Column(Float)
    budget_floor = Column(Float)
    date_flexibility_days = Column(Integer, default=0)
    avoided_destinations = Column(ARRAY(String))
    required_vibes = Column(ARRAY(String))
    avoided_vibes = Column(ARRAY(String))
    accessibility_needs = Column(ARRAY(String))
    
    climate_preference = Column(String)  # hot, warm, mild, cold, snow
    activity_level = Column(Float)  # 0-1
    culture_nature_balance = Column(Float)  # 0-1
    food_importance = Column(Float)  # 0-1
    nightlife_importance = Column(Float)  # 0-1
    
    # Weights for scoring
    weights = Column(JSON, default=lambda: {"budget": 0.25, "weather": 0.25, "activities": 0.25, "vibe": 0.25})
    
    trip = relationship("Trip", back_populates="participants")
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    user = relationship("User", backref="participations")