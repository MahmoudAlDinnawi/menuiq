"""
FlowIQ API Routes

This module contains all API endpoints for managing FlowIQ interactive flows.
Includes CRUD operations for flows, flow steps, and tracking user interactions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
import uuid

from database import get_db
from models import Flow, FlowStep, FlowInteraction, Tenant, User
from pydantic_models import (
    FlowCreate, FlowUpdate, FlowResponse,
    FlowStepCreate, FlowStepUpdate, FlowStepResponse,
    FlowInteractionCreate, FlowInteractionUpdate, FlowInteractionResponse
)
from auth import get_current_tenant_user

router = APIRouter()

# Flow Management Endpoints

@router.get("/flows", response_model=List[FlowResponse])
def get_flows(
    current_user: User = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Get all flows for the current tenant."""
    flows = db.query(Flow).filter(
        Flow.tenant_id == current_user.tenant_id
    ).options(
        joinedload(Flow.steps)
    ).order_by(Flow.created_at.desc()).all()
    
    return flows

@router.get("/flows/{flow_id}", response_model=FlowResponse)
def get_flow(
    flow_id: int,
    current_user: User = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Get a specific flow by ID."""
    flow = db.query(Flow).filter(
        Flow.id == flow_id,
        Flow.tenant_id == current_user.tenant_id
    ).options(
        joinedload(Flow.steps)
    ).first()
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    return flow

@router.post("/flows", response_model=FlowResponse)
def create_flow(
    flow_data: FlowCreate,
    current_user: User = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Create a new flow with steps."""
    # If this is set as default, unset other default flows
    if flow_data.is_default:
        db.query(Flow).filter(
            Flow.tenant_id == current_user.tenant_id,
            Flow.is_default == True
        ).update({"is_default": False})
    
    # Create the flow
    flow = Flow(
        tenant_id=current_user.tenant_id,
        name=flow_data.name,
        description=flow_data.description,
        is_active=flow_data.is_active,
        is_default=flow_data.is_default,
        trigger_type=flow_data.trigger_type,
        trigger_delay=flow_data.trigger_delay
    )
    db.add(flow)
    db.flush()  # Get the flow ID without committing
    
    # Create steps if provided
    for step_data in flow_data.steps:
        step = create_flow_step(flow.id, step_data, db)
    
    db.commit()
    db.refresh(flow)
    
    # Load steps relationship
    flow = db.query(Flow).filter(
        Flow.id == flow.id
    ).options(
        joinedload(Flow.steps)
    ).first()
    
    return flow

@router.put("/flows/{flow_id}", response_model=FlowResponse)
def update_flow(
    flow_id: int,
    flow_data: FlowUpdate,
    current_user: User = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Update a flow."""
    flow = db.query(Flow).filter(
        Flow.id == flow_id,
        Flow.tenant_id == current_user.tenant_id
    ).first()
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # If setting as default, unset other defaults
    if flow_data.is_default and not flow.is_default:
        db.query(Flow).filter(
            Flow.tenant_id == current_user.tenant_id,
            Flow.is_default == True,
            Flow.id != flow_id
        ).update({"is_default": False})
    
    # Update flow fields
    for field, value in flow_data.dict(exclude_unset=True).items():
        setattr(flow, field, value)
    
    flow.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(flow)
    
    # Load steps relationship
    flow = db.query(Flow).filter(
        Flow.id == flow.id
    ).options(
        joinedload(Flow.steps)
    ).first()
    
    return flow

@router.put("/flows/{flow_id}/full", response_model=FlowResponse)
def update_flow_with_steps(
    flow_id: int,
    flow_data: FlowCreate,  # Using FlowCreate which includes steps
    current_user: User = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Update a flow including its steps (replaces all steps)."""
    flow = db.query(Flow).filter(
        Flow.id == flow_id,
        Flow.tenant_id == current_user.tenant_id
    ).first()
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # If setting as default, unset other defaults
    if flow_data.is_default and not flow.is_default:
        db.query(Flow).filter(
            Flow.tenant_id == current_user.tenant_id,
            Flow.is_default == True,
            Flow.id != flow_id
        ).update({"is_default": False})
    
    # Update flow fields
    flow.name = flow_data.name
    flow.description = flow_data.description
    flow.is_active = flow_data.is_active
    flow.is_default = flow_data.is_default
    flow.trigger_type = flow_data.trigger_type
    flow.trigger_delay = flow_data.trigger_delay
    flow.updated_at = datetime.utcnow()
    
    # First, clear any references to these steps in flow_interactions
    step_ids = [step.id for step in flow.steps]
    if step_ids:
        db.query(FlowInteraction).filter(
            FlowInteraction.last_step_id.in_(step_ids)
        ).update({"last_step_id": None}, synchronize_session=False)
    
    # Now we can safely delete existing steps
    db.query(FlowStep).filter(FlowStep.flow_id == flow_id).delete()
    
    # Create new steps
    for step_data in flow_data.steps:
        step = create_flow_step(flow_id, step_data, db)
    
    db.commit()
    db.refresh(flow)
    
    # Load steps relationship
    flow = db.query(Flow).filter(
        Flow.id == flow.id
    ).options(
        joinedload(Flow.steps)
    ).first()
    
    return flow

@router.delete("/flows/{flow_id}")
def delete_flow(
    flow_id: int,
    current_user: User = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Delete a flow."""
    flow = db.query(Flow).filter(
        Flow.id == flow_id,
        Flow.tenant_id == current_user.tenant_id
    ).first()
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    db.delete(flow)
    db.commit()
    
    return {"message": "Flow deleted successfully"}

# Flow Step Management Endpoints

def create_flow_step(flow_id: int, step_data: FlowStepCreate, db: Session) -> FlowStep:
    """Helper function to create a flow step."""
    step = FlowStep(
        flow_id=flow_id,
        step_type=step_data.step_type,
        order_position=step_data.order_position,
        content_ar=step_data.content_ar,
        content_en=step_data.content_en,
        image_url=step_data.image_url,
        animation_type=step_data.animation_type,
        animation_duration=step_data.animation_duration,
        delay_before=step_data.delay_before,
        auto_advance=step_data.auto_advance,
        auto_advance_delay=step_data.auto_advance_delay,
        default_next_step_id=step_data.default_next_step_id
    )
    
    # Handle options for question type
    if step_data.step_type == "question":
        if step_data.option1:
            step.option1_text_ar = step_data.option1.text_ar
            step.option1_text_en = step_data.option1.text_en
            step.option1_next_step_id = step_data.option1.next_step_id
            step.option1_action = step_data.option1.action
            
        if step_data.option2:
            step.option2_text_ar = step_data.option2.text_ar
            step.option2_text_en = step_data.option2.text_en
            step.option2_next_step_id = step_data.option2.next_step_id
            step.option2_action = step_data.option2.action
            
        if step_data.option3:
            step.option3_text_ar = step_data.option3.text_ar
            step.option3_text_en = step_data.option3.text_en
            step.option3_next_step_id = step_data.option3.next_step_id
            step.option3_action = step_data.option3.action
            
        if step_data.option4:
            step.option4_text_ar = step_data.option4.text_ar
            step.option4_text_en = step_data.option4.text_en
            step.option4_next_step_id = step_data.option4.next_step_id
            step.option4_action = step_data.option4.action
    
    db.add(step)
    return step

@router.post("/flows/{flow_id}/steps", response_model=FlowStepResponse)
def add_flow_step(
    flow_id: int,
    step_data: FlowStepCreate,
    current_user: User = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Add a step to an existing flow."""
    # Verify flow belongs to tenant
    flow = db.query(Flow).filter(
        Flow.id == flow_id,
        Flow.tenant_id == current_user.tenant_id
    ).first()
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    step = create_flow_step(flow_id, step_data, db)
    
    db.commit()
    db.refresh(step)
    
    return step

@router.put("/flows/{flow_id}/steps/{step_id}", response_model=FlowStepResponse)
def update_flow_step(
    flow_id: int,
    step_id: int,
    step_data: FlowStepUpdate,
    current_user: User = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Update a flow step."""
    # Verify flow belongs to tenant
    flow = db.query(Flow).filter(
        Flow.id == flow_id,
        Flow.tenant_id == current_user.tenant_id
    ).first()
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    step = db.query(FlowStep).filter(
        FlowStep.id == step_id,
        FlowStep.flow_id == flow_id
    ).first()
    
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    
    # Update basic fields
    update_data = step_data.dict(exclude_unset=True, exclude={'option1', 'option2', 'option3', 'option4'})
    for field, value in update_data.items():
        setattr(step, field, value)
    
    # Handle options for question type
    if step_data.option1 is not None:
        step.option1_text_ar = step_data.option1.text_ar if step_data.option1 else None
        step.option1_text_en = step_data.option1.text_en if step_data.option1 else None
        step.option1_next_step_id = step_data.option1.next_step_id if step_data.option1 else None
        step.option1_action = step_data.option1.action if step_data.option1 else None
        
    if step_data.option2 is not None:
        step.option2_text_ar = step_data.option2.text_ar if step_data.option2 else None
        step.option2_text_en = step_data.option2.text_en if step_data.option2 else None
        step.option2_next_step_id = step_data.option2.next_step_id if step_data.option2 else None
        step.option2_action = step_data.option2.action if step_data.option2 else None
        
    if step_data.option3 is not None:
        step.option3_text_ar = step_data.option3.text_ar if step_data.option3 else None
        step.option3_text_en = step_data.option3.text_en if step_data.option3 else None
        step.option3_next_step_id = step_data.option3.next_step_id if step_data.option3 else None
        step.option3_action = step_data.option3.action if step_data.option3 else None
        
    if step_data.option4 is not None:
        step.option4_text_ar = step_data.option4.text_ar if step_data.option4 else None
        step.option4_text_en = step_data.option4.text_en if step_data.option4 else None
        step.option4_next_step_id = step_data.option4.next_step_id if step_data.option4 else None
        step.option4_action = step_data.option4.action if step_data.option4 else None
    
    step.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(step)
    
    return step

@router.delete("/flows/{flow_id}/steps/{step_id}")
def delete_flow_step(
    flow_id: int,
    step_id: int,
    current_user: User = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Delete a flow step."""
    # Verify flow belongs to tenant
    flow = db.query(Flow).filter(
        Flow.id == flow_id,
        Flow.tenant_id == current_user.tenant_id
    ).first()
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    step = db.query(FlowStep).filter(
        FlowStep.id == step_id,
        FlowStep.flow_id == flow_id
    ).first()
    
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    
    # Update order positions of remaining steps
    db.query(FlowStep).filter(
        FlowStep.flow_id == flow_id,
        FlowStep.order_position > step.order_position
    ).update({
        FlowStep.order_position: FlowStep.order_position - 1
    })
    
    db.delete(step)
    db.commit()
    
    return {"message": "Step deleted successfully"}

@router.put("/flows/{flow_id}/steps/reorder")
def reorder_flow_steps(
    flow_id: int,
    step_ids: List[int],
    current_user: User = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Reorder steps in a flow."""
    # Verify flow belongs to tenant
    flow = db.query(Flow).filter(
        Flow.id == flow_id,
        Flow.tenant_id == current_user.tenant_id
    ).first()
    
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    # Update order positions
    for position, step_id in enumerate(step_ids, 1):
        db.query(FlowStep).filter(
            FlowStep.id == step_id,
            FlowStep.flow_id == flow_id
        ).update({
            FlowStep.order_position: position
        })
    
    db.commit()
    
    return {"message": "Steps reordered successfully"}

# Flow Interaction Tracking Endpoints

@router.get("/flow-interactions", response_model=List[FlowInteractionResponse])
def get_flow_interactions(
    flow_id: Optional[int] = None,
    session_id: Optional[str] = None,
    is_completed: Optional[bool] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Get flow interactions with filtering options."""
    query = db.query(FlowInteraction).filter(
        FlowInteraction.tenant_id == current_user.tenant_id
    )
    
    if flow_id:
        query = query.filter(FlowInteraction.flow_id == flow_id)
    if session_id:
        query = query.filter(FlowInteraction.session_id == session_id)
    if is_completed is not None:
        query = query.filter(FlowInteraction.is_completed == is_completed)
    
    interactions = query.order_by(
        FlowInteraction.started_at.desc()
    ).limit(limit).offset(offset).all()
    
    return interactions

@router.get("/flow-analytics/summary")
def get_flow_analytics_summary(
    flow_id: Optional[int] = None,
    current_user: User = Depends(get_current_tenant_user),
    db: Session = Depends(get_db)
):
    """Get analytics summary for flows."""
    query = db.query(FlowInteraction).filter(
        FlowInteraction.tenant_id == current_user.tenant_id
    )
    
    if flow_id:
        query = query.filter(FlowInteraction.flow_id == flow_id)
    
    total_interactions = query.count()
    completed_interactions = query.filter(
        FlowInteraction.is_completed == True
    ).count()
    
    # Get completion rate by flow
    flows_data = []
    flows = db.query(Flow).filter(Flow.tenant_id == current_user.tenant_id)
    if flow_id:
        flows = flows.filter(Flow.id == flow_id)
    
    for flow in flows.all():
        flow_total = db.query(FlowInteraction).filter(
            FlowInteraction.flow_id == flow.id
        ).count()
        
        flow_completed = db.query(FlowInteraction).filter(
            FlowInteraction.flow_id == flow.id,
            FlowInteraction.is_completed == True
        ).count()
        
        completion_rate = (flow_completed / flow_total * 100) if flow_total > 0 else 0
        
        flows_data.append({
            "flow_id": flow.id,
            "flow_name": flow.name,
            "total_interactions": flow_total,
            "completed_interactions": flow_completed,
            "completion_rate": round(completion_rate, 2)
        })
    
    return {
        "total_interactions": total_interactions,
        "completed_interactions": completed_interactions,
        "overall_completion_rate": round((completed_interactions / total_interactions * 100) if total_interactions > 0 else 0, 2),
        "flows": flows_data
    }