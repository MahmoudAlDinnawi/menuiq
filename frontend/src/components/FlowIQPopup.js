import React, { useState, useEffect } from 'react';
import publicMenuApi from '../services/publicMenuApi';

const FlowIQPopup = ({ subdomain, language = 'ar', onComplete, onLanguageChange }) => {
  // Component initialization
  
  const [flow, setFlow] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [exitAnimation, setExitAnimation] = useState(false);
  const [nextStepContent, setNextStepContent] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [interactionId, setInteractionId] = useState(null);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [stepsPath, setStepsPath] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Component mounted with subdomain
    if (subdomain) {
      fetchFlow();
    }
  }, [subdomain]);

  // Handle auto-show when flow is loaded
  useEffect(() => {
    if (flow && flow.trigger_type === 'on_load' && !isVisible) {
      // Auto-show flow after configured delay
      
      // Preload all images in the flow
      const imagesToPreload = flow.steps
        .filter(step => step.image_url)
        .map(step => step.image_url);
      
      if (imagesToPreload.length > 0) {
        Promise.all(
          imagesToPreload.map(url => {
            return new Promise((resolve) => {
              const img = new Image();
              img.onload = resolve;
              img.onerror = resolve;
              img.src = url;
            });
          })
        ).then(() => {
          // All images loaded, show flow
          const timer = setTimeout(() => {
            showFlow();
          }, (flow.trigger_delay || 0) * 1000);
          
          return () => clearTimeout(timer);
        });
      } else {
        // No images to preload, show immediately
        const timer = setTimeout(() => {
          showFlow();
        }, (flow.trigger_delay || 0) * 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [flow]);

  const fetchFlow = async () => {
    try {
      // Fetching flow for subdomain
      setIsLoading(true);
      const response = await publicMenuApi.get(`/public/${subdomain}/flow`);
      // Process flow response
      if (response.data) {
        setFlow(response.data);
      } else {
        // No flow found, immediately call onComplete to show the menu
        // No flow found, show menu directly
        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      console.error('Failed to fetch flow:', error);
      // On error, also show the menu
      if (onComplete) {
        onComplete();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const showFlow = async () => {
    if (!flow || flow.steps.length === 0) return;
    
    setIsVisible(true);
    setCurrentStepIndex(0);
    
    // Start interaction tracking
    try {
      const response = await publicMenuApi.post(`/public/${subdomain}/flow-interaction`, {
        flow_id: flow.id,
        session_id: sessionId,
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
        browser: getBrowser()
      });
      setInteractionId(response.data.interaction_id);
    } catch (error) {
      console.error('Failed to start interaction:', error);
    }
  };

  const getCurrentStep = () => {
    if (!flow || !flow.steps || currentStepIndex >= flow.steps.length) return null;
    return flow.steps.sort((a, b) => a.order_position - b.order_position)[currentStepIndex];
  };

  const recordStepInteraction = async (stepId, optionSelected = null) => {
    if (!interactionId) return;
    
    try {
      await publicMenuApi.post(`/public/${subdomain}/flow-interaction/${interactionId}/step`, {
        step_id: stepId,
        option_selected: optionSelected
      });
      
      setStepsPath([...stepsPath, {
        step_id: stepId,
        timestamp: new Date(),
        option_selected: optionSelected
      }]);
    } catch (error) {
      console.error('Failed to record step:', error);
    }
  };

  const handleOptionClick = async (optionNumber, action, nextStepId) => {
    const currentStep = getCurrentStep();
    if (!currentStep) return;
    
    // Check if this is the language selection step (first step)
    if (currentStep.order_position === 1) {
      // Language selection
      if (optionNumber === 1) {
        setSelectedLanguage('ar');
        if (onLanguageChange) onLanguageChange('ar');
      } else if (optionNumber === 2) {
        setSelectedLanguage('en');
        if (onLanguageChange) onLanguageChange('en');
      }
    }
    
    await recordStepInteraction(currentStep.id, optionNumber);
    
    // Handle special actions
    if (action === 'go_to_menu') {
      closeFlow(true);
      // Scroll to menu or navigate as needed
      document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
    } else if (action === 'end_flow') {
      closeFlow(true);
    } else if (action && action.startsWith('go_to_category:')) {
      const categoryId = action.split(':')[1];
      closeFlow(true);
      // Navigate to category
      document.getElementById(`category-${categoryId}`)?.scrollIntoView({ behavior: 'smooth' });
    } else if (nextStepId) {
      // Navigate to next step
      const nextIndex = flow.steps.findIndex(s => s.id === nextStepId);
      if (nextIndex !== -1) {
        moveToStep(nextIndex);
      } else {
        closeFlow(true);
      }
    } else {
      // Default to next step in sequence
      moveToStep(currentStepIndex + 1);
    }
  };

  const moveToStep = (nextIndex) => {
    if (nextIndex >= flow.steps.length) {
      closeFlow(true);
      return;
    }
    
    // Smooth crossfade transition
    setIsTransitioning(true);
    
    // Fade out current content
    setExitAnimation(true);
    
    // Preload next step image if exists
    const nextStep = flow.steps.sort((a, b) => a.order_position - b.order_position)[nextIndex];
    if (nextStep?.image_url) {
      const img = new Image();
      img.src = nextStep.image_url;
    }
    
    // Small delay then switch content
    setTimeout(() => {
      setCurrentStepIndex(nextIndex);
      setExitAnimation(false);
      
      // Fade in new content
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(false);
        });
      });
    }, 250);
  };

  const closeFlow = async (completed = false) => {
    if (interactionId) {
      try {
        await publicMenuApi.put(`/public/${subdomain}/flow-interaction/${interactionId}`, {
          completed_at: new Date(),
          is_completed: completed,
          last_step_id: getCurrentStep()?.id,
          steps_path: stepsPath.map(s => ({
            step_id: s.step_id,
            timestamp: s.timestamp,
            option_selected: s.option_selected
          }))
        });
      } catch (error) {
        console.error('Failed to update interaction:', error);
      }
    }
    
    setIsVisible(false);
    setCurrentStepIndex(0);
    setInteractionId(null);
    setStepsPath([]);
    
    // Call onComplete callback when flow is closed
    if (onComplete) {
      onComplete();
    }
  };

  const getDeviceType = () => {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  };

  const getBrowser = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
    if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
    if (userAgent.indexOf('Safari') > -1) return 'Safari';
    if (userAgent.indexOf('Edge') > -1) return 'Edge';
    return 'Other';
  };

  // Auto-advance for text steps
  useEffect(() => {
    const currentStep = getCurrentStep();
    if (!currentStep || !isVisible || isTransitioning) return;
    
    if (currentStep.step_type === 'text' && currentStep.auto_advance) {
      const timer = setTimeout(() => {
        if (currentStep.default_next_step_id) {
          const nextIndex = flow.steps.findIndex(s => s.id === currentStep.default_next_step_id);
          if (nextIndex !== -1) {
            moveToStep(nextIndex);
          } else {
            moveToStep(currentStepIndex + 1);
          }
        } else {
          moveToStep(currentStepIndex + 1);
        }
      }, currentStep.auto_advance_delay);
      
      return () => clearTimeout(timer);
    }
  }, [currentStepIndex, isVisible, isTransitioning]);

  // Debug: Show loading state
  // Show loading state while fetching flow
  if (isLoading && subdomain) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-white text-2xl font-light animate-pulse">
          <div className="w-16 h-16 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-4" />
        </div>
      </div>
    );
  }
  
  if (!flow && subdomain) {
    // Waiting for flow to load
  }
  
  if (!flow || !isVisible) return null;

  const currentStep = getCurrentStep();
  if (!currentStep) return null;

  const content = selectedLanguage === 'ar' ? currentStep.content_ar : (currentStep.content_en || currentStep.content_ar);
  const getOptionText = (optionKey) => {
    const arText = currentStep[`${optionKey}_text_ar`];
    const enText = currentStep[`${optionKey}_text_en`];
    return selectedLanguage === 'ar' ? arText : (enText || arText);
  };

  const getAnimationClass = () => {
    switch (currentStep.animation_type) {
      case 'slide_up':
        return 'animate-slide-up';
      case 'slide_down':
        return 'animate-slide-down';
      case 'slide_left':
        return 'animate-slide-left';
      case 'slide_right':
        return 'animate-slide-right';
      case 'bounce':
        return 'animate-bounce';
      case 'zoom_in':
        return 'animate-zoom-in';
      default:
        return 'animate-fade-in';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Ultra-luxury cinematic background - persistent across transitions */}
      <div className="absolute inset-0 bg-black">
        {/* Base gradient that never changes */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/95 to-black" />
        
        {/* Continuous animated luxury particles */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Golden particles with continuous animation */}
          <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-radial from-amber-600/20 via-amber-700/10 to-transparent rounded-full filter blur-3xl animate-float-slow" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-amber-500/15 via-orange-600/10 to-transparent rounded-full filter blur-3xl animate-float-slower animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-radial from-amber-400/10 via-amber-600/5 to-transparent rounded-full filter blur-3xl animate-float-reverse animation-delay-4000" />
          
          {/* Continuous luxury light effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-900/5 via-transparent to-amber-800/5 animate-shimmer" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent animate-streak" />
        </div>
        
        {/* Subtle film grain for depth */}
        <div className="absolute inset-0 opacity-[0.02] mix-blend-screen">
          <div className="absolute inset-0 bg-noise animate-grain" />
        </div>
      </div>

      {/* Content Container with smooth background transition */}
      <div className="relative h-full flex items-center justify-center p-4 md:p-8">
        {/* Ambient light that transitions with content */}
        <div className={`absolute inset-0 transition-opacity duration-700 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-amber-500/10 via-amber-600/5 to-transparent rounded-full filter blur-3xl animate-pulse" />
        </div>
        {/* Skip/Close button */}
        <button
          onClick={() => closeFlow(false)}
          className="absolute top-8 right-8 text-white/60 hover:text-white transition-all duration-300 group flex items-center gap-2"
        >
          <span className="text-sm font-light opacity-0 group-hover:opacity-100 transition-opacity">
            {selectedLanguage === 'ar' ? 'تخطي' : 'Skip'}
          </span>
          <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center group-hover:border-white/60 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </button>

        {/* Main Content */}
        <div className={`max-w-4xl w-full mx-auto transition-all duration-300 ease-out transform ${
          exitAnimation ? 'opacity-0 scale-95' : 
          isTransitioning ? 'opacity-0 scale-105' : 
          'opacity-100 scale-100'
        }`}>
          {/* Full-width image if available */}
          {currentStep.image_url && (
            <div className="mb-12 rounded-2xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-700">
              <img 
                src={currentStep.image_url} 
                alt=""
                className="w-full h-64 md:h-96 object-cover"
                onError={(e) => {
                  e.target.parentElement.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Text Content */}
          <div className="text-center space-y-8">
            {/* Main text with luxury gradient */}
            <div 
              className={`relative text-3xl md:text-5xl lg:text-6xl leading-relaxed ${
                selectedLanguage === 'ar' ? 'font-arabic-luxury' : 'font-english-luxury'
              }`}
              dir={selectedLanguage === 'ar' ? 'rtl' : 'ltr'}
            >
              {/* Luxury text gradient glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 bg-clip-text text-transparent blur-lg opacity-30 animate-pulse" />
              
              {/* Main text with staggered animation */}
              <div className="relative">
                {content.split(' ').map((word, index) => (
                  <span
                    key={`${currentStepIndex}-${index}`}
                    className="inline-block animate-luxury-word-reveal mx-2 bg-gradient-to-r from-amber-100 via-white to-amber-100 bg-clip-text text-transparent"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animationDuration: '1s'
                    }}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Options for question type */}
            {currentStep.step_type === 'question' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 max-w-2xl mx-auto">
                {['option1', 'option2', 'option3', 'option4'].map((optionKey, index) => {
                  const optionText = getOptionText(optionKey);
                  if (!optionText) return null;
                  
                  return (
                    <button
                      key={optionKey}
                      onClick={() => handleOptionClick(
                        index + 1,
                        currentStep[`${optionKey}_action`],
                        currentStep[`${optionKey}_next_step_id`]
                      )}
                      className="group relative overflow-hidden rounded-2xl animate-luxury-option-reveal"
                      style={{
                        animationDelay: `${600 + (index * 150)}ms`
                      }}
                      dir={selectedLanguage === 'ar' ? 'rtl' : 'ltr'}
                    >
                      {/* Luxury glass background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-amber-800/5 to-transparent backdrop-blur-xl" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-100/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      
                      {/* Luxury border glow */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/20 via-amber-300/10 to-amber-400/20 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                      <div className="absolute inset-[1px] rounded-2xl bg-black/50 backdrop-blur-md" />
                      
                      {/* Content */}
                      <div className="relative px-8 py-6 md:px-10 md:py-8">
                        <span className={`block text-lg md:text-xl lg:text-2xl text-transparent bg-gradient-to-r from-amber-100 via-white to-amber-100 bg-clip-text group-hover:from-amber-200 group-hover:to-amber-200 transition-all duration-700 ${
                          selectedLanguage === 'ar' ? 'font-arabic-option' : 'font-english-option'
                        }`}>
                          {optionText}
                        </span>
                        
                        {/* Luxury hover effect */}
                        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress indicator - outside content container */}
      {flow.steps.length > 1 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-50">
          {flow.steps.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-700 ${
                index === currentStepIndex
                  ? 'w-12 bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 shadow-lg shadow-amber-300/20'
                  : index < currentStepIndex
                  ? 'w-2 bg-amber-100/40'
                  : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FlowIQPopup;