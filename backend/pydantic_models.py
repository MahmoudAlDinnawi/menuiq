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
    # Upsell fields
    is_upsell: bool = False
    upsell_style: Optional[str] = 'standard'
    upsell_border_color: Optional[str] = None
    upsell_background_color: Optional[str] = None
    upsell_badge_text: Optional[str] = None
    upsell_badge_color: Optional[str] = None
    upsell_animation: Optional[str] = None
    upsell_icon: Optional[str] = None

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
    # Upsell fields
    is_upsell: Optional[bool] = None
    upsell_style: Optional[str] = None
    upsell_border_color: Optional[str] = None
    upsell_background_color: Optional[str] = None
    upsell_badge_text: Optional[str] = None
    upsell_badge_color: Optional[str] = None
    upsell_animation: Optional[str] = None
    upsell_icon: Optional[str] = None
    # Multi-item fields
    is_multi_item: Optional[bool] = None
    parent_item_id: Optional[int] = None
    display_as_grid: Optional[bool] = None
    sub_item_order: Optional[int] = None
    sub_items: Optional[List[dict]] = None

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
    # Upsell fields
    is_upsell: bool = False
    upsell_style: Optional[str] = 'standard'
    upsell_border_color: Optional[str] = None
    upsell_background_color: Optional[str] = None
    upsell_badge_text: Optional[str] = None
    upsell_badge_color: Optional[str] = None
    upsell_animation: Optional[str] = None
    upsell_icon: Optional[str] = None
    # Multi-item fields
    is_multi_item: bool = False
    parent_item_id: Optional[int] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    display_as_grid: bool = True
    sub_item_order: int = 0
    sub_items: List['MenuItemResponse'] = []

    class Config:
        from_attributes = True

# Enable forward references
MenuItemResponse.model_rebuild()

# Category Models
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    description_ar: Optional[str] = None
    image_url: Optional[str] = None
    hero_image: Optional[str] = None
    icon: Optional[str] = None
    color_theme: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False
    display_style: Optional[str] = 'grid'
    sort_order: int = 0
    value: Optional[str] = None
    label: Optional[str] = None
    label_ar: Optional[str] = None
    meta_keywords: Optional[str] = None
    meta_description: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    description_ar: Optional[str] = None
    image_url: Optional[str] = None
    hero_image: Optional[str] = None
    icon: Optional[str] = None
    color_theme: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    display_style: Optional[str] = None
    sort_order: Optional[int] = None
    value: Optional[str] = None
    label: Optional[str] = None
    label_ar: Optional[str] = None
    meta_keywords: Optional[str] = None
    meta_description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: int
    tenant_id: int
    name: str
    description: Optional[str] = None
    description_ar: Optional[str] = None
    image_url: Optional[str] = None
    hero_image: Optional[str] = None
    icon: Optional[str] = None
    color_theme: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False
    display_style: Optional[str] = 'grid'
    sort_order: int
    value: Optional[str] = None
    label: Optional[str] = None
    label_ar: Optional[str] = None
    meta_keywords: Optional[str] = None
    meta_description: Optional[str] = None
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
    # Upsell settings
    upsell_enabled: Optional[bool] = None
    upsell_default_style: Optional[str] = None
    upsell_default_border_color: Optional[str] = None
    upsell_default_background_color: Optional[str] = None
    upsell_default_badge_color: Optional[str] = None
    upsell_default_animation: Optional[str] = None
    upsell_default_icon: Optional[str] = None

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
    # Upsell settings
    upsell_enabled: bool = True
    upsell_default_style: str = 'premium'
    upsell_default_border_color: str = '#FFD700'
    upsell_default_background_color: str = '#FFF8DC'
    upsell_default_badge_color: str = '#FF6B6B'
    upsell_default_animation: str = 'pulse'
    upsell_default_icon: str = 'star'
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


# FlowIQ Models
class FlowStepOptionCreate(BaseModel):
    text_ar: str
    text_en: Optional[str] = None
    next_step_id: Optional[int] = None
    action: Optional[str] = None  # go_to_menu, go_to_category:id, etc.

class FlowStepCreate(BaseModel):
    step_type: str  # text, question
    order_position: int
    content_ar: str
    content_en: Optional[str] = None
    image_url: Optional[str] = None
    animation_type: str = "fade_in"
    animation_duration: int = 500
    delay_before: int = 0
    
    # For text type
    auto_advance: bool = True
    auto_advance_delay: int = 3000
    default_next_step_id: Optional[int] = None
    
    # For question type - up to 4 options
    option1: Optional[FlowStepOptionCreate] = None
    option2: Optional[FlowStepOptionCreate] = None
    option3: Optional[FlowStepOptionCreate] = None
    option4: Optional[FlowStepOptionCreate] = None

class FlowStepUpdate(BaseModel):
    step_type: Optional[str] = None
    order_position: Optional[int] = None
    content_ar: Optional[str] = None
    content_en: Optional[str] = None
    image_url: Optional[str] = None
    animation_type: Optional[str] = None
    animation_duration: Optional[int] = None
    delay_before: Optional[int] = None
    auto_advance: Optional[bool] = None
    auto_advance_delay: Optional[int] = None
    default_next_step_id: Optional[int] = None
    option1: Optional[FlowStepOptionCreate] = None
    option2: Optional[FlowStepOptionCreate] = None
    option3: Optional[FlowStepOptionCreate] = None
    option4: Optional[FlowStepOptionCreate] = None

class FlowStepResponse(BaseModel):
    id: int
    flow_id: int
    step_type: str
    order_position: int
    content_ar: str
    content_en: Optional[str]
    image_url: Optional[str]
    animation_type: str
    animation_duration: int
    delay_before: int
    
    # For text type
    auto_advance: bool
    auto_advance_delay: int
    default_next_step_id: Optional[int]
    
    # For question type
    option1_text_ar: Optional[str]
    option1_text_en: Optional[str]
    option1_next_step_id: Optional[int]
    option1_action: Optional[str]
    
    option2_text_ar: Optional[str]
    option2_text_en: Optional[str]
    option2_next_step_id: Optional[int]
    option2_action: Optional[str]
    
    option3_text_ar: Optional[str]
    option3_text_en: Optional[str]
    option3_next_step_id: Optional[int]
    option3_action: Optional[str]
    
    option4_text_ar: Optional[str]
    option4_text_en: Optional[str]
    option4_next_step_id: Optional[int]
    option4_action: Optional[str]
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class FlowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True
    is_default: bool = False
    trigger_type: str = "manual"  # manual, on_load, on_idle
    trigger_delay: int = 0
    steps: List[FlowStepCreate] = []

class FlowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    trigger_type: Optional[str] = None
    trigger_delay: Optional[int] = None

class FlowResponse(BaseModel):
    id: int
    tenant_id: int
    name: str
    description: Optional[str]
    is_active: bool
    is_default: bool
    trigger_type: str
    trigger_delay: int
    created_at: datetime
    updated_at: datetime
    steps: List[FlowStepResponse] = []
    
    class Config:
        from_attributes = True

class FlowInteractionPath(BaseModel):
    step_id: int
    timestamp: datetime
    option_selected: Optional[int] = None

class FlowInteractionCreate(BaseModel):
    flow_id: int
    session_id: str
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None

class FlowInteractionUpdate(BaseModel):
    completed_at: Optional[datetime] = None
    is_completed: bool = False
    last_step_id: Optional[int] = None
    steps_path: List[FlowInteractionPath] = []

class FlowInteractionResponse(BaseModel):
    id: int
    flow_id: int
    tenant_id: int
    session_id: str
    user_agent: Optional[str]
    ip_address: Optional[str]
    device_type: Optional[str]
    browser: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]
    is_completed: bool
    last_step_id: Optional[int]
    steps_path: Optional[List[dict]]
    created_at: datetime
    
    class Config:
        from_attributes = True