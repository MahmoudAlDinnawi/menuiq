from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Tenant(Base):
    """Restaurant tenant in the system"""
    __tablename__ = "tenants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    subdomain = Column(String(100), unique=True, nullable=False, index=True)
    domain = Column(String(255))  # Custom domain if they have one
    logo_url = Column(String(500))
    contact_email = Column(String(255))
    contact_phone = Column(String(50))
    address = Column(Text)
    
    # Subscription info
    plan = Column(String(50), default="free")  # free, basic, premium, enterprise
    status = Column(String(50), default="active")  # active, suspended, cancelled
    trial_ends_at = Column(DateTime)
    subscription_ends_at = Column(DateTime)
    
    # Features
    max_menu_items = Column(Integer, default=50)
    max_categories = Column(Integer, default=10)
    custom_domain_enabled = Column(Boolean, default=False)
    analytics_enabled = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="tenant", cascade="all, delete-orphan")
    menu_items = relationship("MenuItem", back_populates="tenant", cascade="all, delete-orphan")
    settings = relationship("Settings", back_populates="tenant", uselist=False, cascade="all, delete-orphan")
    allergen_icons = relationship("AllergenIcon", back_populates="tenant", cascade="all, delete-orphan")

class User(Base):
    """Users for each tenant"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="admin")  # admin, editor, viewer
    is_active = Column(Boolean, default=True)
    
    # Timestamps (optional - may not exist in all databases)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=True)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="users")

class SystemAdmin(Base):
    """System administrators for MenuIQ platform"""
    __tablename__ = "system_admins"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_super_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)

class Category(Base):
    """Menu categories for each tenant"""
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    value = Column(String(50), nullable=False)
    label = Column(String(100), nullable=False)
    label_ar = Column(String(100))
    icon = Column(String(50))
    sort_order = Column(Integer, default=0)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="categories")
    menu_items = relationship("MenuItem", back_populates="category")

class MenuItem(Base):
    """Menu items for each tenant"""
    __tablename__ = "menu_items"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    
    # Basic info
    name = Column(String(255), nullable=False)
    name_ar = Column(String(255))
    price = Column(String(50))
    price_without_vat = Column(String(50))
    description = Column(Text)
    description_ar = Column(Text)
    image = Column(String(500))
    
    # Nutrition info
    calories = Column(Integer, default=0)
    walk_minutes = Column(Integer)
    run_minutes = Column(Integer)
    preparation_time = Column(Integer)
    serving_size = Column(String(100))
    
    # Dietary info
    halal = Column(Boolean, default=True)
    vegetarian = Column(Boolean, default=False)
    vegan = Column(Boolean, default=False)
    gluten_free = Column(Boolean, default=False)
    dairy_free = Column(Boolean, default=False)
    nut_free = Column(Boolean, default=False)
    high_sodium = Column(Boolean, default=False)
    contains_caffeine = Column(Boolean, default=False)
    spicy_level = Column(Integer, default=0)
    
    # Nutrition label
    total_fat = Column(Float)
    saturated_fat = Column(Float)
    trans_fat = Column(Float)
    cholesterol = Column(Integer)
    sodium = Column(Integer)
    total_carbs = Column(Float)
    dietary_fiber = Column(Float)
    sugars = Column(Float)
    protein = Column(Float)
    vitamin_a = Column(Integer)
    vitamin_c = Column(Integer)
    calcium = Column(Integer)
    iron = Column(Integer)
    
    # Status
    is_available = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="menu_items")
    category = relationship("Category", back_populates="menu_items")
    allergens = relationship("ItemAllergen", back_populates="menu_item", cascade="all, delete-orphan")

class ItemAllergen(Base):
    """Allergens for menu items"""
    __tablename__ = "item_allergens"
    
    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    allergen_name = Column(String(50), nullable=False)
    
    # Relationships
    menu_item = relationship("MenuItem", back_populates="allergens")

class Settings(Base):
    """Settings for each tenant"""
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), unique=True, nullable=False)
    
    # Display settings
    currency = Column(String(10), default="SAR")
    tax_rate = Column(Float, default=15.0)
    language = Column(String(10), default="en")
    
    # Theme settings
    primary_color = Column(String(7), default="#00594f")
    secondary_color = Column(String(7), default="#d4af37")
    font_family = Column(String(100), default="Playfair Display")
    
    # Footer settings
    footer_enabled = Column(Boolean, default=True)
    footer_text_en = Column(Text)
    footer_text_ar = Column(Text)
    
    # Social media
    instagram_handle = Column(String(100))
    facebook_url = Column(String(255))
    twitter_handle = Column(String(100))
    website_url = Column(String(255))
    
    # Features
    show_calories = Column(Boolean, default=True)
    show_preparation_time = Column(Boolean, default=True)
    show_allergens = Column(Boolean, default=True)
    enable_search = Column(Boolean, default=True)
    
    # Timestamps
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="settings")

class AllergenIcon(Base):
    """Custom allergen icons for each tenant"""
    __tablename__ = "allergen_icons"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    name = Column(String(50), nullable=False)
    display_name = Column(String(100))
    display_name_ar = Column(String(100))
    icon_url = Column(String(500))
    
    # Relationships
    tenant = relationship("Tenant", back_populates="allergen_icons")

class ActivityLog(Base):
    """Activity logs for system admins"""
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    admin_id = Column(Integer, ForeignKey("system_admins.id"))
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    details = Column(JSON)
    ip_address = Column(String(45))
    created_at = Column(DateTime, default=datetime.utcnow)