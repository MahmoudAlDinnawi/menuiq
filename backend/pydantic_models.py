from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Menu Item Models
class MenuItemCreate(BaseModel):
    category_id: int
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    is_available: bool = True
    is_featured: bool = False
    is_vegetarian: bool = False
    is_vegan: bool = False
    is_gluten_free: bool = False
    is_spicy: bool = False
    spice_level: int = 0
    preparation_time: Optional[int] = None
    calories: Optional[int] = None
    serving_size: Optional[str] = None
    ingredients: Optional[str] = None
    nutritional_info: Optional[dict] = None
    sort_order: int = 0
    allergen_ids: List[int] = []

class MenuItemUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_vegetarian: Optional[bool] = None
    is_vegan: Optional[bool] = None
    is_gluten_free: Optional[bool] = None
    is_spicy: Optional[bool] = None
    spice_level: Optional[int] = None
    preparation_time: Optional[int] = None
    calories: Optional[int] = None
    serving_size: Optional[str] = None
    ingredients: Optional[str] = None
    nutritional_info: Optional[dict] = None
    sort_order: Optional[int] = None
    allergen_ids: Optional[List[int]] = None

class MenuItemResponse(BaseModel):
    id: int
    tenant_id: int
    category_id: int
    name: str
    description: Optional[str]
    price: Optional[float]
    image_url: Optional[str]
    is_available: bool = True
    is_featured: bool = False
    is_vegetarian: bool = False
    is_vegan: bool = False
    is_gluten_free: bool = False
    is_spicy: bool = False
    spice_level: int = 0
    preparation_time: Optional[int]
    calories: Optional[int]
    serving_size: Optional[str]
    ingredients: Optional[str]
    nutritional_info: Optional[dict]
    sort_order: int = 0
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    allergens: List[dict] = []

    class Config:
        from_attributes = True

# Category Models
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

class CategoryResponse(BaseModel):
    id: int
    tenant_id: int
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    sort_order: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# User Models
class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    role: str = "admin"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    tenant_id: int
    email: str
    username: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True

# Tenant Models
class TenantCreate(BaseModel):
    name: str
    subdomain: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    plan: str = "free"

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None
    plan: Optional[str] = None
    status: Optional[str] = None
    max_menu_items: Optional[int] = None
    max_categories: Optional[int] = None

class TenantResponse(BaseModel):
    id: int
    name: str
    subdomain: str
    domain: Optional[str]
    logo_url: Optional[str]
    contact_email: Optional[str]
    contact_phone: Optional[str]
    address: Optional[str]
    plan: str
    status: str
    max_menu_items: int
    max_categories: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# System Admin Models
class SystemAdminCreate(BaseModel):
    email: str
    username: str
    password: str

class SystemAdminLogin(BaseModel):
    email: str
    password: str

class SystemAdminResponse(BaseModel):
    id: int
    email: str
    username: str
    is_super_admin: bool
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        from_attributes = True

# Settings Models
class SettingsUpdate(BaseModel):
    currency: Optional[str] = None
    tax_rate: Optional[float] = None
    language: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    font_family: Optional[str] = None
    footer_enabled: Optional[bool] = None
    footer_text_en: Optional[str] = None
    footer_text_ar: Optional[str] = None
    hero_subtitle_en: Optional[str] = None
    hero_subtitle_ar: Optional[str] = None
    footer_tagline_en: Optional[str] = None
    footer_tagline_ar: Optional[str] = None
    instagram_handle: Optional[str] = None
    facebook_url: Optional[str] = None
    twitter_handle: Optional[str] = None
    website_url: Optional[str] = None
    show_calories: Optional[bool] = None
    show_preparation_time: Optional[bool] = None
    show_allergens: Optional[bool] = None
    show_all_category: Optional[bool] = None
    enable_search: Optional[bool] = None

class SettingsResponse(BaseModel):
    id: int
    tenant_id: int
    currency: str
    tax_rate: float
    language: str
    primary_color: str
    secondary_color: str
    font_family: str
    footer_enabled: bool
    footer_text_en: Optional[str]
    footer_text_ar: Optional[str]
    hero_subtitle_en: Optional[str]
    hero_subtitle_ar: Optional[str]
    footer_tagline_en: Optional[str]
    footer_tagline_ar: Optional[str]
    instagram_handle: Optional[str]
    facebook_url: Optional[str]
    twitter_handle: Optional[str]
    website_url: Optional[str]
    show_calories: bool
    show_preparation_time: bool
    show_allergens: bool
    show_all_category: bool
    enable_search: bool
    updated_at: datetime

    class Config:
        from_attributes = True

# Allergen Icon Models
class AllergenIconCreate(BaseModel):
    name: str
    display_name: Optional[str] = None
    icon_url: Optional[str] = None

class AllergenIconUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    display_name_ar: Optional[str] = None
    icon_url: Optional[str] = None

class AllergenIconResponse(BaseModel):
    id: int
    tenant_id: int
    name: str
    display_name: Optional[str]
    display_name_ar: Optional[str]
    icon_url: Optional[str]

    class Config:
        from_attributes = True

# Other Models
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str