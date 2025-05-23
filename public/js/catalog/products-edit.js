document.addEventListener('DOMContentLoaded', function () {
  window.performTaxonomyLookup = async function(taxonomyId, responseLanguage = window.userLanguage) {
    if (!taxonomyId) return null;
    const loadingEl = document.getElementById('taxonomyLoading') || document.getElementById('bulkTaxonomyLoading');
    if (loadingEl) loadingEl.style.display = 'flex';
    try {
      const taxonomyUrl = window.process?.env?.API_TAXONOMY_ID || 'https://taxonomy.tracklead.com/get-category';
      const apiKey = window.API_AUTH_KEY || '';
      const response = await fetch(taxonomyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ id: taxonomyId, responseLanguage })
      });
      if (!response.ok) throw new Error(`API responded with ${response.status}`);
      const data = await response.json();
      return data.category || null;
    } catch (err) {
      showGlobalAlert('Error looking up taxonomy', 'error');
      return null;
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
    }
  };

  window.saveProductChanges = async function() {
    if (!window.currentEditingProduct) return;
    const status = document.getElementById('productStatus').value;
    const gender = document.getElementById('productGender').value;
    const age = document.getElementById('productAgeGroup').value;
    let taxonomyInput = document.getElementById('productTaxonomy');
    let catId = document.getElementById('productCategoryID').value;
    let catName = document.getElementById('productCategoryName').value;
    if (taxonomyInput && taxonomyInput.value.trim()) {
      catId = taxonomyInput.value.trim();
      catName = document.getElementById('taxonomyResult')?.value || '';
    }
    window.saveProductChangesButton.disabled = true;
    window.saveProductChangesButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    try {
      const productEditorUrl = '/api/products/custom-fields';
      const businessId = window.activeBusinessData?.id;
      if (!businessId) throw new Error('No active business found');
      const productToUpdate = {
        productId: window.currentEditingProduct.productId,
        exclude: status === 'inactive'
      };
      if (gender) productToUpdate.gender = gender;
      if (age) productToUpdate.age = age;
      if (catId || catName) {
        productToUpdate.google = {};
        if (catId) productToUpdate.google.productCategoryID = catId;
        if (catName) productToUpdate.google.productCategoryName = catName;
      }
      const resp = await fetch(productEditorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, products: [productToUpdate] })
      });
      if (!resp.ok) throw new Error(`Server responded with ${resp.status}`);
      const data = await resp.json();
      if (data.success) {
        const idx = window.products.findIndex(p => p.productId === window.currentEditingProduct.productId);
        if (idx > -1) {
          window.products[idx].exclude = status === 'inactive';
          if (gender) window.products[idx].gender = gender;
          if (age) window.products[idx].age = age;
          if (catId || catName) {
            window.products[idx].google = window.products[idx].google || {};
            if (catId) window.products[idx].google.productCategoryID = catId;
            if (catName) window.products[idx].google.productCategoryName = catName;
          }
        }
        window.renderProducts();
        hideModal('productDetailsModal');
        showGlobalAlert('Product updated successfully', 'success');
      } else {
        throw new Error(data.message || 'Failed to update product');
      }
    } catch (err) {
      showGlobalAlert(`Failed to update product: ${err.message}`, 'error');
    } finally {
      window.saveProductChangesButton.disabled = false;
      window.saveProductChangesButton.innerHTML = '<i class="fas fa-save me-1"></i> Save Changes';
    }
  };

  window.saveBulkChanges = async function() {
    if (!window.selectedProducts.size) return;
    const status = document.getElementById('bulkProductStatus').value;
    const gender = document.getElementById('bulkProductGender').value;
    const age = document.getElementById('bulkProductAgeGroup').value;
    let taxonomyInput = document.getElementById('bulkProductTaxonomy');
    let catId = document.getElementById('bulkProductCategoryID').value;
    let catName = document.getElementById('bulkProductCategoryName').value;
    if (taxonomyInput && taxonomyInput.value.trim()) {
      catId = taxonomyInput.value.trim();
      catName = document.getElementById('bulkTaxonomyResult')?.value || '';
    }
    window.saveBulkChangesButton.disabled = true;
    window.saveBulkChangesButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    try {
      const productEditorUrl = '/api/products/custom-fields';
      const businessId = window.activeBusinessData?.id;
      if (!businessId) throw new Error('No active business found');
      const updates = [];
      window.selectedProducts.forEach(pid => {
        const upd = { productId: pid };
        if (status) upd.exclude = status === 'inactive';
        if (gender) upd.gender = gender;
        if (age) upd.age = age;
        if (catId || catName) {
          upd.google = {};
          if (catId) upd.google.productCategoryID = catId;
          if (catName) upd.google.productCategoryName = catName;
        }
        updates.push(upd);
      });
      const resp = await fetch(productEditorUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, products: updates })
      });
      if (!resp.ok) throw new Error(`Server responded with ${resp.status}`);
      const data = await resp.json();
      if (data.success) {
        updates.forEach(u => {
          const idx = window.products.findIndex(p => p.productId === u.productId);
          if (idx > -1) {
            if (status) window.products[idx].exclude = status === 'inactive';
            if (gender) window.products[idx].gender = gender;
            if (age) window.products[idx].age = age;
            if (catId || catName) {
              window.products[idx].google = window.products[idx].google || {};
              if (catId) window.products[idx].google.productCategoryID = catId;
              if (catName) window.products[idx].google.productCategoryName = catName;
            }
          }
        });
        window.renderProducts();
        window.selectedProducts.clear();
        window.updateSelectedCount();
        window.updateBulkEditButton();
        hideModal('bulkEditModal');
        showGlobalAlert(`${updates.length} products updated successfully`, 'success');
      } else {
        throw new Error(data.message || 'Failed to update products');
      }
    } catch (err) {
      showGlobalAlert(`Failed to update products: ${err.message}`, 'error');
    } finally {
      window.saveBulkChangesButton.disabled = false;
      window.saveBulkChangesButton.innerHTML = '<i class="fas fa-save me-1"></i> Save Changes';
    }
  };

  window.openProductModal = function(productId) {
    const product = window.products.find(p => p.productId === productId);
    if (!product) return;
    window.currentEditingProduct = product;
    const modalContent = document.getElementById('productModalContent');
    if (!modalContent) return;

    const existingContent = modalContent.querySelector('.pixel-alert');
    if (existingContent) {
      modalContent.innerHTML = '';
      modalContent.appendChild(existingContent);
    } else {
      modalContent.innerHTML = '';
    }

    const regularPrice = product.regularPrice || product.price || 0;
    const compareAtPrice = product.compareAtPrice || 0;
    const hasDiscount = compareAtPrice > 0 && compareAtPrice < regularPrice;
    const priceHtml = hasDiscount
      ? `<div class="detail-regular-price">${window.formatCurrency(regularPrice)}</div>
         <div class="detail-sale-price">${window.formatCurrency(compareAtPrice)}</div>`
      : `<div class="detail-sale-price">${window.formatCurrency(regularPrice)}</div>`;
    const imageUrl = product.imageUrl || 'https://via.placeholder.com/120?text=No+Image';
    const genderOptions = [
      { value: '', label: 'Not specified' },
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'unisex', label: 'Unisex' }
    ];
    const ageGroupOptions = [
      { value: '', label: 'Not specified' },
      { value: 'newborn', label: 'Newborn - Up to 3 months' },
      { value: 'infant', label: 'Infant - 3 to 12 months' },
      { value: 'toddler', label: 'Toddler - 1 to 5 years' },
      { value: 'kids', label: 'Kids - 5 to 13 years' },
      { value: 'adult', label: 'Adult - 13 years and older' }
    ];
    let taxonomyId = '';
    let taxonomyName = '';
    if (product.google?.productCategoryID) {
      taxonomyId = product.google.productCategoryID;
      taxonomyName = product.google.productCategoryName || '';
    }

    const productDetails = document.createElement('div');
    productDetails.className = 'product-edit-form';

    productDetails.innerHTML = `
      <div class="product-detail-header">
        <div class="product-detail-image">
          <img src="${imageUrl}" alt="${product.title}">
        </div>
        <div class="product-detail-info">
          <h4 class="product-detail-title">${product.title}</h4>
          <div class="product-detail-id">ID: ${product.productId}</div>
          <div class="product-detail-price">${priceHtml}</div>
        </div>
      </div>

      <div class="pixel-form">
        <div class="row">
          <div class="col-md-6">
            <div class="pixel-form__group">
              <label class="pixel-form__label" for="productStatus">Status in Catalog</label>
              <select class="pixel-form__input" id="productStatus">
                <option value="active" ${!product.exclude ? 'selected' : ''}>Active</option>
                <option value="inactive" ${product.exclude ? 'selected' : ''}>Inactive</option>
              </select>
            </div>
          </div>
          <div class="col-md-6">
            <div class="pixel-form__group">
              <label class="pixel-form__label" for="productGender">Gender</label>
              <select class="pixel-form__input" id="productGender">
                ${genderOptions.map(o =>
                  `<option value="${o.value}" ${(product.gender || '') === o.value ? 'selected' : ''}>${o.label}</option>`
                ).join('')}
              </select>
            </div>
          </div>
        </div>
        <div class="row mt-3">
          <div class="col-md-6">
            <div class="pixel-form__group">
              <label class="pixel-form__label" for="productAgeGroup">Age Group</label>
              <select class="pixel-form__input" id="productAgeGroup">
                ${ageGroupOptions.map(o =>
                  `<option value="${o.value}" ${(product.age || '') === o.value ? 'selected' : ''}>${o.label}</option>`
                ).join('')}
              </select>
            </div>
          </div>
          <div class="col-md-6">
            <div class="pixel-form__group">
              <label class="pixel-form__label" for="productTaxonomy">Product Taxonomy</label>
              ${taxonomyId ? `
                <div class="taxonomy-current">
                  <div class="taxonomy-current-value">
                    <div class="taxonomy-name">${taxonomyName || 'Unknown taxonomy'}</div>
                  </div>
                  <div class="taxonomy-actions">
                    <button type="button" class="btn btn-sm btn-outline-danger" id="removeTaxonomyBtn">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              ` : `
                <div class="taxonomy-input-group">
                  <input type="number" class="pixel-form__input" id="productTaxonomy"
                       placeholder="Enter taxonomy ID" value="">
                  <button type="button" class="taxonomy-lookup-btn btn btn-primary" id="taxonomyLookupBtn">
                    <i class="fas fa-search"></i> Lookup
                  </button>
                </div>
              `}
              <div class="taxonomy-loading" id="taxonomyLoading" style="display:none;">
                <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                <span>Looking up taxonomy...</span>
              </div>
              <div class="taxonomy-result-container" id="taxonomyResultContainer" style="display:none;">
                <label class="taxonomy-result-label">Full Taxonomy:</label>
                <textarea class="taxonomy-result" id="taxonomyResult" rows="2" readonly></textarea>
              </div>
              <a href="/catalog/taxonomy-finder" target="_blank" class="taxonomy-link">
                Find Taxonomy
              </a>
              <input type="hidden" id="productCategoryID" value="${taxonomyId}">
              <input type="hidden" id="productCategoryName" value="${taxonomyName}">
            </div>
          </div>
        </div>
        <div id="productVideoField"></div>
        ${product.description ? `
          <div class="description-section mt-3">
            <h6 class="pixel-form__label">Description</h6>
            <div class="product-description">${product.description}</div>
          </div>` : ''}
      </div>
    `;

    modalContent.appendChild(productDetails);

    const taxonomyConfirmModal = `
      <div class="taxonomy-confirm-modal" id="taxonomyConfirmModal">
        <div class="taxonomy-confirm-content">
          <div class="taxonomy-confirm-header">
            <h5>Apply This Taxonomy?</h5>
            <button type="button" class="taxonomy-confirm-close">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="taxonomy-confirm-body">
            <p>Do you want to apply this taxonomy to your product?</p>
            <div class="taxonomy-confirm-details">
              <div class="taxonomy-confirm-id">ID: <span id="confirmTaxonomyId"></span></div>
              <div class="taxonomy-confirm-name" id="confirmTaxonomyName"></div>
            </div>
          </div>
          <div class="taxonomy-confirm-footer">
            <button type="button" class="taxonomy-btn taxonomy-btn-secondary" id="cancelTaxonomyBtn">
              Cancel
            </button>
            <button type="button" class="taxonomy-btn taxonomy-btn-primary" id="applyTaxonomyBtn">
              Apply Taxonomy
            </button>
          </div>
        </div>
      </div>
    `;

    if (!document.getElementById('taxonomyConfirmModal')) {
      const modalDiv = document.createElement('div');
      modalDiv.innerHTML = taxonomyConfirmModal;
      document.body.appendChild(modalDiv.firstChild);
    }

    setTimeout(() => {
      const removeTaxonomyBtn = document.getElementById('removeTaxonomyBtn');
      if (removeTaxonomyBtn) {
        removeTaxonomyBtn.addEventListener('click', async () => {
          try {
            const businessId = window.activeBusinessData?.id;
            if (!businessId) throw new Error('No active business found');
            const productEditorUrl = '/api/products/custom-fields';
            const resp = await fetch(productEditorUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                businessId,
                products: [{
                  productId: window.currentEditingProduct.productId,
                  google: {
                    productCategoryID: null,
                    productCategoryName: null
                  }
                }]
              })
            });
            if (!resp.ok) throw new Error(`Server responded with ${resp.status}`);
            const data = await resp.json();
            if (data.success) {
              document.getElementById('productCategoryID').value = '';
              document.getElementById('productCategoryName').value = '';
              const taxonomyGroup = removeTaxonomyBtn.closest('.pixel-form__group');
              taxonomyGroup.querySelector('.taxonomy-current').remove();
              const taxonomyInputGroup = document.createElement('div');
              taxonomyInputGroup.className = 'taxonomy-input-group';
              taxonomyInputGroup.innerHTML = `
                <input type="number" class="pixel-form__input" id="productTaxonomy"
                     placeholder="Enter taxonomy ID" value="">
                <button type="button" class="taxonomy-lookup-btn btn btn-primary" id="taxonomyLookupBtn">
                  <i class="fas fa-search"></i> Lookup
                </button>
              `;
              taxonomyGroup.insertBefore(taxonomyInputGroup, taxonomyGroup.firstChild);
              setupTaxonomyLookup();
              showGlobalAlert('Taxonomy removed successfully.', 'success');
            } else {
              throw new Error(data.message || 'Failed to remove taxonomy');
            }
          } catch (err) {
            showGlobalAlert(`Failed to remove taxonomy: ${err.message}`, 'error');
          }
        });
      }

      setupTaxonomyLookup();

      function setupTaxonomyLookup() {
        const btn = document.getElementById('taxonomyLookupBtn');
        const input = document.getElementById('productTaxonomy');
        if (btn && input) {
          btn.addEventListener('click', async () => {
            const id = input.value.trim();
            if (!id) {
              showGlobalAlert('Please enter a taxonomy ID', 'error');
              return;
            }
            try {
              const taxonomyLoadingEl = document.getElementById('taxonomyLoading');
              if (taxonomyLoadingEl) taxonomyLoadingEl.style.display = 'flex';
              const taxonomyUrl = window.process?.env?.API_TAXONOMY_ID || 'https://taxonomy.tracklead.com/get-category';
              const apiKey = window.API_AUTH_KEY || '';
              const response = await fetch(taxonomyUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': apiKey
                },
                body: JSON.stringify({
                  id: id,
                  responseLanguage: window.userLanguage || 'en'
                })
              });
              if (!response.ok) throw new Error(`API responded with ${response.status}`);
              const data = await response.json();
              const name = data.category || null;
              if (taxonomyLoadingEl) taxonomyLoadingEl.style.display = 'none';
              if (name) {
                showTaxonomyConfirmation(id, name);
              } else {
                showGlobalAlert('Taxonomy not found.', 'error');
              }
            } catch (err) {
              showGlobalAlert('Error: ' + err.message, 'error');
              const taxonomyLoadingEl = document.getElementById('taxonomyLoading');
              if (taxonomyLoadingEl) taxonomyLoadingEl.style.display = 'none';
            }
          });
          input.addEventListener('keypress', e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              btn.click();
            }
          });
        }
      }

      function showTaxonomyConfirmation(id, name) {
        const modal = document.getElementById('taxonomyConfirmModal');
        const closeBtn = modal.querySelector('.taxonomy-confirm-close');
        const cancelBtn = document.getElementById('cancelTaxonomyBtn');
        const applyBtn = document.getElementById('applyTaxonomyBtn');
        document.getElementById('confirmTaxonomyId').textContent = id;
        document.getElementById('confirmTaxonomyName').textContent = name;
        modal.classList.add('show');
        const hideModal = () => {
          modal.classList.remove('show');
        };
        closeBtn.onclick = hideModal;
        cancelBtn.onclick = hideModal;
        modal.onclick = (e) => {
          if (e.target === modal) hideModal();
        };
        applyBtn.onclick = () => {
          document.getElementById('productCategoryID').value = id;
          document.getElementById('productCategoryName').value = name;
          document.getElementById('taxonomyResult').value = name;
          document.getElementById('taxonomyResultContainer').style.display = 'block';
          hideModal();
          showGlobalAlert('Taxonomy applied! Don\'t forget to save your changes.', 'success');
        };
      }
    }, 100);

    setTimeout(() => {
      window.setupVideoManagementButton(productId);
    }, 100);

    showModal('productDetailsModal');
  };

  window.openBulkEditModal = function() {
    const bulkModalContent = document.getElementById('bulkEditModalContent');
    if (!bulkModalContent) return;
    const existingContent = bulkModalContent.querySelector('.pixel-alert');
    if (existingContent) {
      bulkModalContent.innerHTML = '';
      bulkModalContent.appendChild(existingContent);
    } else {
      bulkModalContent.innerHTML = '';
    }
    const genderOptions = [
      { value: '', label: '- No change -' },
      { value: 'male', label: 'Male' },
      { value: 'female', label: 'Female' },
      { value: 'unisex', label: 'Unisex' }
    ];
    const ageGroupOptions = [
      { value: '', label: '- No change -' },
      { value: 'newborn', label: 'Newborn - Up to 3 months' },
      { value: 'infant', label: 'Infant - 3 to 12 months' },
      { value: 'toddler', label: 'Toddler - 1 to 5 years' },
      { value: 'kids', label: 'Kids - 5 to 13 years' },
      { value: 'adult', label: 'Adult - 13 years and older' }
    ];
    const statusOptions = [
      { value: '', label: '- No change -' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ];
    const count = window.selectedProducts.size;
    const bulkForm = document.createElement('div');
    bulkForm.className = 'pixel-form';
    bulkForm.innerHTML = `
      <div class="selected-count-info mb-3">
        <span class="badge bg-primary">${count} product${count > 1 ? 's' : ''} selected</span>
      </div>
      <div class="row">
        <div class="col-md-6">
          <div class="pixel-form__group">
            <label class="pixel-form__label" for="bulkProductStatus">Status in Catalog</label>
            <select class="pixel-form__input" id="bulkProductStatus">
              ${statusOptions.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="col-md-6">
          <div class="pixel-form__group">
            <label class="pixel-form__label" for="bulkProductGender">Gender</label>
            <select class="pixel-form__input" id="bulkProductGender">
              ${genderOptions.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <div class="pixel-form__group">
            <label class="pixel-form__label" for="bulkProductAgeGroup">Age Group</label>
            <select class="pixel-form__input" id="bulkProductAgeGroup">
              ${ageGroupOptions.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="col-md-6">
          <div class="pixel-form__group">
            <label class="pixel-form__label" for="bulkProductTaxonomy">Product Taxonomy</label>
            <div class="taxonomy-input-group">
              <input type="number" class="pixel-form__input" id="bulkProductTaxonomy" placeholder="Enter taxonomy ID">
              <button type="button" class="taxonomy-lookup-btn btn btn-primary" id="bulkTaxonomyLookupBtn">
                <i class="fas fa-search"></i> Lookup
              </button>
            </div>
            <div class="taxonomy-loading" id="bulkTaxonomyLoading" style="display:none;">
              <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
              <span>Looking up taxonomy...</span>
            </div>
            <div class="taxonomy-result-container" id="bulkTaxonomyResultContainer" style="display:none;">
              <label class="taxonomy-result-label">Full Taxonomy:</label>
              <textarea class="taxonomy-result" id="bulkTaxonomyResult" rows="2" readonly></textarea>
            </div>
            <a href="/catalog/taxonomy-finder" target="_blank" class="taxonomy-link">
              Find Taxonomy
            </a>
            <input type="hidden" id="bulkProductCategoryID" value="">
            <input type="hidden" id="bulkProductCategoryName" value="">
          </div>
        </div>
      </div>
    `;
    bulkModalContent.appendChild(bulkForm);

    setTimeout(() => {
      const btn = document.getElementById('bulkTaxonomyLookupBtn');
      const input = document.getElementById('bulkProductTaxonomy');
      const result = document.getElementById('bulkTaxonomyResult');
      const container = document.getElementById('bulkTaxonomyResultContainer');
      const hiddenId = document.getElementById('bulkProductCategoryID');
      const hiddenName = document.getElementById('bulkProductCategoryName');
      btn.addEventListener('click', async () => {
        const id = input.value.trim();
        if (!id) { showGlobalAlert('Please enter a taxonomy ID', 'error'); return; }
        try {
          const taxonomyUrl = window.process?.env?.API_TAXONOMY_ID || 'https://taxonomy.tracklead.com/get-category';
          const apiKey = window.API_AUTH_KEY || '';
          const response = await fetch(taxonomyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey
            },
            body: JSON.stringify({ id: id, responseLanguage: window.userLanguage || 'en' })
          });
          if (!response.ok) throw new Error(`API responded with ${response.status}`);
          const data = await response.json();
          const name = data.category || null;
          if (name) {
            result.value = name;
            container.style.display = 'block';
            hiddenId.value = id;
            hiddenName.value = name;
            showGlobalAlert('Taxonomy found!', 'success');
          } else {
            showGlobalAlert('Taxonomy not found.', 'error');
          }
        } catch (err) {
          showGlobalAlert('Error: ' + err.message, 'error');
        }
      });
      input.addEventListener('keypress', e => {
        if (e.key === 'Enter') { e.preventDefault(); btn.click(); }
      });
    }, 100);

    showModal('bulkEditModal');
  };

  if (window.bulkEditButton) window.bulkEditButton.addEventListener('click', window.openBulkEditModal);
  if (window.saveBulkChangesButton) window.saveBulkChangesButton.addEventListener('click', window.saveBulkChanges);
  if (window.saveProductChangesButton) window.saveProductChangesButton.addEventListener('click', window.saveProductChanges);

  function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('pixel-modal--show');
      document.body.style.overflow = 'hidden';
    }
  }

  function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('pixel-modal--show');
      document.body.style.overflow = '';
    }
  }

  document.querySelectorAll('.pixel-modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('pixel-modal--show');
        document.body.style.overflow = '';
      }
    });
    const closeBtn = modal.querySelector('.pixel-modal__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('pixel-modal--show');
        document.body.style.overflow = '';
      });
    }
  });
});
