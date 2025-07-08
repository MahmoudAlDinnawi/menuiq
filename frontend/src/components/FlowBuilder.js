import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from './DragDropWrapper';
import FlowStepEditor from './FlowStepEditor';

const FlowBuilder = ({ flow, onSave, onClose }) => {
  const [flowData, setFlowData] = useState({
    name: '',
    description: '',
    is_active: true,
    is_default: false,
    trigger_type: 'manual',
    trigger_delay: 0,
    steps: []
  });
  const [selectedStep, setSelectedStep] = useState(null);
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (flow) {
      setFlowData({
        name: flow.name,
        description: flow.description || '',
        is_active: flow.is_active,
        is_default: flow.is_default,
        trigger_type: flow.trigger_type,
        trigger_delay: flow.trigger_delay,
        steps: flow.steps || []
      });
    }
  }, [flow]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const steps = Array.from(flowData.steps);
    const [reorderedStep] = steps.splice(result.source.index, 1);
    steps.splice(result.destination.index, 0, reorderedStep);

    // Update order positions
    const updatedSteps = steps.map((step, index) => ({
      ...step,
      order_position: index + 1
    }));

    setFlowData({ ...flowData, steps: updatedSteps });
  };

  const handleAddStep = (type) => {
    const newStep = {
      id: `temp-${Date.now()}`,
      step_type: type,
      order_position: flowData.steps.length + 1,
      content_ar: '',
      content_en: '',
      animation_type: 'fade_in',
      animation_duration: 500,
      delay_before: 0,
      auto_advance: type === 'text',
      auto_advance_delay: 3000,
      ...(type === 'question' && {
        option1_text_ar: '',
        option1_text_en: '',
        option2_text_ar: '',
        option2_text_en: '',
      })
    };
    setSelectedStep(newStep);
    setShowStepEditor(true);
  };

  const handleEditStep = (step) => {
    setSelectedStep(step);
    setShowStepEditor(true);
  };

  const handleDeleteStep = (stepId) => {
    const updatedSteps = flowData.steps
      .filter(step => step.id !== stepId)
      .map((step, index) => ({ ...step, order_position: index + 1 }));
    setFlowData({ ...flowData, steps: updatedSteps });
  };

  const handleSaveStep = (stepData) => {
    const isNewStep = stepData.id.toString().startsWith('temp-');
    
    if (isNewStep) {
      setFlowData({
        ...flowData,
        steps: [...flowData.steps, { ...stepData, id: Date.now() }]
      });
    } else {
      setFlowData({
        ...flowData,
        steps: flowData.steps.map(step => 
          step.id === stepData.id ? stepData : step
        )
      });
    }
    
    setShowStepEditor(false);
    setSelectedStep(null);
  };

  const validateFlow = () => {
    const newErrors = {};
    
    if (!flowData.name.trim()) {
      newErrors.name = 'Flow name is required';
    }
    
    if (flowData.steps.length === 0) {
      newErrors.steps = 'At least one step is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateFlow()) return;
    onSave(flowData);
  };

  return (
    <div className="h-full flex">
      {/* Left Panel - Flow Settings */}
      <div className="w-96 bg-white border-r overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Flow Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flow Name
              </label>
              <input
                type="text"
                value={flowData.name}
                onChange={(e) => setFlowData({ ...flowData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Welcome Flow"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={flowData.description}
                onChange={(e) => setFlowData({ ...flowData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows="3"
                placeholder="Greet customers and help them navigate the menu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Type
              </label>
              <select
                value={flowData.trigger_type}
                onChange={(e) => setFlowData({ ...flowData, trigger_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="manual">Manual</option>
                <option value="on_load">On Page Load</option>
                <option value="on_idle">On User Idle</option>
              </select>
            </div>

            {flowData.trigger_type !== 'manual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trigger Delay (seconds)
                </label>
                <input
                  type="number"
                  value={flowData.trigger_delay}
                  onChange={(e) => setFlowData({ ...flowData, trigger_delay: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  min="0"
                />
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={flowData.is_active}
                  onChange={(e) => setFlowData({ ...flowData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={flowData.is_default}
                  onChange={(e) => setFlowData({ ...flowData, is_default: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                />
                <span className="text-sm text-gray-700">Default Flow</span>
              </label>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add Step</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleAddStep('text')}
                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                + Text
              </button>
              <button
                onClick={() => handleAddStep('question')}
                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                + Question
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Flow Steps */}
      <div className="flex-1 bg-gray-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Flow Steps</h2>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Save Flow
              </button>
            </div>
          </div>

          {errors.steps && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.steps}</p>
            </div>
          )}

          {flowData.steps.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="text-gray-500 mb-2">No steps yet</p>
              <p className="text-sm text-gray-400">Add text or question steps from the left panel</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="flow-steps">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {flowData.steps.map((step, index) => (
                      <Draggable
                        key={step.id}
                        draggableId={step.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-white rounded-lg p-4 border ${
                              snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-1 text-gray-400 hover:text-gray-600 cursor-move"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                  </svg>
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-medium text-gray-500">
                                      Step {step.order_position}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                      step.step_type === 'text' 
                                        ? 'bg-blue-100 text-blue-700' 
                                        : 'bg-purple-100 text-purple-700'
                                    }`}>
                                      {step.step_type}
                                    </span>
                                  </div>
                                  
                                  <p className="text-sm text-gray-900 font-medium">
                                    {step.content_ar || 'No content'}
                                  </p>
                                  
                                  {step.content_en && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      {step.content_en}
                                    </p>
                                  )}
                                  
                                  {step.step_type === 'question' && (
                                    <div className="mt-2 space-y-1">
                                      {step.option1_text_ar && (
                                        <p className="text-xs text-gray-500">
                                          • {step.option1_text_ar}
                                        </p>
                                      )}
                                      {step.option2_text_ar && (
                                        <p className="text-xs text-gray-500">
                                          • {step.option2_text_ar}
                                        </p>
                                      )}
                                      {step.option3_text_ar && (
                                        <p className="text-xs text-gray-500">
                                          • {step.option3_text_ar}
                                        </p>
                                      )}
                                      {step.option4_text_ar && (
                                        <p className="text-xs text-gray-500">
                                          • {step.option4_text_ar}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 ml-4">
                                <button
                                  onClick={() => handleEditStep(step)}
                                  className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteStep(step.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* Step Editor Modal */}
      {showStepEditor && (
        <FlowStepEditor
          step={selectedStep}
          steps={flowData.steps}
          onSave={handleSaveStep}
          onClose={() => {
            setShowStepEditor(false);
            setSelectedStep(null);
          }}
        />
      )}
    </div>
  );
};

export default FlowBuilder;