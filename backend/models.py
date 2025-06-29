"""
Enhanced models for the modern menu card system with rich content support
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, DECIMAL, JSON, Date, Table, Numeric
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# Association table for many-to-many relationship between items and allergens
item_allergens = Table('item_allergens', Base.metadata,
    Column('item_id', Integer, ForeignKey('menu_items.id', ondelete='CASCADE')),
    Column('allergen_id', Integer, ForeignKey('allergen_icons.id', ondelete='CASCADE'))
)

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
    email = Column(String(255), nullable=False)  # Removed unique=True
    username = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="admin")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="users")

class SystemAdmin(Base):
    __tablename__ = "system_admins"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_super_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    description_ar = Column(Text)
    image_url = Column(String(500))
    hero_image = Column(String(500))
    icon = Column(String(50))
    color_theme = Column(String(7))
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    display_style = Column(String(50), default='grid')
    sort_order = Column(Integer, default=0)
    # Frontend compatibility fields
    value = Column(String(100))
    label = Column(String(255))
    label_ar = Column(String(255))
    # SEO fields
    meta_keywords = Column(Text)
    meta_description = Column(Text)
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
    
    # Basic info
    name = Column(String(255), nullable=False)
    name_ar = Column(String(255))
    description = Column(Text)
    description_ar = Column(Text)
    price = Column(DECIMAL(10, 2))
    price_without_vat = Column(DECIMAL(10, 2))
    promotion_price = Column(DECIMAL(10, 2))
    image = Column(String(500))
    video_url = Column(String(500))
    ar_model_url = Column(String(500))
    
    # Badges and highlights
    badge_text = Column(String(50))
    badge_color = Column(String(7))
    highlight_message = Column(Text)
    
    # Availability and features
    is_available = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    is_spicy = Column(Boolean, default=False)
    spicy_level = Column(Integer, default=0)
    signature_dish = Column(Boolean, default=False)
    instagram_worthy = Column(Boolean, default=False)
    limited_availability = Column(Boolean, default=False)
    pre_order_required = Column(Boolean, default=False)
    min_order_quantity = Column(Integer, default=1)
    max_daily_orders = Column(Integer)
    
    # Dietary flags
    halal = Column(Boolean, default=True)
    vegetarian = Column(Boolean, default=False)
    vegan = Column(Boolean, default=False)
    gluten_free = Column(Boolean, default=False)
    dairy_free = Column(Boolean, default=False)
    nut_free = Column(Boolean, default=False)
    organic_certified = Column(Boolean, default=False)
    local_ingredients = Column(Boolean, default=False)
    fair_trade = Column(Boolean, default=False)
    
    # Warnings
    high_sodium = Column(Boolean, default=False)
    contains_caffeine = Column(Boolean, default=False)
    
    # Culinary details
    cooking_method = Column(String(100))
    origin_country = Column(String(100))
    texture_notes = Column(String(255))
    flavor_profile = Column(String(255))
    plating_style = Column(String(100))
    recommended_time = Column(String(100))
    seasonal_availability = Column(String(100))
    portion_size = Column(String(100))
    
    # Pairing suggestions
    pairing_suggestions = Column(Text)
    wine_pairing = Column(String(255))
    beer_pairing = Column(String(255))
    cocktail_pairing = Column(String(255))
    mocktail_pairing = Column(String(255))
    chef_notes = Column(Text)
    customization_options = Column(Text)
    
    # Time and exercise info
    preparation_time = Column(Integer)
    walk_minutes = Column(Integer)
    run_minutes = Column(Integer)
    
    # Nutrition
    calories = Column(Integer)
    serving_size = Column(String(100))
    ingredients = Column(Text)
    total_fat = Column(DECIMAL(5, 2))
    saturated_fat = Column(DECIMAL(5, 2))
    trans_fat = Column(DECIMAL(5, 2))
    cholesterol = Column(Integer)
    sodium = Column(Integer)
    total_carbs = Column(DECIMAL(5, 2))
    dietary_fiber = Column(DECIMAL(5, 2))
    sugars = Column(DECIMAL(5, 2))
    protein = Column(DECIMAL(5, 2))
    vitamin_a = Column(Integer)
    vitamin_c = Column(Integer)
    vitamin_d = Column(Integer)
    calcium = Column(Integer)
    iron = Column(Integer)
    caffeine_mg = Column(Integer)  # Caffeine content in milligrams
    nutritional_info = Column(JSON)
    
    # Sustainability
    carbon_footprint = Column(String(50))
    sustainability_info = Column(Text)
    
    # Recognition and ratings
    michelin_recommended = Column(Boolean, default=False)
    award_winning = Column(Boolean, default=False)
    customer_rating = Column(DECIMAL(2, 1))
    review_count = Column(Integer, default=0)
    best_seller_rank = Column(Integer)
    reorder_rate = Column(DECIMAL(3, 1))
    reward_points = Column(Integer, default=0)
    
    # Related items
    pairs_well_with = Column(JSONB)
    similar_items = Column(JSONB)
    tags = Column(JSONB)
    
    # Promotions
    promotion_start_date = Column(Date)
    promotion_end_date = Column(Date)
    
    # Metadata
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="menu_items")
    category = relationship("Category", back_populates="menu_items")
    allergens = relationship("AllergenIcon", secondary=item_allergens, back_populates="menu_items")
    images = relationship("MenuItemImage", back_populates="menu_item", cascade="all, delete-orphan")
    reviews = relationship("MenuItemReview", back_populates="menu_item", cascade="all, delete-orphan")
    certifications = relationship("DietaryCertification", back_populates="menu_item", cascade="all, delete-orphan")
    preparation_steps = relationship("PreparationStep", back_populates="menu_item", cascade="all, delete-orphan")

    @property
    def category_value(self):
        """Get category value for frontend compatibility"""
        return self.category.value if self.category else None
    
    @property
    def average_rating(self):
        """Calculate average rating from reviews"""
        if not self.reviews:
            return None
        total = sum(review.rating for review in self.reviews)
        return round(total / len(self.reviews), 1)

class MenuItemImage(Base):
    __tablename__ = "menu_item_images"
    
    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    caption = Column(String(255))
    caption_ar = Column(String(255))
    is_primary = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    menu_item = relationship("MenuItem", back_populates="images")

class MenuItemReview(Base):
    __tablename__ = "menu_item_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    customer_name = Column(String(100))
    rating = Column(Integer, nullable=False)
    review_text = Column(Text)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    menu_item = relationship("MenuItem", back_populates="reviews")

class DietaryCertification(Base):
    __tablename__ = "dietary_certifications"
    
    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    certification_type = Column(String(50), nullable=False)
    certifying_body = Column(String(100))
    certificate_number = Column(String(100))
    expiry_date = Column(Date)
    certificate_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    menu_item = relationship("MenuItem", back_populates="certifications")

class PreparationStep(Base):
    __tablename__ = "preparation_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    step_number = Column(Integer, nullable=False)
    description = Column(Text, nullable=False)
    description_ar = Column(Text)
    image_url = Column(String(500))
    time_minutes = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    menu_item = relationship("MenuItem", back_populates="preparation_steps")

class Settings(Base):
    __tablename__ = "settings"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, unique=True)
    
    # Basic settings
    currency = Column(String(10), default="SAR")
    tax_rate = Column(Float, default=15.0)
    language = Column(String(10), default="en")
    timezone = Column(String(50), default="Asia/Riyadh")
    
    # Display settings
    primary_color = Column(String(7), default="#00594f")
    secondary_color = Column(String(7), default="#d4af37")
    font_family = Column(String(100), default="Playfair Display")
    menu_layout = Column(String(50), default='cards')
    card_style = Column(String(50), default='modern')
    color_scheme = Column(String(50), default='elegant')
    animation_enabled = Column(Boolean, default=True)
    
    # Feature toggles
    enable_search = Column(Boolean, default=True)
    enable_reviews = Column(Boolean, default=True)
    enable_ratings = Column(Boolean, default=True)
    enable_nutritional_info = Column(Boolean, default=True)
    enable_allergen_info = Column(Boolean, default=True)
    enable_sustainability_info = Column(Boolean, default=False)
    enable_pairing_suggestions = Column(Boolean, default=True)
    enable_ar_preview = Column(Boolean, default=False)
    enable_video_preview = Column(Boolean, default=False)
    enable_loyalty_points = Column(Boolean, default=False)
    quick_view_enabled = Column(Boolean, default=True)
    comparison_enabled = Column(Boolean, default=False)
    wishlist_enabled = Column(Boolean, default=False)
    social_sharing_enabled = Column(Boolean, default=True)
    
    # Ordering settings
    whatsapp_ordering_enabled = Column(Boolean, default=False)
    whatsapp_number = Column(String(20))
    
    # Social media
    instagram_handle = Column(String(50))
    tiktok_handle = Column(String(50))
    website_url = Column(String(255))
    
    # Display toggles
    show_calories = Column(Boolean, default=True)
    show_preparation_time = Column(Boolean, default=True)
    show_allergens = Column(Boolean, default=True)
    show_price_without_vat = Column(Boolean, default=True)
    show_all_category = Column(Boolean, default=True)
    
    # Footer settings
    footer_enabled = Column(Boolean, default=True)
    footer_text_en = Column(Text)
    footer_text_ar = Column(Text)
    
    # Hero section settings
    hero_subtitle_en = Column(Text, default="Discover our exquisite selection of authentic French cuisine")
    hero_subtitle_ar = Column(Text, default="اكتشف تشكيلتنا الرائعة من الأطباق الفرنسية الأصيلة")
    footer_tagline_en = Column(Text, default="Authentic French dining experience in the heart of the Kingdom")
    footer_tagline_ar = Column(Text, default="تجربة طعام فرنسية أصيلة في قلب المملكة")
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
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
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="allergen_icons")
    menu_items = relationship("MenuItem", secondary=item_allergens, back_populates="allergens")

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
    user_agent = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)