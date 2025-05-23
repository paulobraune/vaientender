 document.addEventListener('DOMContentLoaded', function() {
        function showGlobalAlert(type, message) {
          const container = document.getElementById('subscription-toast-container');
          const toast = document.createElement('div');
          toast.className = 'integration-toast toast-' + type;

          toast.innerHTML =
            '<div class="toast-icon">' +
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
        
        const cancelSubBtn = document.getElementById('cancelSubscriptionBtn');
        const cancelModal = document.getElementById('cancelSubscriptionModal');
        const cancelModalClose = document.getElementById('cancelModalClose');
        const cancelKeepSubBtn = document.getElementById('cancelKeepSubBtn');
        const confirmCancelBtn = document.getElementById('confirmCancelBtn');
        
        function openCancelModal() { cancelModal.classList.add('show'); }
        function closeCancelModal() { cancelModal.classList.remove('show'); }

        if (cancelSubBtn) cancelSubBtn.addEventListener('click', openCancelModal);
        if (cancelModalClose) cancelModalClose.addEventListener('click', closeCancelModal);
        if (cancelKeepSubBtn) cancelKeepSubBtn.addEventListener('click', closeCancelModal);
        cancelModal.addEventListener('click', e => { if (e.target === cancelModal) closeCancelModal(); });

        if (confirmCancelBtn) {
          confirmCancelBtn.addEventListener('click', async function() {
            this.disabled = true;
            this.innerHTML = '<i class="bi bi-hourglass-split"></i> Processando...';
            
            try {
              const response = await fetch('/api/subscription/cancel-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });
              const result = await response.json();
              
              if (result.success) {
                showGlobalAlert('success', 'Assinatura cancelada com sucesso.');
                setTimeout(() => window.location.reload(), 2000);
              } else {
                throw new Error(result.message || 'Erro ao cancelar assinatura.');
              }
            } catch (error) {
              showGlobalAlert('error', error.message || 'Erro ao cancelar assinatura.');
              this.disabled = false;
              this.innerHTML = '<i class="bi bi-x-circle"></i> Sim, cancelar assinatura';
            } finally {
              closeCancelModal();
            }
          });
        }
      });