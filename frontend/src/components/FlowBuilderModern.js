import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from './DragDropWrapper';
import FlowStepEditor from './FlowStepEditor';

const FlowBuilderModern = ({ flow, onSave, onClose }) => {
  const [flowData, setFlowData] = useState({
    name: '',
    description: '',
    is_active: true,
    is_default: false,
    trigger_type: 'on_load',
    trigger_delay: 0,
    steps: []
  });
  const [selectedStep, setSelectedStep] = useState(null);
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewStep, setPreviewStep] = useState(0);

  useEffect(() => {
    if (flow) {
      setFlowData({
        name: flow.name || '',
        description: flow.description || '',
        is_active: flow.is_active !== undefined ? flow.is_active : true,
        is_default: flow.is_default || false,
        trigger_type: flow.trigger_type || 'on_load',
        trigger_delay: flow.trigger_delay || 0,
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
      animation_duration: 1000,
      delay_before: 0,
      auto_advance: type === 'text',
      auto_advance_delay: 4000,
      ...(type === 'question' && {
        option1_text_ar: '',
        option1_text_en: '',
        option1_action: '',
        option2_text_ar: '',
        option2_text_en: '',
        option2_action: '',
        option3_text_ar: '',
        option3_text_en: '',
        option3_action: '',
        option4_text_ar: '',
        option4_text_en: '',
        option4_action: '',
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

  const handleDuplicateStep = (step) => {
    const newStep = {
      ...step,
      id: Date.now(),
      order_position: flowData.steps.length + 1
    };
    setFlowData({
      ...flowData,
      steps: [...flowData.steps, newStep]
    });
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

  const togglePreview = () => {
    setShowPreview(!showPreview);
    setPreviewStep(0);
  };

  const stepTemplates = [
    {
      type: 'text',
      name: 'Welcome Message',
      icon: '👋',
      description: 'Greet your customers',
      template: {
        content_ar: 'أهلاً وسهلاً بك في مطعمنا',
        content_en: 'Welcome to our restaurant',
        animation_type: 'fade_in'
      }
    },
    {
      type: 'question',
      name: 'Language Selection',
      icon: '🌐',
      description: 'Let customers choose language',
      template: {
        content_ar: 'اختر لغتك المفضلة',
        content_en: 'Choose your preferred language',
        option1_text_ar: 'العربية',
        option1_text_en: 'العربية',
        option2_text_ar: 'English',
        option2_text_en: 'English'
      }
    },
    {
      type: 'question',
      name: 'Menu Navigation',
      icon: '📱',
      description: 'Help customers navigate',
      template: {
        content_ar: 'كيف يمكنني مساعدتك؟',
        content_en: 'How can I help you?',
        option1_text_ar: 'تصفح القائمة',
        option1_text_en: 'Browse Menu',
        option1_action: 'go_to_menu',
        option2_text_ar: 'العروض الخاصة',
        option2_text_en: 'Special Offers'
      }
    },
    {
      type: 'text',
      name: 'Special Announcement',
      icon: '📢',
      description: 'Highlight special offers',
      template: {
        content_ar: 'لدينا عروض خاصة اليوم!',
        content_en: 'We have special offers today!',
        animation_type: 'zoom_in'
      }
    }
  ];

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r shadow-sm overflow-y-auto">
        <div className="p-6">
          {/* Flow Settings */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">⚙️</span>
              Flow Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flow Name
                </label>
                <input
                  type="text"
                  value={flowData.name}
                  onChange={(e) => setFlowData({ ...flowData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${
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
                  Trigger
                </label>
                <select
                  value={flowData.trigger_type}
                  onChange={(e) => setFlowData({ ...flowData, trigger_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="on_load">On Page Load</option>
                  <option value="manual">Manual</option>
                  <option value="on_idle">On User Idle</option>
                </select>
              </div>

              {flowData.trigger_type !== 'manual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay (seconds)
                  </label>
                  <input
                    type="number"
                    value={flowData.trigger_delay}
                    onChange={(e) => setFlowData({ ...flowData, trigger_delay: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    min="0"
                  />
                </div>
              )}

              <div className="flex items-center gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flowData.is_active}
                    onChange={(e) => setFlowData({ ...flowData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 mr-2"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flowData.is_default}
                    onChange={(e) => setFlowData({ ...flowData, is_default: e.target.checked })}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 mr-2"
                  />
                  <span className="text-sm text-gray-700">Default</span>
                </label>
              </div>
            </div>
          </div>

          {/* Step Templates */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">✨</span>
              Quick Templates
            </h3>
            
            <div className="space-y-2">
              {stepTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const newStep = {
                      id: `temp-${Date.now()}`,
                      step_type: template.type,
                      order_position: flowData.steps.length + 1,
                      ...template.template,
                      animation_duration: 1000,
                      delay_before: 0,
                      auto_advance: template.type === 'text',
                      auto_advance_delay: 4000
                    };
                    setSelectedStep(newStep);
                    setShowStepEditor(true);
                  }}
                  className="w-full p-3 bg-gray-50 hover:bg-amber-50 rounded-lg transition-all duration-200 text-left group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {template.icon}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {template.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Step Buttons */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddStep('text')}
                className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                + Text Step
              </button>
              <button
                onClick={() => handleAddStep('question')}
                className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                + Question
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {flowData.name || 'Untitled Flow'}
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={togglePreview}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                Save Flow
              </button>
            </div>
          </div>
        </div>

        {/* Flow Builder Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {errors.steps && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.steps}</p>
            </div>
          )}

          {flowData.steps.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start Building Your Flow</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Add steps from the templates on the left or create custom steps
                </p>
              </div>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="flow-steps">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="max-w-3xl mx-auto"
                  >
                    {/* Flow Start Indicator */}
                    <div className="flex items-center justify-center mb-6">
                      <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                        Flow Start
                      </div>
                    </div>

                    {flowData.steps.map((step, index) => (
                      <React.Fragment key={step.id}>
                        {/* Connection Line */}
                        {index > 0 && (
                          <div className="flex justify-center -my-1">
                            <div className="w-0.5 h-8 bg-gray-300"></div>
                          </div>
                        )}

                        <Draggable
                          draggableId={step.id.toString()}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`group relative ${
                                snapshot.isDragging ? 'z-50' : ''
                              }`}
                            >
                              <div className={`bg-white rounded-xl border-2 p-5 transition-all duration-200 ${
                                snapshot.isDragging 
                                  ? 'shadow-2xl border-amber-400 scale-105' 
                                  : 'shadow-sm border-gray-200 hover:shadow-md hover:border-gray-300'
                              }`}>
                                {/* Drag Handle */}
                                <div className="flex items-start gap-4">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mt-1 text-gray-400 hover:text-gray-600 cursor-move"
                                  >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                    </svg>
                                  </div>

                                  {/* Step Content */}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        Step {index + 1}
                                      </span>
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        step.step_type === 'text' 
                                          ? 'bg-blue-100 text-blue-800' 
                                          : 'bg-purple-100 text-purple-800'
                                      }`}>
                                        {step.step_type === 'text' ? '💬 Text' : '❓ Question'}
                                      </span>
                                    </div>

                                    <div className="space-y-2">
                                      {step.content_ar && (
                                        <p className="text-gray-900 font-medium" dir="rtl">
                                          {step.content_ar}
                                        </p>
                                      )}
                                      {step.content_en && (
                                        <p className="text-gray-600 text-sm">
                                          {step.content_en}
                                        </p>
                                      )}
                                    </div>

                                    {/* Question Options Preview */}
                                    {step.step_type === 'question' && (
                                      <div className="mt-3 grid grid-cols-2 gap-2">
                                        {['option1', 'option2', 'option3', 'option4'].map((optionKey) => {
                                          const textAr = step[`${optionKey}_text_ar`];
                                          const textEn = step[`${optionKey}_text_en`];
                                          if (!textAr && !textEn) return null;
                                          
                                          return (
                                            <div key={optionKey} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                                              {textAr && <p className="text-gray-700" dir="rtl">{textAr}</p>}
                                              {textEn && <p className="text-gray-500 text-xs">{textEn}</p>}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleEditStep(step)}
                                      className="p-2 text-gray-400 hover:text-amber-600 transition-colors"
                                      title="Edit"
                                    >
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDuplicateStep(step)}
                                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                      title="Duplicate"
                                    >
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStep(step.id)}
                                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                      title="Delete"
                                    >
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      </React.Fragment>
                    ))}
                    {provided.placeholder}

                    {/* Flow End Indicator */}
                    {flowData.steps.length > 0 && (
                      <>
                        <div className="flex justify-center -my-1">
                          <div className="w-0.5 h-8 bg-gray-300"></div>
                        </div>
                        <div className="flex items-center justify-center mt-6">
                          <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
                            Flow End
                          </div>
                        </div>
                      </>
                    )}
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

      {/* Preview Modal */}
      {showPreview && flowData.steps.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Flow Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {flowData.steps[previewStep] && (
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900 mb-4">
                    {flowData.steps[previewStep].content_ar || flowData.steps[previewStep].content_en}
                  </p>
                  {flowData.steps[previewStep].step_type === 'question' && (
                    <div className="space-y-2">
                      {['option1', 'option2', 'option3', 'option4'].map((optionKey) => {
                        const text = flowData.steps[previewStep][`${optionKey}_text_ar`] || 
                                   flowData.steps[previewStep][`${optionKey}_text_en`];
                        if (!text) return null;
                        return (
                          <button
                            key={optionKey}
                            className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-900 transition-colors"
                          >
                            {text}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setPreviewStep(Math.max(0, previewStep - 1))}
                  disabled={previewStep === 0}
                  className="px-4 py-2 text-gray-600 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Step {previewStep + 1} of {flowData.steps.length}
                </span>
                <button
                  onClick={() => setPreviewStep(Math.min(flowData.steps.length - 1, previewStep + 1))}
                  disabled={previewStep === flowData.steps.length - 1}
                  className="px-4 py-2 text-gray-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowBuilderModern;