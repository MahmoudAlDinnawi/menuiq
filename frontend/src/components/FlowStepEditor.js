import React, { useState, useEffect } from 'react';

const FlowStepEditor = ({ step, steps, onSave, onClose }) => {
  const [stepData, setStepData] = useState({
    step_type: 'text',
    content_ar: '',
    content_en: '',
    image_url: '',
    animation_type: 'fade_in',
    animation_duration: 500,
    delay_before: 0,
    auto_advance: true,
    auto_advance_delay: 3000,
    default_next_step_id: '',
    // Question type options
    option1_text_ar: '',
    option1_text_en: '',
    option1_next_step_id: '',
    option1_action: '',
    option2_text_ar: '',
    option2_text_en: '',
    option2_next_step_id: '',
    option2_action: '',
    option3_text_ar: '',
    option3_text_en: '',
    option3_next_step_id: '',
    option3_action: '',
    option4_text_ar: '',
    option4_text_en: '',
    option4_next_step_id: '',
    option4_action: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (step) {
      setStepData({
        ...step,
        content_ar: step.content_ar || '',
        content_en: step.content_en || '',
        image_url: step.image_url || '',
        animation_type: step.animation_type || 'fade_in',
        animation_duration: step.animation_duration || 500,
        delay_before: step.delay_before || 0,
        auto_advance: step.auto_advance !== undefined ? step.auto_advance : true,
        auto_advance_delay: step.auto_advance_delay || 3000,
        default_next_step_id: step.default_next_step_id || '',
        // Flatten options
        option1_text_ar: step.option1_text_ar || '',
        option1_text_en: step.option1_text_en || '',
        option1_next_step_id: step.option1_next_step_id || '',
        option1_action: step.option1_action || '',
        option2_text_ar: step.option2_text_ar || '',
        option2_text_en: step.option2_text_en || '',
        option2_next_step_id: step.option2_next_step_id || '',
        option2_action: step.option2_action || '',
        option3_text_ar: step.option3_text_ar || '',
        option3_text_en: step.option3_text_en || '',
        option3_next_step_id: step.option3_next_step_id || '',
        option3_action: step.option3_action || '',
        option4_text_ar: step.option4_text_ar || '',
        option4_text_en: step.option4_text_en || '',
        option4_next_step_id: step.option4_next_step_id || '',
        option4_action: step.option4_action || ''
      });
    }
  }, [step]);

  const animationTypes = [
    { value: 'fade_in', label: 'Fade In' },
    { value: 'slide_up', label: 'Slide Up' },
    { value: 'slide_down', label: 'Slide Down' },
    { value: 'slide_left', label: 'Slide Left' },
    { value: 'slide_right', label: 'Slide Right' },
    { value: 'bounce', label: 'Bounce' },
    { value: 'zoom_in', label: 'Zoom In' }
  ];

  const validateStep = () => {
    const newErrors = {};
    
    if (!stepData.content_ar.trim()) {
      newErrors.content_ar = 'Arabic content is required';
    }
    
    if (stepData.step_type === 'question') {
      let hasAtLeastOneOption = false;
      
      ['option1', 'option2', 'option3', 'option4'].forEach(optionKey => {
        if (stepData[`${optionKey}_text_ar`]) {
          hasAtLeastOneOption = true;
        }
      });
      
      if (!hasAtLeastOneOption) {
        newErrors.options = 'At least one option is required for questions';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateStep()) return;
    
    // Clean up the data before saving
    const cleanedData = {
      ...stepData,
      // Convert empty strings to null for next_step_id fields
      default_next_step_id: stepData.default_next_step_id || null,
      option1_next_step_id: stepData.option1_next_step_id || null,
      option2_next_step_id: stepData.option2_next_step_id || null,
      option3_next_step_id: stepData.option3_next_step_id || null,
      option4_next_step_id: stepData.option4_next_step_id || null
    };
    
    onSave(cleanedData);
  };

  const handleOptionChange = (optionKey, field, value) => {
    setStepData({
      ...stepData,
      [`${optionKey}_${field}`]: value
    });
  };

  const addOption = (optionKey) => {
    setStepData({
      ...stepData,
      [`${optionKey}_text_ar`]: '',
      [`${optionKey}_text_en`]: '',
      [`${optionKey}_next_step_id`]: '',
      [`${optionKey}_action`]: ''
    });
  };

  const removeOption = (optionKey) => {
    setStepData({
      ...stepData,
      [`${optionKey}_text_ar`]: '',
      [`${optionKey}_text_en`]: '',
      [`${optionKey}_next_step_id`]: '',
      [`${optionKey}_action`]: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {step?.id ? 'Edit Step' : 'Add Step'}
          </h2>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Content */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Content</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arabic Content *
                </label>
                <textarea
                  value={stepData.content_ar}
                  onChange={(e) => setStepData({ ...stepData, content_ar: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                    errors.content_ar ? 'border-red-500' : 'border-gray-300'
                  }`}
                  rows="4"
                  placeholder="اهلا وسهلا بك في مطعم انتروكوت"
                  dir="rtl"
                />
                {errors.content_ar && (
                  <p className="text-sm text-red-600 mt-1">{errors.content_ar}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  English Content
                </label>
                <textarea
                  value={stepData.content_en}
                  onChange={(e) => setStepData({ ...stepData, content_en: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows="4"
                  placeholder="Welcome to Entrecote Restaurant"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL (optional)
                </label>
                <input
                  type="text"
                  value={stepData.image_url}
                  onChange={(e) => setStepData({ ...stepData, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Animation Settings */}
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Animation</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Type</label>
                    <select
                      value={stepData.animation_type}
                      onChange={(e) => setStepData({ ...stepData, animation_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      {animationTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Duration (ms)</label>
                    <input
                      type="number"
                      value={stepData.animation_duration}
                      onChange={(e) => setStepData({ ...stepData, animation_duration: parseInt(e.target.value) || 500 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      min="100"
                      max="5000"
                      step="100"
                    />
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="block text-sm text-gray-600 mb-1">Delay Before (ms)</label>
                  <input
                    type="number"
                    value={stepData.delay_before}
                    onChange={(e) => setStepData({ ...stepData, delay_before: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    min="0"
                    max="10000"
                    step="100"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Type-specific Settings */}
            <div className="space-y-4">
              {stepData.step_type === 'text' ? (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Text Settings</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={stepData.auto_advance}
                        onChange={(e) => setStepData({ ...stepData, auto_advance: e.target.checked })}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                      />
                      <span className="text-sm text-gray-700">Auto advance to next step</span>
                    </label>
                    
                    {stepData.auto_advance && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Auto advance delay (ms)
                        </label>
                        <input
                          type="number"
                          value={stepData.auto_advance_delay}
                          onChange={(e) => setStepData({ ...stepData, auto_advance_delay: parseInt(e.target.value) || 3000 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                          min="1000"
                          max="30000"
                          step="500"
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Next Step
                      </label>
                      <select
                        value={stepData.default_next_step_id || ''}
                        onChange={(e) => setStepData({ ...stepData, default_next_step_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value="">End flow</option>
                        {steps
                          .filter(s => s.id !== step?.id)
                          .map(s => (
                            <option key={s.id} value={s.id}>
                              Step {s.order_position}: {s.content_ar.substring(0, 30)}...
                            </option>
                          ))
                        }
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Question Options</h3>
                  
                  {errors.options && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{errors.options}</p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {['option1', 'option2', 'option3', 'option4'].map((optionKey, index) => (
                      <div key={optionKey} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-700">Option {index + 1}</h4>
                          {(stepData[`${optionKey}_text_ar`] || stepData[`${optionKey}_text_en`]) ? (
                            <button
                              onClick={() => removeOption(optionKey)}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              onClick={() => addOption(optionKey)}
                              className="text-sm text-indigo-600 hover:text-indigo-700"
                            >
                              Add Option
                            </button>
                          )}
                        </div>
                        
                        {(stepData[`${optionKey}_text_ar`] || stepData[`${optionKey}_text_en`]) && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={stepData[`${optionKey}_text_ar`] || ''}
                              onChange={(e) => handleOptionChange(optionKey, 'text_ar', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                              placeholder="Arabic text"
                              dir="rtl"
                            />
                            <input
                              type="text"
                              value={stepData[`${optionKey}_text_en`] || ''}
                              onChange={(e) => handleOptionChange(optionKey, 'text_en', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                              placeholder="English text"
                            />
                            <select
                              value={stepData[`${optionKey}_action`] || ''}
                              onChange={(e) => handleOptionChange(optionKey, 'action', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                            >
                              <option value="">Continue flow</option>
                              <option value="go_to_menu">Go to menu</option>
                              <option value="go_to_category">Go to specific category</option>
                              <option value="end_flow">End flow</option>
                            </select>
                            {stepData[`${optionKey}_action`] === '' && (
                              <select
                                value={stepData[`${optionKey}_next_step_id`] || ''}
                                onChange={(e) => handleOptionChange(optionKey, 'next_step_id', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                              >
                                <option value="">Select next step</option>
                                {steps
                                  .filter(s => s.id !== step?.id)
                                  .map(s => (
                                    <option key={s.id} value={s.id}>
                                      Step {s.order_position}: {s.content_ar.substring(0, 20)}...
                                    </option>
                                  ))
                                }
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
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
            Save Step
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlowStepEditor;