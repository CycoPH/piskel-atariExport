(function () {
  var ns = $.namespace('pskl.controller.settings');

  var settings = {
    'user' : {
      template : 'templates/settings/application.html',
      controller : ns.ApplicationSettingsController
    },
    'resize' : {
      template : 'templates/settings/resize.html',
      controller : ns.resize.ResizeController
    },
    'export' : {
      template : 'templates/settings/export.html',
      controller : ns.exportimage.ImageExportController
    },
    'import' : {
      template : 'templates/settings/import.html',
      controller : ns.ImportController
    },
    'localstorage' : {
      template : 'templates/settings/localstorage.html',
      controller : ns.LocalStorageController
    },
    'save' : {
      template : 'templates/settings/save.html',
      controller : ns.SaveController
    }
  };

  var SEL_SETTING_CLS = 'has-expanded-drawer';
  var EXP_DRAWER_CLS = 'expanded';

  ns.SettingsController = function (piskelController) {
    this.piskelController = piskelController;
    this.settingsContainer = document.querySelector('[data-pskl-controller=settings]');
    this.drawerContainer = document.getElementById('drawer-container');
    this.isExpanded = false;
    this.currentSetting = null;
  };

  /**
   * @public
   */
  ns.SettingsController.prototype.init = function() {
    pskl.utils.Event.addEventListener(this.settingsContainer, 'click', this.onSettingContainerClick, this);
    pskl.utils.Event.addEventListener(document.body, 'click', this.onBodyClick, this);

    $.subscribe(Events.CLOSE_SETTINGS_DRAWER, this.closeDrawer.bind(this));
  };

  ns.SettingsController.prototype.onSettingContainerClick = function (evt) {
    var setting = pskl.utils.Dom.getData(evt.target, 'setting');
    if (!setting) {
      return;
    }

    if (this.currentSetting != setting) {
      this.loadSetting(setting);
    } else {
      this.closeDrawer();
    }

    evt.stopPropagation();
    evt.preventDefault();
  };

  ns.SettingsController.prototype.onBodyClick = function (evt) {
    var target = evt.target;

    var isInDrawerContainer = pskl.utils.Dom.isParent(target, this.drawerContainer);
    var isInSettingsIcon = target.dataset.setting;
    var isInSettingsContainer = isInDrawerContainer || isInSettingsIcon;

    if (this.isExpanded && !isInSettingsContainer) {
      this.closeDrawer();
    }
  };

  ns.SettingsController.prototype.loadSetting = function (setting) {
    this.drawerContainer.innerHTML = pskl.utils.Template.get(settings[setting].template);

    // when switching settings controller, destroy previously loaded controller
    this.destroyCurrentController_();

    this.currentSetting = setting;
    this.currentController = new settings[setting].controller(this.piskelController);
    this.currentController.init();

    pskl.utils.Dom.removeClass(SEL_SETTING_CLS);
    var selectedSettingButton = document.querySelector('[data-setting=' + setting + ']');
    if (selectedSettingButton) {
      selectedSettingButton.classList.add(SEL_SETTING_CLS);
    }
    this.settingsContainer.classList.add(EXP_DRAWER_CLS);

    this.isExpanded = true;
  };

  ns.SettingsController.prototype.closeDrawer = function () {
    pskl.utils.Dom.removeClass(SEL_SETTING_CLS);
    this.settingsContainer.classList.remove(EXP_DRAWER_CLS);

    this.isExpanded = false;
    this.currentSetting = null;
    document.activeElement.blur();

    this.destroyCurrentController_();
  };

  ns.SettingsController.prototype.destroyCurrentController_ = function () {
    if (this.currentController && this.currentController.destroy) {
      this.currentController.destroy();
      this.currentController = null;
    }
  };
})();
