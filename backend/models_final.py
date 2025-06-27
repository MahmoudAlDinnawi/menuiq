"""
Final models that match the updated database schema and frontend requirements
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, DECIMAL, JSON
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
    trial_ends_at = Column(DateTime)
    subscription_ends_at = Column(DateTime)
    max_menu_items = Column(Integer, default=50)
    max_categories = Column(Integer, default=10)
    custom_domain_enabled = Column(Boolean, default=False)
    analytics_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="tenant", cascade="all, delete-orphan")
    menu_items = relationship("MenuItem", back_populates="tenant", cascade="all, delete-orphan")
    settings = relationship("Settings", back_populates="tenant", uselist=False, cascade="all, delete-orphan")
    allergen_icons = relationship("AllergenIcon", back_populates="tenant", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="admin")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="users")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    # Frontend compatibility fields
    value = Column(String(100))  # Used as category identifier in frontend
    label = Column(String(255))  # English display name
    label_ar = Column(String(255))  # Arabic display name
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="categories")
    menu_items = relationship("MenuItem", back_populates="category")

class MenuItem(Base):
    __tablename__ = "menu_items"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    
    # Basic info - matching frontend expectations
    name = Column(String(255), nullable=False)
    name_ar = Column(String(255))  # Arabic name
    description = Column(Text)
    description_ar = Column(Text)  # Arabic description
    price = Column(DECIMAL(10, 2))
    price_without_vat = Column(DECIMAL(10, 2))
    image = Column(String(500))  # Changed from image_url to match frontend
    
    # Availability and features
    is_available = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    is_spicy = Column(Boolean, default=False)
    spicy_level = Column(Integer, default=0)  # Changed from spice_level
    
    # Dietary flags - matching frontend field names
    halal = Column(Boolean, default=True)  # Changed from is_halal
    vegetarian = Column(Boolean, default=False)  # Changed from is_vegetarian
    vegan = Column(Boolean, default=False)  # Changed from is_vegan
    gluten_free = Column(Boolean, default=False)  # Changed from is_gluten_free
    dairy_free = Column(Boolean, default=False)  # Changed from is_dairy_free
    nut_free = Column(Boolean, default=False)  # Changed from is_nut_free
    
    # Warnings
    high_sodium = Column(Boolean, default=False)
    contains_caffeine = Column(Boolean, default=False)
    
    # Time and exercise info
    preparation_time = Column(Integer)
    walk_minutes = Column(Integer)  # Minutes of walking to burn calories
    run_minutes = Column(Integer)  # Minutes of running to burn calories
    
    # Basic nutrition
    calories = Column(Integer)
    serving_size = Column(String(100))
    ingredients = Column(Text)
    
    # Detailed nutrition
    total_fat = Column(DECIMAL(5, 2))
    saturated_fat = Column(DECIMAL(5, 2))
    trans_fat = Column(DECIMAL(5, 2))
    cholesterol = Column(Integer)
    sodium = Column(Integer)
    total_carbs = Column(DECIMAL(5, 2))
    dietary_fiber = Column(DECIMAL(5, 2))
    sugars = Column(DECIMAL(5, 2))
    protein = Column(DECIMAL(5, 2))
    vitamin_a = Column(Integer)  # Percentage
    vitamin_c = Column(Integer)  # Percentage
    calcium = Column(Integer)  # Percentage
    iron = Column(Integer)  # Percentage
    
    # Additional data
    nutritional_info = Column(JSON)  # For any extra nutrition data
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="menu_items")
    category = relationship("Category", back_populates="menu_items")
    allergens = relationship("ItemAllergen", back_populates="menu_item", cascade="all, delete-orphan")

    @property
    def category_value(self):
        """Get category value for frontend compatibility"""
        return self.category.value if self.category else None

class ItemAllergen(Base):
    __tablename__ = "item_allergens"
    
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    allergen_name = Column(String(50), nullable=False)
    
    # Relationships
    menu_item = relationship("MenuItem", back_populates="allergens")

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
    tenant = relationship("Tenant", back_populates="settings")

class AllergenIcon(Base):
    __tablename__ = "allergen_icons"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    name = Column(String(50), nullable=False)
    display_name = Column(String(100))
    display_name_ar = Column(String(100))
    icon_url = Column(String(500))
    
    # Relationships
    tenant = relationship("Tenant", back_populates="allergen_icons")

class SystemAdmin(Base):
    __tablename__ = "system_admins"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_super_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)

class ActivityLog(Base):
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