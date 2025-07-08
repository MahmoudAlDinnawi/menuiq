import React from 'react';

const FlowList = ({ flows, loading, onEdit, onDelete, onRefresh }) => {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center gap-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading flows...
        </div>
      </div>
    );
  }

  if (flows.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No flows yet</h3>
          <p className="text-gray-500 mb-6">Create your first interactive flow to engage customers</p>
        </div>
      </div>
    );
  }

  const getTriggerLabel = (triggerType) => {
    switch (triggerType) {
      case 'on_load':
        return 'On Page Load';
      case 'on_idle':
        return 'On User Idle';
      default:
        return 'Manual';
    }
  };

  const getTriggerIcon = (triggerType) => {
    switch (triggerType) {
      case 'on_load':
        return 'M13 10V3L4 14h7v7l9-11h-7z';
      case 'on_idle':
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      default:
        return 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122';
    }
  };

  return (
    <div className="p-6">
      <div className="grid gap-4">
        {flows.map((flow) => (
          <div
            key={flow.id}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {flow.name}
                    </h3>
                    {flow.is_default && (
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                        Default
                      </span>
                    )}
                    {!flow.is_active && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  {flow.description && (
                    <p className="text-gray-600 text-sm mb-3">
                      {flow.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getTriggerIcon(flow.trigger_type)} />
                      </svg>
                      <span>{getTriggerLabel(flow.trigger_type)}</span>
                      {flow.trigger_delay > 0 && (
                        <span className="text-gray-400">
                          ({flow.trigger_delay}s delay)
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                      </svg>
                      <span>{flow.steps?.length || 0} steps</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Created {new Date(flow.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onEdit(flow)}
                    className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(flow.id)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {/* Preview of first few steps */}
              {flow.steps && flow.steps.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-3 overflow-x-auto">
                    {flow.steps.slice(0, 3).map((step, index) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-2 text-xs text-gray-500"
                      >
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 rounded-full whitespace-nowrap">
                          <span className="font-medium">{index + 1}</span>
                          <span className="text-gray-400">•</span>
                          <span className={step.step_type === 'text' ? 'text-blue-600' : 'text-purple-600'}>
                            {step.step_type}
                          </span>
                        </div>
                        {index < flow.steps.length - 1 && index < 2 && (
                          <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    ))}
                    {flow.steps.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{flow.steps.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlowList;