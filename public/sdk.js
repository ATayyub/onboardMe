(function() {
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.OnboardMe = {
    init: async function(flowId, options = {}) {
      const baseUrl = options.baseUrl;
      const userId = options.userId || null;

      if (!flowId) {
        console.error('OnboardMe: flowId is required');
        return;
      }

      if (!baseUrl) {
        console.error('OnboardMe: baseUrl is required. Example: OnboardMe.init(\'' + flowId + '\', { baseUrl: \'https://your-onboardme-url.com\' })');
        return;
      }

      // Fetch flow config with error handling
      let config;
      try {
        const response = await fetch(`${baseUrl}/api/sdk/${flowId}/config`);
        if (!response.ok) {
          if (response.status === 404) {
            console.error('OnboardMe: Flow not found or not published', flowId);
          } else {
            console.error('OnboardMe: Failed to load flow', response.status);
          }
          return;
        }
        config = await response.json();
      } catch (error) {
        console.error('OnboardMe: Network error loading flow', error);
        return;
      }

      // Create modal dialog
      const dialog = document.createElement('dialog');
      dialog.style.cssText = `
        border: none;
        border-radius: 12px;
        padding: 40px;
        max-width: 500px;
        box-shadow: 0 20px 25px rgba(0,0,0,0.15);
        backdrop-filter: blur(4px);
      `;

      let currentStep = 0;
      const steps = config.config || [];

      if (!steps || steps.length === 0) {
        console.error('OnboardMe: Flow has no steps');
        return;
      }

      const renderStep = () => {
        const step = steps[currentStep];
        if (!step) return;

        dialog.innerHTML = `
          <div style="text-align: center;">
            <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: bold; color: #1a1a1a;">
              ${escapeHtml(step.title) || 'Step ' + (currentStep + 1)}
            </h2>
            <p style="margin: 0 0 28px 0; color: #666; line-height: 1.5;">
              ${escapeHtml(step.description)}
            </p>
            <p style="margin: 0 0 24px 0; font-size: 13px; color: #999;">
              Step ${currentStep + 1} of ${steps.length}
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
              ${currentStep > 0 ? `<button id="prev" style="padding: 10px 20px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer; font-weight: 500; transition: all 0.2s;">Back</button>` : ''}
              ${currentStep < steps.length - 1 ? `<button id="next" style="padding: 10px 20px; background: black; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s;">Next</button>` : `<button id="finish" style="padding: 10px 20px; background: black; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s;">Done</button>`}
            </div>
          </div>
        `;

        const nextBtn = document.getElementById('next');
        const prevBtn = document.getElementById('prev');
        const finishBtn = document.getElementById('finish');

        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            fireEvent('step_viewed', currentStep + 1);
            currentStep++;
            renderStep();
          });
        }
        if (prevBtn) {
          prevBtn.addEventListener('click', () => {
            currentStep--;
            renderStep();
          });
        }
        if (finishBtn) {
          finishBtn.addEventListener('click', () => {
            fireEvent('flow_completed');
            dialog.close();
          });
        }
      };

      const fireEvent = (eventType, stepIndex = null) => {
        fetch(`${baseUrl}/api/sdk/${flowId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType, stepIndex, userId, url: window.location.href }),
        }).catch(e => console.warn('OnboardMe: Failed to record event', e));
      };

      try {
        document.body.appendChild(dialog);
        fireEvent('flow_started');
        renderStep();
        dialog.showModal();

        // Close on outside click
        dialog.addEventListener('click', (e) => {
          if (e.target === dialog) {
            dialog.close();
          }
        });
      } catch (error) {
        console.error('OnboardMe: Failed to render dialog', error);
      }
    },
  };
})();
