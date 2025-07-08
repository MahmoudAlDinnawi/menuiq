import React, { useState, useEffect, useRef, useCallback } from 'react';
import FlowStepEditor from './FlowStepEditor';
import '../styles/flow-builder.css';

const FlowBuilderCanvas = ({ flow, onSave, onClose }) => {
  const [flowData, setFlowData] = useState({
    name: '',
    description: '',
    is_active: true,
    is_default: false,
    trigger_type: 'on_load',
    trigger_delay: 0,
    steps: []
  });
  
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [errors, setErrors] = useState({});
  const [draggingNode, setDraggingNode] = useState(null);
  const [connectionMode, setConnectionMode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  
  const canvasRef = useRef(null);

  // Initialize from existing flow
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
      
      // Convert steps to nodes with positions
      if (flow.steps && flow.steps.length > 0) {
        const newNodes = flow.steps.map((step, index) => ({
          id: step.id || `temp-${Date.now()}-${index}`,
          step: step,
          x: 100 + (index % 3) * 350,
          y: 100 + Math.floor(index / 3) * 250,
          connections: getConnectionsForStep(step, flow.steps)
        }));
        setNodes(newNodes);
      }
    }
  }, [flow]);

  const getConnectionsForStep = (step, allSteps) => {
    const connections = [];
    
    if (step.step_type === 'text' && step.default_next_step_id) {
      connections.push({
        to: step.default_next_step_id,
        label: 'Next',
        type: 'default'
      });
    } else if (step.step_type === 'question') {
      ['option1', 'option2', 'option3', 'option4'].forEach((opt, index) => {
        const nextStepId = step[`${opt}_next_step_id`];
        const text = step[`${opt}_text_ar`] || step[`${opt}_text_en`];
        if (nextStepId && text) {
          connections.push({
            to: nextStepId,
            label: text.substring(0, 20) + '...',
            type: 'option',
            optionIndex: index
          });
        }
      });
    }
    
    return connections;
  };

  const addNode = (type) => {
    const newStep = {
      id: `temp-${Date.now()}`,
      step_type: type,
      order_position: nodes.length + 1,
      content_ar: 'محتوى جديد',  // Default Arabic content
      content_en: 'New content',   // Default English content
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
    
    const newNode = {
      id: newStep.id,
      step: newStep,
      x: 100 + (nodes.length % 3) * 350,
      y: 100 + Math.floor(nodes.length / 3) * 250,
      connections: []
    };
    
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
    setSelectedStep(newStep);
    setShowStepEditor(true);
  };

  const updateNode = (nodeId, updates) => {
    setNodes(nodes.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  };

  const deleteNode = (nodeId) => {
    // Remove node and any connections to it
    setNodes(nodes.map(node => ({
      ...node,
      connections: node.connections.filter(conn => conn.to !== nodeId)
    })).filter(node => node.id !== nodeId));
    setSelectedNode(null);
  };

  const startConnection = (fromNodeId, connectionType, optionIndex = null) => {
    setConnectionMode({
      fromNodeId,
      type: connectionType,
      optionIndex
    });
  };

  const completeConnection = (toNodeId) => {
    if (connectionMode && toNodeId !== connectionMode.fromNodeId) {
      const sourceNode = nodes.find(n => n.id === connectionMode.fromNodeId);
      if (sourceNode) {
        const targetStep = nodes.find(n => n.id === toNodeId)?.step;
        const label = connectionMode.type === 'default' 
          ? 'Next' 
          : sourceNode.step[`option${connectionMode.optionIndex + 1}_text_ar`] || 
            sourceNode.step[`option${connectionMode.optionIndex + 1}_text_en`] || 
            `Option ${connectionMode.optionIndex + 1}`;
        
        const newConnection = {
          to: toNodeId,
          type: connectionMode.type,
          label: label.substring(0, 20) + (label.length > 20 ? '...' : ''),
          optionIndex: connectionMode.optionIndex
        };
        
        // Filter out existing connections of the same type/option
        const filteredConnections = connectionMode.type === 'default' 
          ? sourceNode.connections.filter(c => c.type !== 'default')
          : sourceNode.connections.filter(c => !(c.type === 'option' && c.optionIndex === connectionMode.optionIndex));
        
        updateNode(connectionMode.fromNodeId, {
          connections: [...filteredConnections, newConnection]
        });
      }
    }
    setConnectionMode(null);
    setHoveredNode(null);
  };

  const cancelConnection = () => {
    setConnectionMode(null);
    setHoveredNode(null);
  };

  // Handle node dragging
  const handleNodeMouseDown = (e, node) => {
    if (e.target.closest('.no-drag')) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const startX = (e.clientX - rect.left) / zoom;
    const startY = (e.clientY - rect.top) / zoom;
    const offsetX = startX - node.x;
    const offsetY = startY - node.y;
    
    setDraggingNode({ id: node.id, offsetX, offsetY });
    setSelectedNode(node);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (draggingNode && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom - draggingNode.offsetX;
        const y = (e.clientY - rect.top) / zoom - draggingNode.offsetY;
        
        updateNode(draggingNode.id, {
          x: Math.max(0, x),
          y: Math.max(0, y)
        });
      }
    };
    
    const handleMouseUp = () => {
      setDraggingNode(null);
    };
    
    if (draggingNode) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingNode, zoom]);

  const handleSaveStep = (stepData) => {
    const updatedNode = nodes.find(n => n.id === selectedNode.id);
    if (updatedNode) {
      updatedNode.step = stepData;
      updatedNode.connections = getConnectionsForStep(stepData, nodes.map(n => n.step));
      setNodes([...nodes]);
    }
    setShowStepEditor(false);
    setSelectedStep(null);
  };

  const validateFlow = () => {
    const newErrors = {};
    
    if (!flowData.name.trim()) {
      newErrors.name = 'Flow name is required';
    }
    
    if (nodes.length === 0) {
      newErrors.steps = 'At least one step is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateFlow()) return;
    
    // Convert nodes back to steps with proper order
    const steps = nodes.map((node, index) => ({
      ...node.step,
      order_position: index + 1,
      // Update next_step_id based on connections
      ...(node.step.step_type === 'text' && {
        default_next_step_id: node.connections.find(c => c.type === 'default')?.to || null
      }),
      ...(node.step.step_type === 'question' && {
        option1_next_step_id: node.connections.find(c => c.optionIndex === 0)?.to || null,
        option2_next_step_id: node.connections.find(c => c.optionIndex === 1)?.to || null,
        option3_next_step_id: node.connections.find(c => c.optionIndex === 2)?.to || null,
        option4_next_step_id: node.connections.find(c => c.optionIndex === 3)?.to || null,
      })
    }));
    
    onSave({ ...flowData, steps });
  };

  const renderConnection = (fromNode, connection) => {
    const toNode = nodes.find(n => n.id === connection.to);
    if (!toNode) return null;
    
    const x1 = fromNode.x + 150;
    const y1 = fromNode.y + 180;
    const x2 = toNode.x + 150;
    const y2 = toNode.y;
    
    // Create smooth bezier curve
    const dx = x2 - x1;
    const dy = y2 - y1;
    const cx1 = x1;
    const cy1 = y1 + Math.min(100, Math.abs(dy) * 0.5);
    const cx2 = x2;
    const cy2 = y2 - Math.min(100, Math.abs(dy) * 0.5);
    
    const path = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    return (
      <g key={`${fromNode.id}-${connection.to}-${connection.optionIndex || 0}`}>
        <path
          d={path}
          fill="none"
          stroke={connection.type === 'default' ? "#3b82f6" : "#8b5cf6"}
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
          className="flow-connection"
        />
        <text
          x={midX}
          y={midY}
          textAnchor="middle"
          className="fill-gray-600 text-xs font-medium"
          dy="-5"
        >
          {connection.label}
        </text>
      </g>
    );
  };

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r shadow-sm overflow-y-auto">
        <div className="p-6">
          {/* Flow Settings */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Flow Settings</h3>
            
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
            </div>
          </div>

          {/* Add Node Buttons */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Step</h3>
            <div className="space-y-2">
              <button
                onClick={() => addNode('text')}
                className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Text Step</p>
                  <p className="text-sm text-gray-500">Display a message</p>
                </div>
              </button>
              
              <button
                onClick={() => addNode('question')}
                className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
              >
                <div className="w-10 h-10 bg-purple-500 text-white rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Question Step</p>
                  <p className="text-sm text-gray-500">Multiple choice options</p>
                </div>
              </button>
            </div>
          </div>

          {/* Connection Mode Info */}
          {connectionMode && (
            <div className="mt-6 p-4 bg-amber-50 rounded-lg">
              <p className="text-sm font-medium text-amber-800 mb-2">Connection Mode Active</p>
              <p className="text-xs text-amber-600 mb-3">Click on any node to connect</p>
              <button
                onClick={cancelConnection}
                className="w-full px-3 py-1.5 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
              >
                Cancel Connection
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {flowData.name || 'Untitled Flow'}
            </h2>
            <div className="flex items-center gap-3">
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

        {/* Canvas */}
        <div 
          ref={canvasRef}
          className={`flex-1 relative overflow-hidden bg-gray-50 ${
            connectionMode ? 'cursor-crosshair' : ''
          }`}
          onClick={() => connectionMode && cancelConnection()}
        >
          {errors.steps && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 p-4 bg-red-50 border border-red-200 rounded-lg z-20">
              <p className="text-sm text-red-600">{errors.steps}</p>
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg flex items-center gap-2 p-2 z-20">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Zoom out"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="px-2 text-sm font-medium text-gray-700">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Zoom in"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Reset zoom"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Canvas content with zoom */}
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: '100%',
              height: '100%',
              position: 'absolute'
            }}
          >
            {/* SVG for connections */}
            <svg
              className="absolute inset-0 pointer-events-none"
              style={{ width: '5000px', height: '5000px', zIndex: 1 }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="5"
                  orient="auto"
                >
                  <path
                    d="M 0 0 L 10 5 L 0 10 z"
                    fill="#64748b"
                  />
                </marker>
              </defs>
              
              {/* Render all connections */}
              {nodes.map(node => 
                node.connections.map(conn => renderConnection(node, conn))
              )}
            </svg>

            {/* Nodes */}
            {nodes.map(node => (
              <div
                key={node.id}
                className={`absolute bg-white rounded-lg shadow-lg border-2 transition-all flow-node ${
                  selectedNode?.id === node.id 
                    ? 'border-amber-500 shadow-xl ring-2 ring-amber-200' 
                    : 'border-gray-200 hover:shadow-xl'
                } ${draggingNode?.id === node.id ? 'cursor-grabbing' : 'cursor-grab'}
                ${connectionMode && hoveredNode === node.id ? 'border-green-500 shadow-xl ring-2 ring-green-200' : ''}
                ${connectionMode && connectionMode.fromNodeId === node.id ? 'opacity-50' : ''}`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: '300px',
                  zIndex: selectedNode?.id === node.id ? 10 : 2
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onMouseEnter={() => connectionMode && setHoveredNode(node.id)}
                onMouseLeave={() => connectionMode && setHoveredNode(null)}
                onClick={(e) => {
                  if (connectionMode && connectionMode.fromNodeId !== node.id) {
                    e.stopPropagation();
                    completeConnection(node.id);
                  }
                }}
              >
                {/* Node Header */}
                <div className={`px-4 py-3 rounded-t-lg flex items-center justify-between ${
                  node.step.step_type === 'text' ? 'bg-blue-500' : 'bg-purple-500'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                      {node.step.step_type === 'text' ? (
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-white font-medium">
                      {node.step.step_type === 'text' ? 'Text' : 'Question'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNode(node.id);
                    }}
                    className="text-white/70 hover:text-white no-drag"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Node Content */}
                <div className="p-4">
                  <p className="text-sm text-gray-900 font-medium mb-2" dir="rtl">
                    {node.step.content_ar || 'Click edit to add content'}
                  </p>
                  {node.step.content_en && (
                    <p className="text-sm text-gray-600">
                      {node.step.content_en}
                    </p>
                  )}
                  
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(node);
                        setSelectedStep(node.step);
                        setShowStepEditor(true);
                      }}
                      className="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium text-gray-700 no-drag"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Connection Actions */}
                <div className="border-t p-2 no-drag">
                  {node.step.step_type === 'text' && (
                    <button
                      className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        startConnection(node.id, 'default');
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      Connect to Next
                    </button>
                  )}
                  
                  {node.step.step_type === 'question' && (
                    <div className="space-y-1">
                      {['option1', 'option2', 'option3', 'option4'].map((opt, index) => {
                        const text = node.step[`${opt}_text_ar`] || node.step[`${opt}_text_en`];
                        if (!text) return null;
                        
                        return (
                          <button
                            key={opt}
                            className="w-full px-2 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-xs font-medium transition-colors flex items-center justify-between gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              startConnection(node.id, 'option', index);
                            }}
                          >
                            <span className="truncate">{text}</span>
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start Building Your Flow</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Add steps from the sidebar and connect them to create your flow
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step Editor Modal */}
      {showStepEditor && selectedStep && (
        <FlowStepEditor
          step={selectedStep}
          steps={nodes.map(n => n.step)}
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

export default FlowBuilderCanvas;