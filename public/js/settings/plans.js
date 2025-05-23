      document.addEventListener('DOMContentLoaded', function() {
        function showGlobalAlert(type, message) {
          const container = document.getElementById('plans-toast-container');
          const toast = document.createElement('div');
          toast.className = 'integration-toast toast-' + type;
          
          // Removido uso de backticks aninhados
          toast.innerHTML = '<div class="toast-icon">' +
              '<i class="bi bi-' + (type === 'success' ? 'check-circle-fill' : 'exclamation-circle-fill') + '"></i>' +
            '</div>' +
            '<div class="toast-content">' + message + '</div>' +
            '<button class="toast-close">' +
              '<i class="bi bi-x"></i>' +
            '</button>';
          
          container.appendChild(toast);
          setTimeout(() => toast.classList.add('show'), 10);
          
          const closeTimeout = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
          }, 5000);
          
          toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(closeTimeout);
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
          });
        }

        // Modal & plan logic
        const modal = document.getElementById('planConfirmModal');
        const selectedPlanName = document.getElementById('selectedPlanName');
        const selectedPlanPrice = document.getElementById('selectedPlanPrice');
        const confirmPlanButton = document.getElementById('confirmPlanButton');
        const modalCloseBtn = document.getElementById('modalCloseBtn');
        const modalCancelBtn = document.getElementById('modalCancelBtn');
        let selectedPlan = null;
        let selectedPlanCurrency = 'BRL';

        function showModal() { modal.classList.add('show'); }
        function hideModal() { modal.classList.remove('show'); }

        modalCloseBtn.addEventListener('click', hideModal);
        modalCancelBtn.addEventListener('click', hideModal);

        ${needsCountry ? `
        // Country form handling
        const countryForm = document.getElementById('countryForm');
        const plansContainer = document.getElementById('plansContainer');
        countryForm.addEventListener('submit', async function(e) {
          e.preventDefault();
          const countrySelect = document.getElementById('country');
          const selectedCountry = countrySelect.value;
          if (!selectedCountry) {
            showGlobalAlert('error', 'Por favor, selecione um país.');
            return;
          }
          const submitBtn = document.getElementById('submitCountryBtn');
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Processando...';
          try {
            const response = await fetch('/api/business/billing', {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                type: 'business', name: 'Pending completion',
                taxId: '00000000000', country: selectedCountry,
                address1: 'Pending', address2: '',
                zipcode: '00000000', city: 'Pending', state: 'Pending'
              })
            });
            const result = await response.json();
            if (result.success) {
              window.location.reload();
            } else {
              throw new Error(result.message || 'Erro ao salvar país.');
            }
          } catch (error) {
            showGlobalAlert('error', error.message || 'Erro ao salvar país.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-check2-circle"></i> Continuar';
          }
        });
        ` : ''}

        // Plan buttons
        const planButtons = document.querySelectorAll('.plan-button:not([disabled])');
        planButtons.forEach(button => {
          button.addEventListener('click', function() {
            selectedPlan = this.getAttribute('data-plan');
            selectedPlanCurrency = this.getAttribute('data-currency');
            const planNames = {
              'starter': 'Starter',
              'pro': 'Pro',
              'business': 'Business',
              'enterprise': 'Enterprise'
            };
            const planPrices = {
              'starter': selectedPlanCurrency === 'BRL' ? 'R$97' : '$19',
              'pro': selectedPlanCurrency === 'BRL' ? 'R$197' : '$39',
              'business': selectedPlanCurrency === 'BRL' ? 'R$397' : '$79',
              'enterprise': selectedPlanCurrency === 'BRL' ? 'R$697' : '$149'
            };
            selectedPlanName.textContent = planNames[selectedPlan] || selectedPlan;
            selectedPlanPrice.textContent = planPrices[selectedPlan] || '';
            showModal();
          });
        });

        // Confirm change
        confirmPlanButton.addEventListener('click', async function() {
          confirmPlanButton.disabled = true;
          confirmPlanButton.innerHTML = '<i class="bi bi-hourglass-split"></i> Processando...';
          try {
            const response = await fetch('/api/subscription/update-plan', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                plan: selectedPlan,
                planCurrency: selectedPlanCurrency
              })
            });
            const result = await response.json();
            if (result.success) {
              showGlobalAlert('success', 'Plano atualizado com sucesso!');
              setTimeout(() => {
                window.location.href = '/settings/subscription';
              }, 1500);
            } else {
              throw new Error(result.message || 'Erro ao atualizar plano.');
            }
          } catch (error) {
            showGlobalAlert('error', error.message || 'Erro ao atualizar plano.');
            confirmPlanButton.disabled = false;
            confirmPlanButton.innerHTML = '<i class="bi bi-check2"></i> Confirmar Alteração';
          } finally {
            hideModal();
          }
        });

        // Click outside to close
        modal.addEventListener('click', function(e) {
          if (e.target === modal) {
            hideModal();
          }
        });
      });