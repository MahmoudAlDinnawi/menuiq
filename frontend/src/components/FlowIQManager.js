import React, { useState, useEffect } from 'react';
import tenantAPI from '../services/tenantApiV2';
import FlowBuilderModern from './FlowBuilderModern';
import FlowBuilderCanvas from './FlowBuilderCanvas';
import FlowList from './FlowList';
import FlowAnalytics from './FlowAnalytics';

const FlowIQManager = () => {
  const [activeTab, setActiveTab] = useState('flows');
  const [flows, setFlows] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderType, setBuilderType] = useState('canvas'); // 'canvas' or 'list'

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      setLoading(true);
      const response = await tenantAPI.get('/flowiq/flows');
      setFlows(response.data);
    } catch (error) {
      console.error('Failed to fetch flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFlow = () => {
    setSelectedFlow(null);
    setShowBuilder(true);
  };

  const handleEditFlow = (flow) => {
    setSelectedFlow(flow);
    setShowBuilder(true);
  };

  const handleDeleteFlow = async (flowId) => {
    if (!window.confirm('Are you sure you want to delete this flow?')) return;
    
    try {
      await tenantAPI.delete(`/flowiq/flows/${flowId}`);
      fetchFlows();
    } catch (error) {
      console.error('Failed to delete flow:', error);
    }
  };

  const handleSaveFlow = async (flowData) => {
    try {
      console.log('Raw flow data from builder:', flowData);
      
      // Create a mapping of step IDs to their positions for connection handling
      const stepIdToPosition = {};
      flowData.steps.forEach((step, index) => {
        if (step.id) {
          stepIdToPosition[step.id] = index + 1;
        }
      });

      // Helper function to convert step ID to position
      const getStepPosition = (stepId) => {
        if (!stepId) return null;
        // If it's already a number less than steps length, it might be a position
        if (typeof stepId === 'number' && stepId <= flowData.steps.length) {
          return stepId;
        }
        // Otherwise try to find it in our mapping
        return stepIdToPosition[stepId] || null;
      };

      // Transform steps to match backend expectations
      const transformedData = {
        ...flowData,
        steps: flowData.steps.map((step, index) => ({
          step_type: step.step_type || 'text',
          order_position: index + 1,  // Use index-based position
          content_ar: step.content_ar || 'محتوى',  // Provide default Arabic content
          content_en: step.content_en || null,
          image_url: step.image_url || null,
          animation_type: step.animation_type || 'fade_in',
          animation_duration: step.animation_duration || 500,
          delay_before: step.delay_before || 0,
          auto_advance: step.auto_advance !== undefined ? step.auto_advance : true,
          auto_advance_delay: step.auto_advance_delay || 3000,
          // Use position-based references for connections
          default_next_step_id: getStepPosition(step.default_next_step_id),
          // Transform options for backend - only include if text_ar has content
          ...(step.step_type === 'question' && {
            option1: step.option1_text_ar && step.option1_text_ar.trim() ? {
              text_ar: step.option1_text_ar.trim(),
              text_en: step.option1_text_en || null,
              next_step_id: getStepPosition(step.option1_next_step_id),
              action: step.option1_action || null
            } : null,
            option2: step.option2_text_ar && step.option2_text_ar.trim() ? {
              text_ar: step.option2_text_ar.trim(),
              text_en: step.option2_text_en || null,
              next_step_id: getStepPosition(step.option2_next_step_id),
              action: step.option2_action || null
            } : null,
            option3: step.option3_text_ar && step.option3_text_ar.trim() ? {
              text_ar: step.option3_text_ar.trim(),
              text_en: step.option3_text_en || null,
              next_step_id: getStepPosition(step.option3_next_step_id),
              action: step.option3_action || null
            } : null,
            option4: step.option4_text_ar && step.option4_text_ar.trim() ? {
              text_ar: step.option4_text_ar.trim(),
              text_en: step.option4_text_en || null,
              next_step_id: getStepPosition(step.option4_next_step_id),
              action: step.option4_action || null
            } : null
          })
        }))
      };

      console.log('Transformed data being sent:', transformedData);

      if (selectedFlow) {
        // Use the full update endpoint that handles steps
        await tenantAPI.put(`/flowiq/flows/${selectedFlow.id}/full`, transformedData);
      } else {
        await tenantAPI.post('/flowiq/flows', transformedData);
      }
      setShowBuilder(false);
      fetchFlows();
    } catch (error) {
      console.error('Failed to save flow:', error);
      if (error.response && error.response.data) {
        console.error('Server error details:', error.response.data);
        // Show specific validation errors
        if (error.response.data.detail) {
          if (Array.isArray(error.response.data.detail)) {
            const errorMessages = error.response.data.detail.map(err => 
              `${err.loc ? err.loc.join(' -> ') : 'Field'}: ${err.msg}`
            ).join('\n');
            alert(`Validation errors:\n${errorMessages}`);
          } else {
            alert(`Error: ${error.response.data.detail}`);
          }
        } else {
          alert('Failed to save flow. Please check your input and try again.');
        }
      } else {
        alert('Failed to save flow. Please check your connection and try again.');
      }
    }
  };

  const tabs = [
    { id: 'flows', label: 'Flows', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FlowIQ</h1>
            <p className="text-sm text-gray-500 mt-1">Create interactive customer experiences</p>
          </div>
          {!showBuilder && activeTab === 'flows' && (
            <div className="flex items-center gap-2">
              <select
                value={builderType}
                onChange={(e) => setBuilderType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="canvas">Canvas View</option>
                <option value="list">List View</option>
              </select>
              <button
                onClick={handleCreateFlow}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Flow
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        {!showBuilder && (
          <div className="flex gap-6 mt-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {showBuilder ? (
          builderType === 'canvas' ? (
            <FlowBuilderCanvas
              flow={selectedFlow}
              onSave={handleSaveFlow}
              onClose={() => {
                setShowBuilder(false);
                setSelectedFlow(null);
              }}
            />
          ) : (
            <FlowBuilderModern
              flow={selectedFlow}
              onSave={handleSaveFlow}
              onClose={() => {
                setShowBuilder(false);
                setSelectedFlow(null);
              }}
            />
          )
        ) : (
          <>
            {activeTab === 'flows' && (
              <FlowList
                flows={flows}
                loading={loading}
                onEdit={handleEditFlow}
                onDelete={handleDeleteFlow}
                onRefresh={fetchFlows}
              />
            )}
            {activeTab === 'analytics' && (
              <FlowAnalytics flows={flows} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FlowIQManager;