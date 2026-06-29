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

  // Default colors — preserve the original black-and-white look when no theme is set.
  var THEME_DEFAULTS = { primaryColor: '#000000', backgroundColor: '#ffffff', textColor: '#1a1a1a' };

  // Pick a readable label color (black or white) for a given button background.
  function contrastColor(hex) {
    if (!hex) return '#ffffff';
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h.split('').map(function(c) { return c + c; }).join('');
    if (h.length !== 6) return '#ffffff';
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    var luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#111111' : '#ffffff';
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

      // Resolve theme (falls back to defaults so un-themed flows look unchanged)
      const theme = Object.assign({}, THEME_DEFAULTS, config.theme || {});
      const primaryText = contrastColor(theme.primaryColor);

      // Create modal dialog
      const dialog = document.createElement('dialog');
      dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        margin: 0;
        border: none;
        border-radius: 12px;
        padding: 40px;
        max-width: 500px;
        background: ${theme.backgroundColor};
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

        const primaryBtnStyle = `padding: 10px 20px; background: ${theme.primaryColor}; color: ${primaryText}; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s;`;
        const backBtnStyle = `padding: 10px 20px; border: 1px solid #ddd; border-radius: 6px; background: ${theme.backgroundColor}; color: ${theme.textColor}; cursor: pointer; font-weight: 500; transition: all 0.2s;`;

        dialog.innerHTML = `
          <div style="text-align: center;">
            <h2 style="margin: 0 0 12px 0; font-size: 24px; font-weight: bold; color: ${theme.textColor};">
              ${escapeHtml(step.title) || 'Step ' + (currentStep + 1)}
            </h2>
            <p style="margin: 0 0 28px 0; color: ${theme.textColor}; opacity: 0.7; line-height: 1.5;">
              ${escapeHtml(step.description)}
            </p>
            <p style="margin: 0 0 24px 0; font-size: 13px; color: ${theme.textColor}; opacity: 0.45;">
              Step ${currentStep + 1} of ${steps.length}
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
              ${currentStep > 0 ? `<button id="prev" style="${backBtnStyle}">Back</button>` : ''}
              ${currentStep < steps.length - 1 ? `<button id="next" style="${primaryBtnStyle}">Next</button>` : `<button id="finish" style="${primaryBtnStyle}">Done</button>`}
            </div>
          </div>
        `;

        const nextBtn = dialog.querySelector('#next');
        const prevBtn = dialog.querySelector('#prev');
        const finishBtn = dialog.querySelector('#finish');

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
