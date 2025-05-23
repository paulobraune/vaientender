      function togglePasswordVisibility(inputId) {
        const input = document.getElementById(inputId);
        const icon = input.parentElement.querySelector('.integration-toggle-password i');
        
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.replace('bi-eye', 'bi-eye-slash');
        } else {
          input.type = 'password';
          icon.classList.replace('bi-eye-slash', 'bi-eye');
        }
      }
      
      function showGlobalAlert(type, message) {
        const container = document.getElementById('integration-toast-container');
        const toast = document.createElement('div');
        toast.className = 'integration-toast toast-' + type;
        
        toast.innerHTML = 
          '<div class="toast-icon">' +
            '<i class="bi bi-' + (type === 'success' ? 'check-circle-fill' : 'exclamation-circle-fill') + '"></i>' +
          '</div>' +
          '<div class="toast-content">' + message + '</div>' +
          '<button type="button" class="toast-close">' +
            '<i class="bi bi-x"></i>' +
          '</button>';
        
        container.appendChild(toast);
        
        // Add show class after a small delay for animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto close after 5 seconds
        const closeTimeout = setTimeout(() => {
          toast.classList.remove('show');
          setTimeout(() => toast.remove(), 300);
        }, 5000);
        
        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
          clearTimeout(closeTimeout);
          toast.classList.remove('show');
          setTimeout(() => toast.remove(), 300);
        });
      }

      document.addEventListener('DOMContentLoaded', function() {
        // Checkout type toggle
        const checkoutTypeRadios = document.querySelectorAll('input[name="checkoutType"]');
        const checkoutDomainWrapper = document.getElementById('checkoutDomainWrapper');
        
        function toggleCheckoutDomain() {
          const selectedType = document.querySelector('input[name="checkoutType"]:checked').value;
          checkoutDomainWrapper.style.display = ['yampi', 'cartpanda'].includes(selectedType) ? 'block' : 'none';
        }
        
        checkoutTypeRadios.forEach(function(radio) {
          radio.addEventListener('change', toggleCheckoutDomain);
        });
        
        // Handle form submission
        const shopifyForm = document.getElementById('shopifyForm');
        shopifyForm.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const saveBtn = document.getElementById('saveShopifyBtn');
          saveBtn.disabled = true;
          saveBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Salvando...';
          
          const shopifyDomainInput = document.getElementById('shopifyDomain').value.trim();
          const checkoutType = document.querySelector('input[name="checkoutType"]:checked').value;
          const checkoutDomainValue = document.getElementById('checkoutDomain').value.trim();
          
          const payload = {
            platform: 'shopify',
            adminApiAccessToken: document.getElementById('shopifyApiToken').value,
            shopDomain: shopifyDomainInput ? shopifyDomainInput + '.myshopify.com' : '',
            checkoutType: checkoutType,
            checkoutDomain: (checkoutType === 'yampi' || checkoutType === 'cartpanda') ? checkoutDomainValue : null
          };
          
          const errors = [];
          if (!payload.adminApiAccessToken) errors.push("Token de acesso da API Admin é obrigatório.");
          if (!shopifyDomainInput) errors.push("Domínio Shopify (sem .myshopify.com) é obrigatório.");
          if ((checkoutType === 'yampi' || checkoutType === 'cartpanda') && !checkoutDomainValue) {
            errors.push("Domínio do Checkout Transparente é obrigatório para Yampi/CartPanda.");
          }
          
          if (errors.length > 0) {
            showGlobalAlert('error', errors.join('<br>'));
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bi bi-save-fill"></i> ' + 
              (payload.platform === 'shopify' ? 'Atualizar Integração' : 'Conectar Shopify');
            return;
          }
          
          try {
            const response = await fetch('/api/business/integration', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
              showGlobalAlert('success', 'Integração Shopify salva com sucesso!');
              setTimeout(() => window.location.reload(), 1500);
            } else {
              throw new Error(result.message || 'Erro ao salvar integração.');
            }
          } catch (err) {
            console.error(err);
            showGlobalAlert('error', err.message || 'Erro de comunicação com o servidor.');
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="bi bi-save-fill"></i> ' + 
              (payload.platform === 'shopify' ? 'Atualizar Integração' : 'Conectar Shopify');
          }
        });
        
        // Handle disconnect button
        const disconnectBtn = document.getElementById('disconnectShopifyBtn');
        if (disconnectBtn) {
          disconnectBtn.addEventListener('click', async function() {
            if (!confirm('Tem certeza que deseja desconectar a integração com Shopify?')) return;
            
            this.disabled = true;
            this.innerHTML = '<i class="bi bi-hourglass-split"></i> Desconectando...';
            
            try {
              const response = await fetch('/api/business/integration', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
              });
              
              const result = await response.json();
              
              if (response.ok && result.success) {
                showGlobalAlert('success', 'Integração desconectada com sucesso!');
                setTimeout(() => window.location.reload(), 1500);
              } else {
                throw new Error(result.message || 'Erro ao desconectar integração.');
              }
            } catch (err) {
              console.error(err);
              showGlobalAlert('error', err.message || 'Erro de comunicação com o servidor.');
              this.disabled = false;
              this.innerHTML = '<i class="bi bi-trash3-fill"></i> Desconectar';
            }
          });
        }
      });