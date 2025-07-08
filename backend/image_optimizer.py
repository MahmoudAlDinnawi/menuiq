"""
Image optimization module for MenuIQ
Handles async image processing, compression, and resizing
"""
from pathlib import Path
from typing import Optional, Tuple
from PIL import Image
import io
import asyncio
from concurrent.futures import ThreadPoolExecutor
import hashlib

# Thread pool for CPU-intensive image operations
executor = ThreadPoolExecutor(max_workers=4)

class ImageOptimizer:
    """Handles image optimization with compression and resizing"""
    
    # Maximum dimensions for different image types
    MAX_DIMENSIONS = {
        "menu_item": (1200, 1200),
        "logo": (500, 500),
        "thumbnail": (300, 300),
        "category": (800, 800)
    }
    
    # Quality settings
    QUALITY_SETTINGS = {
        "high": 85,
        "medium": 75,
        "low": 60
    }
    
    @staticmethod
    def calculate_file_hash(content: bytes) -> str:
        """Calculate SHA-256 hash of file content for deduplication"""
        return hashlib.sha256(content).hexdigest()
    
    @staticmethod
    def optimize_image_sync(
        image_bytes: bytes,
        image_type: str = "menu_item",
        quality: str = "medium",
        format: str = "JPEG"
    ) -> Tuple[bytes, dict]:
        """
        Synchronous image optimization function
        Returns optimized image bytes and metadata
        """
        # Open image from bytes
        img = Image.open(io.BytesIO(image_bytes))
        
        # Convert RGBA to RGB if saving as JPEG
        if format.upper() == "JPEG" and img.mode in ("RGBA", "LA", "P"):
            # Create white background
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
            img = background
        
        # Get max dimensions for image type
        max_width, max_height = ImageOptimizer.MAX_DIMENSIONS.get(
            image_type, 
            ImageOptimizer.MAX_DIMENSIONS["menu_item"]
        )
        
        # Calculate new dimensions maintaining aspect ratio
        original_width, original_height = img.size
        if original_width > max_width or original_height > max_height:
            img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
        
        # Save optimized image to bytes
        output = io.BytesIO()
        quality_value = ImageOptimizer.QUALITY_SETTINGS.get(
            quality,
            ImageOptimizer.QUALITY_SETTINGS["medium"]
        )
        
        # Save with optimization
        save_kwargs = {
            "format": format,
            "quality": quality_value,
            "optimize": True
        }
        
        # Add progressive encoding for JPEG
        if format.upper() == "JPEG":
            save_kwargs["progressive"] = True
        
        img.save(output, **save_kwargs)
        optimized_bytes = output.getvalue()
        
        # Collect metadata
        metadata = {
            "original_size": len(image_bytes),
            "optimized_size": len(optimized_bytes),
            "compression_ratio": round(len(optimized_bytes) / len(image_bytes), 2),
            "original_dimensions": f"{original_width}x{original_height}",
            "optimized_dimensions": f"{img.size[0]}x{img.size[1]}",
            "format": format,
            "file_hash": ImageOptimizer.calculate_file_hash(optimized_bytes)
        }
        
        return optimized_bytes, metadata
    
    @staticmethod
    async def optimize_image(
        image_bytes: bytes,
        image_type: str = "menu_item",
        quality: str = "medium",
        format: str = "JPEG"
    ) -> Tuple[bytes, dict]:
        """
        Async wrapper for image optimization
        Runs CPU-intensive operations in thread pool
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            executor,
            ImageOptimizer.optimize_image_sync,
            image_bytes,
            image_type,
            quality,
            format
        )
    
    @staticmethod
    async def create_thumbnail(
        image_bytes: bytes,
        size: Tuple[int, int] = (150, 150)
    ) -> bytes:
        """Create a small thumbnail version of the image"""
        loop = asyncio.get_event_loop()
        
        def create_thumb_sync():
            img = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if needed
            if img.mode in ("RGBA", "LA", "P"):
                background = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
                img = background
            
            # Create thumbnail
            img.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Save to bytes
            output = io.BytesIO()
            img.save(output, format="JPEG", quality=70, optimize=True)
            return output.getvalue()
        
        return await loop.run_in_executor(executor, create_thumb_sync)
    
    @staticmethod
    def get_image_info(image_bytes: bytes) -> dict:
        """Get image information without modifying it"""
        img = Image.open(io.BytesIO(image_bytes))
        return {
            "format": img.format,
            "mode": img.mode,
            "size": img.size,
            "width": img.width,
            "height": img.height
        }