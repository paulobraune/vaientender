document.addEventListener('DOMContentLoaded', function() {
  let pixels = []; 
  let currentFilter = 'all'; 

  const editPixelModal = new PixelModal({
    modalId: 'editPixelModal',
    mode: 'edit',
    saveCallback: updatePixel
  });

  editPixelModal.initialize();

  const deleteModal = {
    element: document.getElementById('deletePixelModal'),
    show: function() {
      this.element.classList.add('pixel-modal--show');
    },
    hide: function() {
      this.element.classList.remove('pixel-modal--show');
    }
  };

  document.querySelector('#deletePixelModal .pixel-modal__close').addEventListener('click', function() {
    deleteModal.hide();
  });

  document.getElementById('deletePixelModal').addEventListener('click', function(e) {
    if (e.target === this) {
      deleteModal.hide();
    }
  });

  document.getElementById('cancelDeleteBtn').addEventListener('click', function() {
    deleteModal.hide();
  });

  const platformInfo = {
    google: { 
      name: 'Google Ads', 
      imgUrl: 'https://assets.tracklead.com/social/google_ads_logo-min.png' 
    },
    facebook: { 
      name: 'Facebook', 
      imgUrl: 'https://assets.tracklead.com/social/facebook_ads_logo-min.png'
    },
    tiktok: { 
      name: 'TikTok', 
      imgUrl: 'https://assets.tracklead.com/social/tiktok_ads_logo-min.png' 
    },
    pinterest: { 
      name: 'Pinterest', 
      imgUrl: 'https://assets.tracklead.com/social/pinterest_ads_logo-min.png'
    },
    taboola: { 
      name: 'Taboola', 
      imgUrl: 'https://assets.tracklead.com/social/taboola_ads_logo-min.png'
    },
    ga4: { 
      name: 'Google Analytics 4', 
      imgUrl: 'https://assets.tracklead.com/social/ga4_logo-min.png'
    }
  };

  const platformFilter = document.getElementById('platformFilter');

  platformFilter.addEventListener('change', function() {
    currentFilter = this.value;
    renderPixels();
  });

  async function loadPixels() {
    try {
      const response = await fetch('/api/pixels');
      const data = await response.json();

      if (data.success) {
        pixels = data.pixels || [];
        editPixelModal.setExistingPixels(pixels);
        renderPixels();
      } else {
        showGlobalAlert(data.message || 'Error loading pixels', 'error');
        document.getElementById('loading-row').innerHTML = `
          <td colspan="5" class="text-center py-4">
            <div class="text-danger">
              <i class="fas fa-exclamation-circle me-2"></i>
              Failed to load pixels. <button class="btn btn-link p-0" onclick="location.reload()">Retry</button>
            </div>
          </td>
        `;
      }
    } catch (error) {
      showGlobalAlert('Error fetching pixels', 'error');
      document.getElementById('loading-row').innerHTML = `
        <td colspan="5" class="text-center py-4">
          <div class="text-danger">
            <i class="fas fa-exclamation-circle me-2"></i>
            Failed to load pixels. <button class="btn btn-link p-0" onclick="location.reload()">Retry</button>
          </div>
        </td>
      `;
    }
  }

  function renderPixels() {
    const tbody = document.getElementById('pixelsTableBody');
    const loadingRow = document.getElementById('loading-row');
    const emptyRow = document.getElementById('empty-row');

    const filteredPixels = currentFilter === 'all' 
      ? pixels 
      : pixels.filter(pixel => pixel.type === currentFilter);

    loadingRow.style.display = 'none';

    const loadingRowHTML = loadingRow.outerHTML;
    const emptyRowHTML = emptyRow.outerHTML;

    tbody.innerHTML = loadingRowHTML + emptyRowHTML;

    if (filteredPixels.length === 0) {
      document.getElementById('empty-row').style.display = '';
      return;
    } else {
      document.getElementById('empty-row').style.display = 'none';
    }

    filteredPixels.forEach(pixel => {
      const platform = platformInfo[pixel.type] || { 
        name: pixel.type, 
        imgUrl: 'https://assets.tracklead.com/social/default_logo-min.png'
      };

      const row = document.createElement('tr');
      row.setAttribute('data-pixel-id', pixel._id);

      row.innerHTML = `
        <td>${pixel.name}</td>
        <td>
          <div class="d-flex align-items-center">
            <div class="pixel-list-item__icon pixel-list-item__icon--${pixel.type}">
              <img src="${platform.imgUrl}" alt="${platform.name}" width="20" height="20" style="object-fit: contain;">
            </div>
            <span>${platform.name}</span>
          </div>
        </td>
        <td><code>${pixel.id}</code></td>
        <td>
          <span class="pixel-list-item__status ${pixel.active ? 'pixel-list-item__status--active' : 'pixel-list-item__status--inactive'}">
            ${pixel.active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <div class="pixel-list-item__actions">
            <button class="pixel-list-item__btn pixel-list-item__btn--edit edit-pixel" data-id="${pixel._id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="pixel-list-item__btn pixel-list-item__btn--delete delete-pixel" data-id="${pixel._id}" data-name="${pixel.name}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      `;

      tbody.appendChild(row);
    });

    document.querySelectorAll('.edit-pixel').forEach(button => {
      button.addEventListener('click', function() {
        const pixelId = this.getAttribute('data-id');
        openEditModal(pixelId);
      });
    });

    document.querySelectorAll('.delete-pixel').forEach(button => {
      button.addEventListener('click', function() {
        const pixelId = this.getAttribute('data-id');
        const pixelName = this.getAttribute('data-name');
        openDeleteModal(pixelId, pixelName);
      });
    });
  }

  async function openEditModal(pixelId) {
    const pixel = pixels.find(p => p._id === pixelId);
    if (!pixel) {
      showGlobalAlert('Pixel not found', 'error');
      return;
    }

    editPixelModal.show(pixel.type, pixel);
  }

  async function updatePixel(pixelData) {
    editPixelModal.setSaveButtonLoading(true);

    try {
      const response = await fetch(`/api/pixels/${pixelData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pixelData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || response.statusText);
      }

      const result = await response.json();

      if (result.success) {
        const index = pixels.findIndex(p => p._id === pixelData._id);
        if (index !== -1) {
          pixels[index] = {
            ...pixels[index],
            ...pixelData
          };
        }

        editPixelModal.hide();
        showGlobalAlert('Pixel updated successfully', 'success');

        renderPixels();
      } else {
        throw new Error(result.message || 'Failed to update pixel');
      }
    } catch (error) {
      showGlobalAlert(error.message || 'Failed to update pixel', 'error');
      editPixelModal.setSaveButtonLoading(false);
    }
  }

  function openDeleteModal(pixelId, pixelName) {
    document.getElementById('deletePixelName').textContent = pixelName;

    const confirmBtn = document.getElementById('confirmDeletePixel');
    confirmBtn.setAttribute('data-id', pixelId);
    confirmBtn.onclick = () => deletePixel(pixelId);

    deleteModal.show();
  }

  async function deletePixel(pixelId) {
    const confirmBtn = document.getElementById('confirmDeletePixel');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Deleting...';

    try {
      const response = await fetch(`/api/pixels/${pixelId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || response.statusText);
      }

      const result = await response.json();

      if (result.success) {
        pixels = pixels.filter(p => p._id !== pixelId);

        deleteModal.hide();
        showGlobalAlert('Pixel deleted successfully', 'success');

        renderPixels();
      } else {
        throw new Error(result.message || 'Failed to delete pixel');
      }
    } catch (error) {
      showGlobalAlert(error.message || 'Failed to delete pixel', 'error');
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = '<i class="fas fa-trash-alt me-1"></i> Delete Pixel';
    }
  }

  loadPixels();
});
