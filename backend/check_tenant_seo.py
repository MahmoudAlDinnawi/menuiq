#!/usr/bin/env python3
"""
Script to check SEO-related fields for tenant_id=2 in the database.

This script connects to the database and queries the Settings table
to verify if SEO data is properly saved for the tenant.
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import Tenant, Settings

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost/menuiq_dev")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_tenant_seo(tenant_id=2):
    """Check SEO fields for a specific tenant."""
    db = SessionLocal()
    
    try:
        # Query tenant information
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        
        if not tenant:
            print(f"Tenant with id={tenant_id} not found!")
            return
        
        print(f"=== Tenant Information ===")
        print(f"ID: {tenant.id}")
        print(f"Name: {tenant.name}")
        print(f"Subdomain: {tenant.subdomain}")
        print(f"Logo URL: {tenant.logo_url}")
        print()
        
        # Query settings for the tenant
        settings = db.query(Settings).filter(Settings.tenant_id == tenant_id).first()
        
        if not settings:
            print(f"No settings found for tenant_id={tenant_id}")
            return
        
        print(f"=== SEO Settings for Tenant ID: {tenant_id} ===")
        print(f"Meta Title (EN): {settings.meta_title_en}")
        print(f"Meta Title (AR): {settings.meta_title_ar}")
        print(f"Meta Description (EN): {settings.meta_description_en}")
        print(f"Meta Description (AR): {settings.meta_description_ar}")
        print(f"Meta Keywords (EN): {settings.meta_keywords_en}")
        print(f"Meta Keywords (AR): {settings.meta_keywords_ar}")
        print(f"OG Image URL: {settings.og_image_url}")
        print()
        
        # Check if any SEO fields are populated
        seo_fields = [
            settings.meta_title_en,
            settings.meta_title_ar,
            settings.meta_description_en,
            settings.meta_description_ar,
            settings.meta_keywords_en,
            settings.meta_keywords_ar,
            settings.og_image_url
        ]
        
        populated_fields = sum(1 for field in seo_fields if field)
        print(f"SEO Fields Status: {populated_fields}/{len(seo_fields)} fields have data")
        
        # Additional useful settings
        print()
        print(f"=== Other Relevant Settings ===")
        print(f"Primary Color: {settings.primary_color}")
        print(f"Secondary Color: {settings.secondary_color}")
        print(f"Font Family: {settings.font_family}")
        print(f"Website URL: {settings.website_url}")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Default to tenant_id=2, but allow override from command line
    tenant_id = 2
    if len(sys.argv) > 1:
        try:
            tenant_id = int(sys.argv[1])
        except ValueError:
            print("Usage: python check_tenant_seo.py [tenant_id]")
            sys.exit(1)
    
    check_tenant_seo(tenant_id)