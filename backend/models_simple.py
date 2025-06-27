"""
Simplified models that match the actual database schema
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    subdomain = Column(String(100), unique=True, nullable=False, index=True)
    domain = Column(String(255))
    logo_url = Column(String(500))
    contact_email = Column(String(255))
    contact_phone = Column(String(50))
    address = Column(Text)
    plan = Column(String(50), default="free")
    status = Column(String(50), default="active")
    max_menu_items = Column(Integer, default=50)
    max_categories = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="tenant")
    categories = relationship("Category", back_populates="tenant")
    menu_items = relationship("MenuItem", back_populates="tenant")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="admin")
    is_active = Column(Boolean, default=True)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="users")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="categories")
    menu_items = relationship("MenuItem", back_populates="category")

class MenuItem(Base):
    __tablename__ = "menu_items"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    name = Column(String(255), nullable=False)
    price = Column(String(50))
    description = Column(Text)
    image = Column(String(500))
    calories = Column(Integer, default=0)
    preparation_time = Column(Integer)
    is_available = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    
    # Basic dietary flags
    halal = Column(Boolean, default=True)
    vegetarian = Column(Boolean, default=False)
    vegan = Column(Boolean, default=False)
    gluten_free = Column(Boolean, default=False)
    dairy_free = Column(Boolean, default=False)
    nut_free = Column(Boolean, default=False)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="menu_items")
    category = relationship("Category", back_populates="menu_items")

class Settings(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), unique=True, nullable=False)
    currency = Column(String(10), default="SAR")
    tax_rate = Column(Float, default=15.0)
    language = Column(String(10), default="en")
    primary_color = Column(String(7), default="#00594f")
    secondary_color = Column(String(7), default="#d4af37")
    font_family = Column(String(100), default="Playfair Display")
    footer_enabled = Column(Boolean, default=True)
    footer_text_en = Column(Text)
    footer_text_ar = Column(Text)
    instagram_handle = Column(String(100))
    facebook_url = Column(String(255))
    twitter_handle = Column(String(100))
    website_url = Column(String(255))
    show_calories = Column(Boolean, default=True)
    show_preparation_time = Column(Boolean, default=True)
    show_allergens = Column(Boolean, default=True)
    enable_search = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", uselist=False)

class AllergenIcon(Base):
    __tablename__ = "allergen_icons"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    name = Column(String(50), nullable=False)
    display_name = Column(String(100))
    display_name_ar = Column(String(100))
    icon_url = Column(String(500))

class ItemAllergen(Base):
    __tablename__ = "item_allergens"
    
    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    allergen_name = Column(String(50), nullable=False)