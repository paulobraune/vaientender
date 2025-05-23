document.addEventListener('DOMContentLoaded', function() {
  class SettingsComponent {
    constructor(options) {
      this.options = {
        cardId: '',
        modalId: '',
        statusId: '',
        form: {
          enabledId: '',
          settingsSectionId: '',
          cancelBtnId: '',
          saveBtnId: ''
        },
        api: {
          getEndpoint: '',
          saveEndpoint: ''
        },
        defaults: {},
        ...options
      };

      this.currentSettings = { ...this.options.defaults };
      this.elements = {
        card: document.getElementById(this.options.cardId),
        modal: document.getElementById(this.options.modalId),
        statusBadge: document.getElementById(this.options.statusId)?.querySelector('.badge'),
        form: {
          enabled: document.getElementById(this.options.form.enabledId),
          settingsSection: document.getElementById(this.options.form.settingsSectionId),
          cancelBtn: document.getElementById(this.options.form.cancelBtnId),
          saveBtn: document.getElementById(this.options.form.saveBtnId)
        }
      };

      this.modal = {
        element: this.elements.modal,
        show: () => {
          if (this.elements.modal) {
            this.elements.modal.classList.add('pixel-modal--show');
            document.body.style.overflow = 'hidden';
          }
        },
        hide: () => {
          if (this.elements.modal) {
            this.elements.modal.classList.remove('pixel-modal--show');
            document.body.style.overflow = '';
          }
        }
      };

      this.initialize();
    }

    initialize() {
      if (this.elements.card) {
        this.elements.card.addEventListener('click', () => {
          this.loadSettings();
          this.modal.show();
        });
      }

      if (this.elements.form.cancelBtn) {
        this.elements.form.cancelBtn.addEventListener('click', () => {
          this.modal.hide();
        });
      }

      if (this.elements.modal) {
        const closeBtn = this.elements.modal.querySelector('.pixel-modal__close');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            this.modal.hide();
          });
        }

        this.elements.modal.addEventListener('click', (e) => {
          if (e.target === this.elements.modal) {
            this.modal.hide();
          }
        });
      }

      if (this.elements.form.enabled && this.elements.form.settingsSection) {
        this.elements.form.enabled.addEventListener('change', () => {
          this.toggleSettingsSection();
        });
      }

      if (this.elements.form.saveBtn) {
        this.elements.form.saveBtn.addEventListener('click', () => {
          this.saveSettings();
        });
      }

      this.loadSettings();
    }

    toggleSettingsSection() {
      if (this.elements.form.enabled && this.elements.form.settingsSection) {
        if (this.elements.form.enabled.checked) {
          this.elements.form.settingsSection.classList.remove('pixel-settings-section--disabled');
        } else {
          this.elements.form.settingsSection.classList.add('pixel-settings-section--disabled');
        }
      }
    }

    updateStatusBadge() {
      if (this.elements.statusBadge) {
        if (this.currentSettings.enabled) {
          this.elements.statusBadge.className = 'badge bg-success';
          this.elements.statusBadge.textContent = 'Enabled';
        } else {
          this.elements.statusBadge.className = 'badge bg-secondary';
          this.elements.statusBadge.textContent = 'Disabled';
        }
      }
    }

    async loadSettings() {
      try {
        const response = await fetch(this.options.api.getEndpoint);

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            this.currentSettings = data.settings;
          } else {
            throw new Error(data.message || 'Failed to load settings');
          }
        } else {
          throw new Error("Server returned " + response.status);
        }

        this.updateUI();
        this.updateStatusBadge();
      } catch (error) {
        showGlobalAlert("Failed to load " + this.options.cardId + " settings. Using defaults.", "error");
        this.currentSettings = { ...this.options.defaults };
        this.updateUI();
      }
    }

    updateUI() {
      if (this.elements.form.enabled) {
        this.elements.form.enabled.checked = this.currentSettings.enabled;
      }
      this.toggleSettingsSection();
    }

    getFormValues() {
      return {
        enabled: this.elements.form.enabled ? this.elements.form.enabled.checked : false
      };
    }

    async saveSettings() {
      try {
        const settings = this.getFormValues();
        const validationError = this.validateSettings(settings);
        if (validationError) {
          showGlobalAlert(validationError, "error");
          return;
        }

        if (this.elements.form.saveBtn) {
          this.elements.form.saveBtn.disabled = true;
          this.elements.form.saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';
        }

        const response = await fetch(this.options.api.saveEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(settings)
        });

        if (!response.ok) {
          throw new Error("Server returned " + response.status);
        }

        const data = await response.json();

        if (data.success) {
          this.currentSettings = settings;
          this.updateStatusBadge();
          showGlobalAlert('Settings saved successfully', 'success');
          this.modal.hide();
        } else {
          throw new Error(data.message || 'Failed to save settings');
        }
      } catch (error) {
        showGlobalAlert("Failed to save " + this.options.cardId + " settings: " + error.message, "error");
      } finally {
        if (this.elements.form.saveBtn) {
          this.elements.form.saveBtn.disabled = false;
          this.elements.form.saveBtn.innerHTML = '<i class="fas fa-save me-1"></i> Save Settings';
        }
      }
    }

    validateSettings(settings) {
      return null;
    }
  }

  class HighTicketSettingsComponent extends SettingsComponent {
    constructor() {
      super({
        cardId: 'high-ticket-card',
        modalId: 'high-ticket-modal',
        statusId: 'high-ticket-status',
        form: {
          enabledId: 'high-ticket-enabled',
          settingsSectionId: 'high-ticket-settings',
          cancelBtnId: 'cancel-high-ticket-btn',
          saveBtnId: 'save-high-ticket-btn'
        },
        api: {
          getEndpoint: '/api/pixel-settings/high-ticket',
          saveEndpoint: '/api/pixel-settings/high-ticket'
        },
        defaults: {
          enabled: false,
          threshold: 600,
          eventName: 'Purchase - High Ticket'
        }
      });

      this.elements.form.threshold = document.getElementById('high-ticket-threshold');
      this.elements.form.eventName = document.getElementById('high-ticket-event-name');
    }

    updateUI() {
      super.updateUI();
      if (this.elements.form.threshold) {
        this.elements.form.threshold.value = this.currentSettings.threshold;
      }
      if (this.elements.form.eventName) {
        this.elements.form.eventName.value = this.currentSettings.eventName;
      }
    }

    getFormValues() {
      const settings = super.getFormValues();
      settings.threshold = this.elements.form.threshold ?
        parseInt(this.elements.form.threshold.value, 10) || this.options.defaults.threshold :
        this.options.defaults.threshold;
      settings.eventName = this.elements.form.eventName ?
        this.elements.form.eventName.value.trim() || this.options.defaults.eventName :
        this.options.defaults.eventName;
      return settings;
    }

    validateSettings(settings) {
      if (settings.threshold < 1) {
        return 'Threshold must be a positive number';
      }
      return null;
    }
  }

  class OrderPaidSettingsComponent extends SettingsComponent {
    constructor() {
      super({
        cardId: 'order-paid-card',
        modalId: 'order-paid-modal',
        statusId: 'order-paid-status',
        form: {
          enabledId: 'order-paid-enabled',
          settingsSectionId: 'order-paid-settings',
          cancelBtnId: 'cancel-order-paid-btn',
          saveBtnId: 'save-order-paid-btn'
        },
        api: {
          getEndpoint: '/api/pixel-settings/order-paid',
          saveEndpoint: '/api/pixel-settings/order-paid'
        },
        defaults: {
          enabled: false,
          delay: 24,
          eventName: 'Purchase - Order Paid',
          trackAllOrders: true
        }
      });

      this.elements.form.delay = document.getElementById('order-paid-delay');
      this.elements.form.eventName = document.getElementById('order-paid-event-name');
      this.elements.form.trackAllOrders = document.getElementById('order-paid-track-all');
    }

    updateUI() {
      super.updateUI();
      if (this.elements.form.delay) {
        this.elements.form.delay.value = this.currentSettings.delay;
      }
      if (this.elements.form.eventName) {
        this.elements.form.eventName.value = this.currentSettings.eventName;
      }
      if (this.elements.form.trackAllOrders) {
        this.elements.form.trackAllOrders.checked = this.currentSettings.trackAllOrders;
      }
    }

    getFormValues() {
      const settings = super.getFormValues();
      settings.delay = this.elements.form.delay ?
        parseInt(this.elements.form.delay.value, 10) || this.options.defaults.delay :
        this.options.defaults.delay;
      settings.eventName = this.elements.form.eventName ?
        this.elements.form.eventName.value.trim() || this.options.defaults.eventName :
        this.options.defaults.eventName;
      settings.trackAllOrders = this.elements.form.trackAllOrders ?
        this.elements.form.trackAllOrders.checked :
        this.options.defaults.trackAllOrders;
      return settings;
    }

    validateSettings(settings) {
      if (settings.delay < 0) {
        return 'Delay must be a non-negative number';
      }
      return null;
    }
  }

  class PaymentMethodSettingsComponent extends SettingsComponent {
    constructor() {
      super({
        cardId: 'payment-method-card',
        modalId: 'payment-method-modal',
        statusId: 'payment-method-status',
        form: {
          cancelBtnId: 'cancel-payment-method-btn',
          saveBtnId: 'save-payment-method-btn'
        },
        api: {
          getEndpoint: '/api/pixel-settings/payment-method',
          saveEndpoint: '/api/pixel-settings/payment-method'
        },
        defaults: {
          creditCard: {
            enabled: false,
            eventName: 'Purchase - credit_card'
          },
          pix: {
            enabled: false,
            eventName: 'Purchase - pix'
          },
          billet: {
            enabled: false,
            eventName: 'Purchase - billet'
          }
        }
      });

      this.elements.form.creditCard = {
        enabled: document.getElementById('credit-card-enabled'),
        settingsSection: document.getElementById('credit-card-settings'),
        eventName: document.getElementById('credit-card-event-name')
      };

      this.elements.form.pix = {
        enabled: document.getElementById('pix-enabled'),
        settingsSection: document.getElementById('pix-settings'),
        eventName: document.getElementById('pix-event-name')
      };

      this.elements.form.billet = {
        enabled: document.getElementById('billet-enabled'),
        settingsSection: document.getElementById('billet-settings'),
        eventName: document.getElementById('billet-event-name')
      };

      this.setupPaymentMethodToggles();
      this.checkBusinessCurrency();
    }

    setupPaymentMethodToggles() {
      if (this.elements.form.creditCard.enabled && this.elements.form.creditCard.settingsSection) {
        this.elements.form.creditCard.enabled.addEventListener('change', () => {
          this.togglePaymentMethodSection('creditCard');
        });
      }

      if (this.elements.form.pix.enabled && this.elements.form.pix.settingsSection) {
        this.elements.form.pix.enabled.addEventListener('change', () => {
          this.togglePaymentMethodSection('pix');
        });
      }

      if (this.elements.form.billet.enabled && this.elements.form.billet.settingsSection) {
        this.elements.form.billet.enabled.addEventListener('change', () => {
          this.togglePaymentMethodSection('billet');
        });
      }
    }

    async checkBusinessCurrency() {
      try {
        if (window.activeBusinessData && window.activeBusinessData.currency) {
          if (window.activeBusinessData.currency === 'BRL') {
            this.showCard();
          }
          return;
        }

        const response = await fetch('/api/user/active-business');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.business && data.business.currency === 'BRL') {
            this.showCard();
          }
        }
      } catch (error) {}
    }

    showCard() {
      if (this.elements.card) {
        this.elements.card.style.display = '';
      }
    }

    togglePaymentMethodSection(method) {
      const formElements = this.elements.form[method];
      if (formElements.enabled && formElements.settingsSection) {
        if (formElements.enabled.checked) {
          formElements.settingsSection.classList.remove('pixel-settings-section--disabled');
        } else {
          formElements.settingsSection.classList.add('pixel-settings-section--disabled');
        }
      }
    }

    updateUI() {
      if (this.elements.form.creditCard.enabled) {
        this.elements.form.creditCard.enabled.checked = this.currentSettings.creditCard.enabled;
      }
      if (this.elements.form.creditCard.eventName) {
        this.elements.form.creditCard.eventName.value = this.currentSettings.creditCard.eventName;
      }
      this.togglePaymentMethodSection('creditCard');

      if (this.elements.form.pix.enabled) {
        this.elements.form.pix.enabled.checked = this.currentSettings.pix.enabled;
      }
      if (this.elements.form.pix.eventName) {
        this.elements.form.pix.eventName.value = this.currentSettings.pix.eventName;
      }
      this.togglePaymentMethodSection('pix');

      if (this.elements.form.billet.enabled) {
        this.elements.form.billet.enabled.checked = this.currentSettings.billet.enabled;
      }
      if (this.elements.form.billet.eventName) {
        this.elements.form.billet.eventName.value = this.currentSettings.billet.eventName;
      }
      this.togglePaymentMethodSection('billet');

      this.updateStatusBadge();
    }

    getFormValues() {
      return {
        creditCard: {
          enabled: this.elements.form.creditCard.enabled ? this.elements.form.creditCard.enabled.checked : false,
          eventName: this.elements.form.creditCard.eventName ?
            this.elements.form.creditCard.eventName.value.trim() || this.options.defaults.creditCard.eventName :
            this.options.defaults.creditCard.eventName
        },
        pix: {
          enabled: this.elements.form.pix.enabled ? this.elements.form.pix.enabled.checked : false,
          eventName: this.elements.form.pix.eventName ?
            this.elements.form.pix.eventName.value.trim() || this.options.defaults.pix.eventName :
            this.options.defaults.pix.eventName
        },
        billet: {
          enabled: this.elements.form.billet.enabled ? this.elements.form.billet.enabled.checked : false,
          eventName: this.elements.form.billet.eventName ?
            this.elements.form.billet.eventName.value.trim() || this.options.defaults.billet.eventName :
            this.options.defaults.billet.eventName
        }
      };
    }

    updateStatusBadge() {
      if (this.elements.statusBadge) {
        const anyEnabled =
          this.currentSettings.creditCard.enabled ||
          this.currentSettings.pix.enabled ||
          this.currentSettings.billet.enabled;

        if (anyEnabled) {
          this.elements.statusBadge.className = 'badge bg-success';
          this.elements.statusBadge.textContent = 'Enabled';
        } else {
          this.elements.statusBadge.className = 'badge bg-secondary';
          this.elements.statusBadge.textContent = 'Disabled';
        }
      }
    }
  }

  class FacebookSinglePixelComponent {
    constructor() {
      this.modalId = 'facebook-single-pixel-modal';
      this.cardId = 'facebook-single-pixel-card';
      this.statusId = 'facebook-single-pixel-status';
      this.listId = 'facebook-pixel-list';
      this.noPixelsId = 'no-facebook-pixels';
      this.facebookPixels = [];

      this.elements = {
        card: document.getElementById(this.cardId),
        modal: document.getElementById(this.modalId),
        statusBadge: document.getElementById(this.statusId)?.querySelector('.badge'),
        list: document.getElementById(this.listId),
        noPixels: document.getElementById(this.noPixelsId),
        closeBtn: document.getElementById('close-facebook-single-pixel-btn'),
        helpLink: document.getElementById('facebook-single-pixel-help-link')
      };

      this.modal = {
        element: this.elements.modal,
        show: () => {
          if (this.elements.modal) {
            this.elements.modal.classList.add('pixel-modal--show');
            document.body.style.overflow = 'hidden';
          }
        },
        hide: () => {
          if (this.elements.modal) {
            this.elements.modal.classList.remove('pixel-modal--show');
            document.body.style.overflow = '';
          }
        }
      };

      this.initialize();
    }

    initialize() {
      this.checkFacebookPixels();
      if (this.elements.card) {
        this.elements.card.addEventListener('click', function() {
          this.loadFacebookPixels();
          this.modal.show();
        }.bind(this));
      }
      if (this.elements.closeBtn) {
        this.elements.closeBtn.addEventListener('click', () => {
          this.modal.hide();
        });
      }
      const closeBtn = this.elements.modal.querySelector('.pixel-modal__close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.modal.hide();
        });
      }
      this.elements.modal.addEventListener('click', (e) => {
        if (e.target === this.elements.modal) {
          this.modal.hide();
        }
      });
      if (this.elements.helpLink) {
        this.elements.helpLink.addEventListener('click', (e) => {
          e.preventDefault();
        });
      }
    }

    async checkFacebookPixels() {
      try {
        const response = await fetch('/api/pixels');
        if (!response.ok) {
          throw new Error("Server returned " + response.status);
        }
        const data = await response.json();
        if (data.success) {
          this.facebookPixels = data.pixels.filter(pixel => pixel.type === 'facebook');
          this.updateStatusBadge();
        } else {
          throw new Error(data.message || 'Failed to load pixels');
        }
      } catch (error) {
        this.facebookPixels = [];
        this.updateStatusBadge();
      }
    }

    updateStatusBadge() {
      if (this.elements.statusBadge) {
        if (this.facebookPixels.length > 0) {
          this.elements.statusBadge.className = 'badge bg-warning';
          this.elements.statusBadge.textContent = 'Ready to use';
        } else {
          this.elements.statusBadge.className = 'badge bg-secondary';
          this.elements.statusBadge.textContent = 'Disabled';
        }
      }
    }

    async loadFacebookPixels() {
      try {
        this.elements.list.innerHTML = '<div class="text-center p-3">' +
          '<div class="spinner-border spinner-border-sm text-primary mb-2" role="status">' +
          '<span class="visually-hidden">Loading...</span>' +
          '</div>' +
          '<p class="mb-0">Loading Facebook pixels...</p>' +
          '</div>';
        this.elements.noPixels.style.display = 'none';
        const response = await fetch('/api/pixels');
        if (!response.ok) {
          throw new Error("Server returned " + response.status);
        }
        const data = await response.json();
        if (data.success) {
          this.facebookPixels = data.pixels.filter(pixel => pixel.type === 'facebook');
          this.updateStatusBadge();
          this.displayFacebookPixels();
        } else {
          throw new Error(data.message || 'Failed to load pixels');
        }
      } catch (error) {
        this.elements.list.innerHTML = '<div class="pixel-alert pixel-alert--danger">' +
          '<div class="pixel-alert__icon">' +
          '<i class="fas fa-exclamation-triangle"></i>' +
          '</div>' +
          '<div class="pixel-alert__content">' +
          '<h5 class="pixel-alert__title">Error Loading Facebook Pixels</h5>' +
          '<p class="pixel-alert__text">Failed to load Facebook pixels: ' + error.message + '</p>' +
          '</div>' +
          '</div>';
      }
    }

    displayFacebookPixels() {
      if (this.facebookPixels.length === 0) {
        this.elements.list.innerHTML = '';
        this.elements.noPixels.style.display = 'block';
        return;
      }
      this.elements.noPixels.style.display = 'none';
      let listHtml = '<div class="table-responsive">' +
        '<table class="table align-middle">' +
        '<thead>' +
        '<tr>' +
        '<th>Name</th>' +
        '<th>Pixel ID</th>' +
        '<th>Short ID</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>';
      this.facebookPixels.forEach(pixel => {
        listHtml += '<tr>' +
          '<td>' + pixel.name + '</td>' +
          '<td><code>' + pixel.id + '</code></td>' +
          '<td>' +
          '<div class="d-flex align-items-center">' +
          '<code class="me-2">' + (pixel.short || 'N/A') + '</code>' +
          (pixel.short ?
          '<button class="btn btn-sm btn-outline-primary copy-short-id" data-short-id="' + pixel.short + '">' +
          '<i class="fas fa-copy"></i>' +
          '</button>' : '') +
          '</div>' +
          '</td>' +
          '</tr>';
      });
      listHtml += '</tbody>' +
        '</table>' +
        '</div>';
      this.elements.list.innerHTML = listHtml;
      const copyButtons = this.elements.list.querySelectorAll('.copy-short-id');
      copyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          const shortId = button.getAttribute('data-short-id');
          this.copyToClipboard(shortId, button);
        });
      });
    }

    copyToClipboard(text, button) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      const originalHtml = button.innerHTML;
      button.innerHTML = '<i class="fas fa-check"></i>';
      button.classList.remove('btn-outline-primary');
      button.classList.add('btn-success');
      setTimeout(() => {
        button.innerHTML = originalHtml;
        button.classList.remove('btn-success');
        button.classList.add('btn-outline-primary');
      }, 1500);
      showGlobalAlert('Short ID copied to clipboard', 'success');
    }
  }

  const highTicketSettings = new HighTicketSettingsComponent();
  const orderPaidSettings = new OrderPaidSettingsComponent();
  const paymentMethodSettings = new PaymentMethodSettingsComponent();
  const facebookSinglePixelComponent = new FacebookSinglePixelComponent();
});
