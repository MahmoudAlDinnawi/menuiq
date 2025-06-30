#!/usr/bin/env python3
"""
Quick fix for analytics error on production
"""

# Check the current analytics_routes.py for any async issues
import analytics_routes

# Check if get_device_details is async
import inspect

print("Checking get_device_details function...")
print(f"Is coroutine: {inspect.iscoroutinefunction(analytics_routes.get_device_details)}")
print(f"Is async: {'async' in inspect.getsource(analytics_routes.get_device_details)}")

# Print the actual function source
print("\nFunction source:")
print(inspect.getsource(analytics_routes.get_device_details)[:200] + "...")