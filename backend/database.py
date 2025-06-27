from sqlalchemy import create_engine, Column, Integer, String, Boolean, Float, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:password@localhost/entrecote_menu"
)

# Create engine
engine = create_engine(DATABASE_URL, echo=True)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base
Base = declarative_base()

# Models
class MenuItem(Base):
    __tablename__ = "menu_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    name_ar = Column(String(255))
    price = Column(String(50), nullable=False)
    price_without_vat = Column(String(50))
    description = Column(Text, nullable=False)
    description_ar = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id"))
    image = Column(String(500))
    calories = Column(Integer, default=0)
    walk_minutes = Column(Integer, default=0)
    run_minutes = Column(Integer, default=0)
    high_sodium = Column(Boolean, default=False)
    gluten_free = Column(Boolean, default=False)
    dairy_free = Column(Boolean, default=False)
    nut_free = Column(Boolean, default=False)
    vegetarian = Column(Boolean, default=False)
    vegan = Column(Boolean, default=False)
    halal = Column(Boolean, default=True)
    contains_caffeine = Column(Boolean, default=False)
    spicy_level = Column(Integer, default=0)
    preparation_time = Column(Integer)
    serving_size = Column(String(100))
    # Nutrition label fields
    total_fat = Column(Float)
    saturated_fat = Column(Float)
    trans_fat = Column(Float)
    cholesterol = Column(Integer)
    sodium = Column(Integer)
    total_carbs = Column(Float)
    dietary_fiber = Column(Float)
    sugars = Column(Float)
    protein = Column(Float)
    vitamin_a = Column(Integer)  # % Daily Value
    vitamin_c = Column(Integer)  # % Daily Value
    calcium = Column(Integer)    # % Daily Value
    iron = Column(Integer)       # % Daily Value
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    category = relationship("Category", back_populates="items")
    allergens = relationship("ItemAllergen", back_populates="item", cascade="all, delete-orphan")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    value = Column(String(50), unique=True, nullable=False)
    label = Column(String(100), nullable=False)
    label_ar = Column(String(100))
    icon = Column(String(50))
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    items = relationship("MenuItem", back_populates="category")

class ItemAllergen(Base):
    __tablename__ = "item_allergens"
    
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("menu_items.id"))
    allergen = Column(String(50), nullable=False)
    
    # Relationships
    item = relationship("MenuItem", back_populates="allergens")

class AllergenIcon(Base):
    __tablename__ = "allergen_icons"
    
    id = Column(Integer, primary_key=True, index=True)
    allergen_name = Column(String(50), unique=True, nullable=False)
    icon_path = Column(String(500), nullable=False)
    display_name = Column(String(100))
    display_name_ar = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Settings(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(50), unique=True, nullable=False)
    value = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
Base.metadata.create_all(bind=engine)