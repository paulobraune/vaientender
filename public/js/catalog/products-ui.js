document.addEventListener('DOMContentLoaded', function () {
  window.showError = function(message) {
    if (window.loadingRow) {
      window.loadingRow.innerHTML = `
        <td colspan="9" class="text-center py-4">
          <div class="text-danger">
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
            <button class="btn btn-link p-0 ms-2" onclick="location.reload()">Retry</button>
          </div>
        </td>`;
      window.loadingRow.style.display = '';
    }
    if (window.emptyRow) window.emptyRow.style.display = 'none';
    showGlobalAlert(message, 'error');
  };
});
