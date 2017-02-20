sap.ui.define([
	'jquery.sap.global',
	'sap/ui/core/mvc/Controller',
	'sap/ui/model/Filter',
	'sap/m/Popover',
	'sap/m/Button',
	'sap/ui/model/odata/v2/ODataModel',
	'sap/ui/model/json/JSONModel',
], function (jQuery, Controller, Filter, Popover, Button, ODataModel, JSONModel) {
	"use strict";

	var AppController = Controller.extend("sap.m.nemo.proga.partner.controller.App", {
		onInit: function () {
			//var oModel = new JSONModel(jQuery.sap.getModulePath("sap.ui.nemo.proga.partner.model", "/mock.json"));//удалить

			//oModel.loadData("http://localhost:3000/api/Partners/orders");
			//var oModel = new sap.ui.model.odata.v2.ODataModel("http://localhost:3000/odata/orders?filter[dealerN][n]=7&filter[where][td]=2100-01-01T00:00:00.000Z");
			//oModel.setUseBatch(false);

			//получить список проданных заказов в которых канал продаж указан явным образом
			//var oModelDealerOrders = new sap.ui.model.odata.v2.ODataModel("http://localhost:3000/odata/orders?filter[dealerN][n]=7&filter[where][td]=2100-01-01T00:00:00.000Z");
			//var oModelDealerOrders = new sap.ui.model.json.JSONModel("http://localhost:3000/api/orders?filter[where][dealerN]="&dealerN&"&filter[where][td]=2100-01-01T00:00:00.000Z");

			//получаем список заказов
			//var oModel = new sap.ui.model.json.JSONModel("http://localhost:3000/api/orders?filter[where][dealerN]=7&filter[where][td]=2100-01-01T00:00:00.000Z");

			//получить список клиентов когда-либо связанных с каналом продаж
			//var oСlents = new sap.ui.model.json.JSONModel("http://localhost:3000/api/clients");

			//получить список проданных заказов этих клиентов
			//заменить первые даты каналов продаж на даты первой продажи
			//исключить во втором списке заказов заказы из первого списка
			//проставить каналы продаж в заказах в соответствии с каналом продаж клиента и датой
			//вернуть результат

			var	oSettingsModel = new JSONModel("http://" + this._hostname + "/api/Partner/settings");
			this.getView().setModel(oSettingsModel,"Settings");

			var oAuthModel = new JSONModel({
				"username": "",
				"password": ""
			});
			this.getView().setModel(oAuthModel,"Auth");

			var oModel = new JSONModel();
			this.getView().setModel(oModel);

			this._setToggleButtonTooltip(!sap.ui.Device.system.desktop);
		},

		onExit : function () {
			for(var sPropertyName in this._formFragments) {
				if(!this._formFragments.hasOwnProperty(sPropertyName)) {
					return;
				}

				this._formFragments[sPropertyName].destroy();
				this._formFragments[sPropertyName] = null;
			}
		},

		formatDate : function (date) {
			return sap.ui.core.format.DateFormat.getDateInstance({pattern: 'dd.MM.yyyy'}).format(date? new Date(date) : "");
		},

		onItemSelect : function(oEvent) {
			var item = oEvent.getParameter('item');
			var viewId = this.getView().getId();
			sap.ui.getCore().byId(viewId + "--pageContainer").to(viewId + "--" + item.getKey());
		},

		onSideNavButtonPress : function() {
			var viewId = this.getView().getId();
			var toolPage = sap.ui.getCore().byId(viewId + "--toolPage");
			var sideExpanded = toolPage.getSideExpanded();

			this._setToggleButtonTooltip(sideExpanded);

			toolPage.setSideExpanded(!toolPage.getSideExpanded());
		},

		_setToggleButtonTooltip : function(bLarge) {
			var toggleButton = this.getView().byId('sideNavigationToggleButton');
			if (bLarge) {
				toggleButton.setTooltip('Large Size Navigation');
			} else {
				toggleButton.setTooltip('Small Size Navigation');
			}
		},

		handleNav: function(target) {
			var navCon = this.getView().byId("navCon");
			if (target) {
				var animation = "flip";
				navCon.to(this.getView().byId(target), animation);
			} else {
				navCon.back();
			}
		},

		handleAuthPress: function (event) {
			var authPopover = this._authPopover;

			this._showFormFragment('Auth');

			authPopover.openBy(event.getSource());
			sap.ui.getCore().byId("username").bindProperty("value", {model: 'Auth', path: 'Auth>/username'});
			sap.ui.getCore().byId("password").bindProperty("value", {model: 'Auth', path: 'Auth>/password'});
		},

		handleLoginPress: function (event) {

			var oAuthModel = this.getView().getModel("Auth");

			var oModel = new JSONModel();

     	// Post data to the server
     	oModel.loadData("http://" + this._hostname + "/api/UserModels/login", JSON.parse(oAuthModel.getJSON()), false, 'POST');
			oAuthModel.setProperty("/accessToken", JSON.parse(oModel.getJSON()));

			oModel = this.getView().getModel();
			oModel.loadData("http://" + this._hostname + "/api/Partner/orders", {}, true, "GET", true, false, {Autorization: oAuthModel.getProperty("/accessToken").id});

			this.handleNav("toolPage");
		},

		handleLogoutPress: function (event) {
			var oAuthModel = this.getView().getModel("Auth");
			var oModel = this.getView().getModel();

			oModel.setData({});

			oModel = new JSONModel();
			oModel.loadData("http://" + this._hostname + "/api/UserModels/logout", {access_token: oAuthModel.getProperty("/accessToken").id}, false, 'POST', false, false, {Autorization: oAuthModel.getProperty("/accessToken").id});

			oAuthModel.setProperty("/username","");
			oAuthModel.setProperty("/password","");
			oAuthModel.setProperty("/accessToken","");
			this.handleNav("loginPage");
		},

		handleIconTabBarSelect: function (oEvent) {
			var oBinding = this.byId("table").getBinding("rows"),
				sKey = oEvent.getParameter("key"),
				oFilter;
			if (sKey === "New") {
				oFilter = new Filter("status", "EQ", "1");
				oBinding.filter([oFilter]);
			} else if (sKey === "Unpayed") {
				oFilter = new Filter("status", "EQ", "2");
				oBinding.filter([oFilter]);
			} else if (sKey === "Payed") {
				oFilter = new Filter("status", "EQ", "3");
				oBinding.filter([oFilter]);
			} else if (sKey === "Canceled") {
				oFilter = new Filter("status", "EQ", "4");
				oBinding.filter([oFilter]);
			} else {
				oBinding.filter([]);
			}
		},

		handleUpdatePress: function(oEvent) {
			var oAuthModel = this.getView().getModel("Auth");
			var oTableModel = this.getView().getModel();
			var oTable = this.byId("table");
			var hostname = this._hostname;

			oTable.setShowOverlay(true);
			$.post({
				url: "http://" + hostname + "/api/Orders/updateFromMySQL",
				headers: {
					Autorization: oAuthModel.getProperty("/accessToken").id
				},
				timeout: 0
			}).done(function() {
				oTableModel.loadData("http://" + hostname + "/api/Partner/orders", {}, true, "GET", true, false, {Autorization: oAuthModel.getProperty("/accessToken").id});
			}).always(function() {
				oTable.setShowOverlay(false);
			});
		},

		_formFragments: {},

		_hostname: "api.tms.als.local",

		_authPopover: new Popover({
			showHeader: false,
			placement: sap.m.PlacementType.Bottom,
		}).addStyleClass('sapMOTAPopover sapTntToolHeaderPopover'),

		_getFormFragment: function (sFragmentName) {
			var oFormFragment = this._formFragments[sFragmentName];

			if (oFormFragment) {
				return oFormFragment;
			}

			oFormFragment = sap.ui.xmlfragment("sap.ui.nemo.proga.partner.view." + sFragmentName, this);

			var oAuthModel = this.getView().getModel("Auth");
			oFormFragment.setModel(oAuthModel,"Auth");

			return this._formFragments[sFragmentName] = oFormFragment;
		},

		_showFormFragment : function (sFragmentName) {
			var authPopover = this._authPopover;

			authPopover.removeAllContent();
			authPopover.insertContent(this._getFormFragment(sFragmentName));
		}

	});

	return AppController;

});