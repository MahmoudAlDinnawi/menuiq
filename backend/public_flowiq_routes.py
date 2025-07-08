"""
Public FlowIQ API Routes

This module contains public API endpoints for FlowIQ interactive flows.
These endpoints are used by the public menu interface to display and track flows.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from datetime import datetime
import uuid

from database import get_db
from models import Flow, FlowStep, FlowInteraction, Tenant
from pydantic_models import FlowResponse, FlowInteractionCreate, FlowInteractionUpdate

router = APIRouter()

@router.get("/public/{subdomain}/flow", response_model=Optional[FlowResponse])
def get_active_flow(
    subdomain: str,
    trigger_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get the active flow for a tenant's public menu."""
    tenant = db.query(Tenant).filter(Tenant.subdomain == subdomain).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Query for active flows
    query = db.query(Flow).filter(
        Flow.tenant_id == tenant.id,
        Flow.is_active == True
    )
    
    # Filter by trigger type if specified
    if trigger_type:
        query = query.filter(Flow.trigger_type == trigger_type)
    
    # Get default flow or first active flow
    flow = query.filter(Flow.is_default == True).first()
    if not flow:
        flow = query.first()
    
    if flow:
        # Load steps with proper ordering
        flow = db.query(Flow).filter(
            Flow.id == flow.id
        ).options(
            joinedload(Flow.steps)
        ).first()
    
    return flow

@router.post("/public/{subdomain}/flow-interaction")
def start_flow_interaction(
    subdomain: str,
    interaction_data: FlowInteractionCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Start tracking a flow interaction."""
    tenant = db.query(Tenant).filter(Tenant.subdomain == subdomain).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Verify flow belongs to tenant
    flow = db.query(Flow).filter(
        Flow.id == interaction_data.flow_id,
        Flow.tenant_id == tenant.id
    ).first()
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # Get client IP
    client_ip = request.client.host
    if "X-Forwarded-For" in request.headers:
        client_ip = request.headers["X-Forwarded-For"].split(",")[0].strip()
    
    # Create interaction record
    interaction = FlowInteraction(
        flow_id=interaction_data.flow_id,
        tenant_id=tenant.id,
        session_id=interaction_data.session_id,
        user_agent=interaction_data.user_agent or request.headers.get("User-Agent"),
        ip_address=client_ip,
        device_type=interaction_data.device_type,
        browser=interaction_data.browser
    )
    
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    
    return {
        "interaction_id": interaction.id,
        "session_id": interaction.session_id
    }

@router.put("/public/{subdomain}/flow-interaction/{interaction_id}")
def update_flow_interaction(
    subdomain: str,
    interaction_id: int,
    update_data: FlowInteractionUpdate,
    db: Session = Depends(get_db)
):
    """Update a flow interaction with progress data."""
    tenant = db.query(Tenant).filter(Tenant.subdomain == subdomain).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    interaction = db.query(FlowInteraction).filter(
        FlowInteraction.id == interaction_id,
        FlowInteraction.tenant_id == tenant.id
    ).first()
    
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    
    # Update interaction data
    if update_data.completed_at:
        interaction.completed_at = update_data.completed_at
    if update_data.is_completed is not None:
        interaction.is_completed = update_data.is_completed
    if update_data.last_step_id:
        interaction.last_step_id = update_data.last_step_id
    
    # Update steps path
    if update_data.steps_path:
        steps_path_data = []
        for step in update_data.steps_path:
            steps_path_data.append({
                "step_id": step.step_id,
                "timestamp": step.timestamp.isoformat(),
                "option_selected": step.option_selected
            })
        interaction.steps_path = steps_path_data
    
    db.commit()
    
    return {"message": "Interaction updated successfully"}

@router.post("/public/{subdomain}/flow-interaction/{interaction_id}/step")
def record_flow_step(
    subdomain: str,
    interaction_id: int,
    step_id: int,
    option_selected: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Record a step in the flow interaction."""
    tenant = db.query(Tenant).filter(Tenant.subdomain == subdomain).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    interaction = db.query(FlowInteraction).filter(
        FlowInteraction.id == interaction_id,
        FlowInteraction.tenant_id == tenant.id
    ).first()
    
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    
    # Update last step
    interaction.last_step_id = step_id
    
    # Add to steps path
    steps_path = interaction.steps_path or []
    steps_path.append({
        "step_id": step_id,
        "timestamp": datetime.utcnow().isoformat(),
        "option_selected": option_selected
    })
    interaction.steps_path = steps_path
    
    db.commit()
    
    return {"message": "Step recorded successfully"}