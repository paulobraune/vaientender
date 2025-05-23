document.addEventListener('DOMContentLoaded', function () {
  let existingPixels = [];

  async function loadExistingPixels() {
    try {
      const response = await fetch('/api/pixels');
      const data = await response.json();

      if (data.success) {
        existingPixels = data.pixels || [];
        pixelModal.setExistingPixels(existingPixels);
      } else {
        showGlobalAlert(data.message, 'error');
      }
    } catch (error) {
      showGlobalAlert('Failed to fetch existing pixels', 'error');
    }
  }

  const pixelModal = new PixelModal({
    modalId: 'pixelModal',
    mode: 'add',
    saveCallback: savePixel,
  });

  pixelModal.initialize();

  const pixelCards = document.querySelectorAll('.pixel-card');

  if (pixelCards.length === 0) {
    showGlobalAlert('No pixel cards found!', 'error');
    return;
  }

  pixelCards.forEach((card) => {
    card.addEventListener('click', function (e) {
      e.preventDefault();
      const pixelType = card.dataset.pixel;
      pixelModal.show(pixelType);
    });
  });

  async function savePixel(pixelData) {
    pixelModal.setSaveButtonLoading(true);

    try {
      const response = await fetch('/api/pixels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pixelData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            'Server returned ' + response.status + ' ' + response.statusText
        );
      }

      const result = await response.json();

      if (result.success) {
        showGlobalAlert('Pixel adicionado com sucesso!', 'success');

        setTimeout(() => {
          pixelModal.hide();
          window.location.href = '/pixels/list-all-pixels';
        }, 1000);
      } else {
        showGlobalAlert(result.message || 'Erro ao adicionar pixel', 'error');
        pixelModal.setSaveButtonLoading(false);
      }
    } catch (error) {
      showGlobalAlert(
        error.message ||
          'Ocorreu um erro ao salvar o pixel. Por favor, tente novamente.',
        'error'
      );
      pixelModal.setSaveButtonLoading(false);
    }
  }

  loadExistingPixels();
});
